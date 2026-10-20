/**
 * خدمة الرفع إلى Cloudinary والتخزين السحابي للتسجيلات الصوتية والصور
 * Cloudinary Upload Service for Quran Recitations & Profiles
 */

export interface CloudinaryUploadResponse {
  success: boolean;
  secureUrl: string;
  publicId?: string;
  duration?: number;
  format?: string;
  bytes?: number;
  error?: string;
}

/**
 * تحويل ملف Blob إلى سلسلة Base64
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * رفع تسجيل صوتي (Audio Blob) إلى Cloudinary
 * يحاول أولاً عبر واجهة Cloudinary المباشرة إذا تم ضبط إعدادات العميل،
 * ثم يحاول عبر خادم المنصة، مع ضمان عدم الفشل عبر Data URL محلي في أسوأ الظروف.
 */
export async function uploadAudioToCloudinary(
  audioBlob: Blob,
  metadata?: {
    studentId?: string;
    studentName?: string;
    surahName?: string;
    ayahRange?: string;
  }
): Promise<CloudinaryUploadResponse> {
  try {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'rehab-quran';
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'quran_audio_preset';

    // 1. محاولة الرفع المباشر إلى Cloudinary إذا كان متاحاً
    if (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME && import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET) {
      try {
        const formData = new FormData();
        formData.append('file', audioBlob);
        formData.append('upload_preset', uploadPreset);
        formData.append('resource_type', 'auto');
        formData.append('folder', 'rehab_recitations');

        const directRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (directRes.ok) {
          const directData = await directRes.json();
          return {
            success: true,
            secureUrl: directData.secure_url || directData.url,
            publicId: directData.public_id,
            duration: directData.duration,
            format: directData.format,
            bytes: directData.bytes,
          };
        }
      } catch (directErr) {
        console.warn('[Cloudinary] Direct upload attempt failed, trying server proxy:', directErr);
      }
    }

    // 2. محاولة الرفع عبر نقطة نهاية الخادم
    const base64 = await blobToBase64(audioBlob);
    const fileName = `recitation_${Date.now()}_${metadata?.studentId || 'std'}.webm`;

    try {
      const serverRes = await fetch('/api/upload/cloudinary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64: base64,
          type: 'audio',
          filename: fileName,
          metadata,
        }),
      });

      if (serverRes.ok) {
        const serverData = await serverRes.json();
        if (serverData.secureUrl) {
          return {
            success: true,
            secureUrl: serverData.secureUrl,
            publicId: serverData.publicId,
          };
        }
      }
    } catch (serverErr) {
      console.warn('[Cloudinary] Server upload proxy failed, falling back to base64 audio:', serverErr);
    }

    // 3. الحل الاحتياطي المضمون: استخدام الـ Base64 لضمان عدم ضياع التسميع
    return {
      success: true,
      secureUrl: base64,
      publicId: `local_${Date.now()}`,
    };
  } catch (err: any) {
    console.error('[Cloudinary] Critical error during audio upload:', err);
    return {
      success: false,
      secureUrl: '',
      error: err?.message || 'فشل رفع التسجيل الصوتي إلى خوادم التخزين السحابي.',
    };
  }
}

/**
 * رفع صورة شخصية للطالب إلى Cloudinary
 */
export async function uploadImageToCloudinary(
  imageBlob: Blob | File,
  folder: string = 'rehab_profiles'
): Promise<CloudinaryUploadResponse> {
  try {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'rehab-quran';
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'quran_profile_preset';

    // 1. محاولة مباشرة
    if (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME && import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET) {
      try {
        const formData = new FormData();
        formData.append('file', imageBlob);
        formData.append('upload_preset', uploadPreset);
        formData.append('folder', folder);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          return {
            success: true,
            secureUrl: data.secure_url || data.url,
            publicId: data.public_id,
          };
        }
      } catch (e) {
        console.warn('[Cloudinary Image] Direct upload failed, falling back to server proxy:', e);
      }
    }

    // 2. خادم التطبيق
    const base64 = await blobToBase64(imageBlob);
    try {
      const serverRes = await fetch('/api/upload/cloudinary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64: base64,
          type: 'image',
          filename: `profile_${Date.now()}.png`,
        }),
      });

      if (serverRes.ok) {
        const serverData = await serverRes.json();
        if (serverData.secureUrl) {
          return {
            success: true,
            secureUrl: serverData.secureUrl,
            publicId: serverData.publicId,
          };
        }
      }
    } catch {}

    // 3. استخدام Base64 كحل احتياطي
    return {
      success: true,
      secureUrl: base64,
      publicId: `local_img_${Date.now()}`,
    };
  } catch (err: any) {
    return {
      success: false,
      secureUrl: '',
      error: err?.message || 'فشل رفع الصورة.',
    };
  }
}
