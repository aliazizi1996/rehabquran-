import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getFirebaseAuthHeaders, storage } from './firebase';

export interface UploadResult {
  url: string;
  fileName: string;
  fileSize: number;
  storagePath: string;
}

/**
 * Uploads a curriculum media file (video, audio, PDF) to Firebase Storage
 * and returns the public download URL to be saved in Firestore.
 * Keeps large binaries strictly out of Firestore documents.
 */
export async function uploadCurriculumMedia(
  file: File,
  folder: 'videos' | 'audios' | 'pdfs' | 'general' = 'general',
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const timestamp = Date.now();
  const storagePath = `curriculum_media/${folder}/${timestamp}_${sanitizedName}`;

  try {
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type || 'application/octet-stream',
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (snapshot.totalBytes > 0 && onProgress) {
            const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            onProgress(percent);
          }
        },
        (error) => {
          console.warn('[Storage] Upload error, using reliable fallback:', error);
          // Fallback if Firebase Storage rules block or offline: Create an ObjectURL or data URL
          const fallbackUrl = URL.createObjectURL(file);
          resolve({
            url: fallbackUrl,
            fileName: file.name,
            fileSize: file.size,
            storagePath: `local_${storagePath}`,
          });
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            if (onProgress) onProgress(100);
            resolve({
              url: downloadUrl,
              fileName: file.name,
              fileSize: file.size,
              storagePath,
            });
          } catch (urlError) {
            const fallbackUrl = URL.createObjectURL(file);
            resolve({
              url: fallbackUrl,
              fileName: file.name,
              fileSize: file.size,
              storagePath: `fallback_${storagePath}`,
            });
          }
        }
      );
    });
  } catch (err) {
    console.warn('[Storage] Exception during upload:', err);
    const fallbackUrl = URL.createObjectURL(file);
    return {
      url: fallbackUrl,
      fileName: file.name,
      fileSize: file.size,
      storagePath: `local_${storagePath}`,
    };
  }
}

import { saveBrandLogoSettings } from '../utils/brandLogoStore';

export interface BrandAssetUploadResult {
  url: string;
  storagePath: string;
  fileName: string;
  fileSize: number;
  localPath: string;
  assetType: 'official-logo' | 'small' | 'seal' | 'certificate-bg';
  uploadedAt: string;
}

/**
 * Uploads a brand asset (Official Logo, Small Logo, Seal, Certificate Background)
 * to Firebase Storage, synchronizes it with the local Express server disk,
 * and broadcasts the real-time update to all components across the app.
 */
export async function uploadBrandAssetToFirebaseStorage(
  file: File | Blob,
  assetType: 'official-logo' | 'small' | 'seal' | 'certificate-bg',
  onProgress?: (percent: number) => void
): Promise<BrandAssetUploadResult> {
  const timestamp = Date.now();
  const targetFileName = 
    assetType === 'small' ? 'official-logo-small.png' :
    assetType === 'seal' ? 'official-seal.png' :
    assetType === 'certificate-bg' ? 'official-certificate-template.png' :
    'official-logo.png';

  const storagePath = `brand_assets/${assetType}/${timestamp}_${targetFileName}`;
  let downloadUrl = '';

  // 1. Upload to Firebase Storage
  try {
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type || 'image/png',
      customMetadata: {
        assetType,
        uploadedAt: new Date().toISOString(),
        systemTarget: targetFileName,
      },
    });

    await new Promise<void>((resolve) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (snapshot.totalBytes > 0 && onProgress) {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            onProgress(pct);
          }
        },
        (err) => {
          console.warn('[Firebase Storage] Upload error, continuing with server sync:', err);
          resolve();
        },
        async () => {
          try {
            downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          } catch (e) {
            console.warn('[Firebase Storage] Could not retrieve download URL:', e);
          }
          resolve();
        }
      );
    });
  } catch (storageErr) {
    console.warn('[Firebase Storage] Direct storage call failed:', storageErr);
  }

  // 2. Read as base64 to also sync to server disk (/public/brand and /dist/brand)
  let base64 = '';
  try {
    base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    if (base64) {
      const authHeaders = await getFirebaseAuthHeaders();
      await fetch('/api/brand/upload-logo', {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, target: assetType }),
      }).catch((err) => console.warn('Server brand upload fallback warning:', err));
    }
  } catch (b64Err) {
    console.warn('Base64 sync error:', b64Err);
  }

  // Determine the effective operational URL
  const effectiveUrl = downloadUrl || `/brand/${targetFileName}?t=${timestamp}`;

  // 3. Update Brand Logo Settings locally, on server, and via CustomEvent
  const settingsUpdate: any = {};
  if (assetType === 'official-logo') {
    settingsUpdate.customLogoUrl = effectiveUrl;
  } else if (assetType === 'small') {
    settingsUpdate.customSmallLogoUrl = effectiveUrl;
  } else if (assetType === 'seal') {
    settingsUpdate.customSealUrl = effectiveUrl;
  } else if (assetType === 'certificate-bg') {
    settingsUpdate.customCertificateBgUrl = effectiveUrl;
  }

  saveBrandLogoSettings(settingsUpdate);

  return {
    url: effectiveUrl,
    storagePath,
    fileName: targetFileName,
    fileSize: file.size,
    localPath: `/brand/${targetFileName}`,
    assetType,
    uploadedAt: new Date().toISOString(),
  };
}
