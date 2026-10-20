/**
 * محرر ومصمم الشهادات القرآنية التفاعلي المتقدم - مقرأة رحاب القرآن الإلكترونية
 * Advanced Interactive Certificate Studio & Editor
 * 
 * يفي بكافة متطلبات لوحة المالك:
 * 1. رفع التصميمات والإطارات وإدارتها ومعرض كامل
 * 2. الكتابة التفاعلية بالسحب وتغيير الخط (Amiri, Noto Kufi) والحجم واللون والمحاذاة والحقول الديناميكية
 * 3. الختم الإلكتروني وتحديد موقعه وحجمه وإمكانية إضافة أكثر من ختم
 * 4. التوقيعات (إدارة يميناً، معلم يساراً، رفع أو رسم حي بالكانفاس)
 * 5. توليد ومزامنة QR Code للتحقق و Barcode للرقم الأكاديمي
 * 6. الرقم الأكاديمي التلقائي واليدوي
 * 7. حفظ القالب، تصدير PDF عالي الدقة (jsPDF A4)، طباعة ومعاينة مباشرة
 * 8. إدارة وحفظ قوالب متعددة (طلاب، معلمين، إجازات)
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Canvas, 
  FabricText, 
  IText, 
  FabricImage, 
  Rect, 
  Circle,
  FabricObject 
} from 'fabric';
import JsBarcode from 'jsbarcode';
import { QRCodeCanvas } from 'qrcode.react';
import jsPDF from 'jspdf';
import {
  Award, Upload, Type, Shield, PenTool, QrCode, Barcode,
  Save, Download, Printer, Eye, Trash2, Plus, Sparkles,
  RotateCcw, Copy, Check, Layers, Image as ImageIcon,
  Palette, Sliders, ChevronDown, CheckCircle2, AlertCircle,
  FileText, ArrowRight, UserCheck, RefreshCw, X, ZoomIn, ZoomOut,
  BookOpen, Bookmark, FileDown, CheckCheck
} from 'lucide-react';

import {
  CertificateTemplate,
  UploadedDesignAsset,
  DEFAULT_CERTIFICATE_TEMPLATES,
  getCertificateTemplates,
  saveCertificateTemplate,
  deleteCertificateTemplate,
  getUploadedDesignAssets,
  saveDesignAsset,
  deleteDesignAsset,
  issueVerifiedCertificate,
} from '../../../services/certificateTemplateService';
import {
  CertificateFrameItem,
  PRESET_CERTIFICATE_FRAMES,
  PRESET_CERTIFICATE_BACKGROUNDS,
  getLocalSavedFrames,
  saveFrameToLocalLibrary,
  deleteFrameFromLocalLibrary,
} from '../../../data/certificateFramesLibrary';
import { uploadImageToCloudinary } from '../../../services/cloudinaryService';
import { getRegisteredStudents, RegisteredStudent } from '../../../data/registrationStore';
import { OfficialLogo, OfficialStamp } from '../../OfficialLogo';

interface CertificateStudioEditorProps {
  onBack?: () => void;
  onCertificateIssued?: (cert: any) => void;
}

export const CertificateStudioEditor: React.FC<CertificateStudioEditorProps> = ({
  onBack,
  onCertificateIssued,
}) => {
  // -------------------------------------------------------------
  // States & Refs
  // -------------------------------------------------------------
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const signaturePadCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Template states
  const [templates, setTemplates] = useState<CertificateTemplate[]>(DEFAULT_CERTIFICATE_TEMPLATES);
  const [activeTemplate, setActiveTemplate] = useState<CertificateTemplate>(DEFAULT_CERTIFICATE_TEMPLATES[0]);
  const [templateTitle, setTemplateTitle] = useState(activeTemplate.title);
  const [templateCategory, setTemplateCategory] = useState<CertificateTemplate['category']>(activeTemplate.category);

  // Uploaded Assets states (Backgrounds, Frames, Seals, Signatures)
  const [designAssets, setDesignAssets] = useState<UploadedDesignAsset[]>([]);
  const [activeTab, setActiveTab] = useState<'design' | 'text' | 'seal' | 'signature' | 'code' | 'templates'>('design');

  // Dynamic Fields data for preview
  const [studentName, setStudentName] = useState('عبد الرحمن محمد باعبيد');
  const [courseTitle, setCourseTitle] = useState('حفظ وتثبيت جزء عمّ كاملاً مع أحكام التجويد');
  const [sheikhTeacherName, setSheikhTeacherName] = useState('فضيلة الشيخ إبراهيم الوصابي');
  const [adminSignerName, setAdminSignerName] = useState('د. علي عزيزي');
  const [academicId, setAcademicId] = useState('RQ-2026-6365');
  const [issueDate, setIssueDate] = useState('15 شعبان 1447 هـ / 2026 م');
  const [grade, setGrade] = useState('ممتاز مرتفع (99%)');
  const [riwayah, setRiwayah] = useState('برواية حفص عن عاصم بالسند المتصل');

  // Registered students list for auto-fill
  const [registeredStudents, setRegisteredStudents] = useState<RegisteredStudent[]>(() => getRegisteredStudents());

  // Selected Object Properties
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [selectedTextProps, setSelectedTextProps] = useState<{
    text: string;
    fontSize: number;
    fontFamily: string;
    fill: string;
    fontWeight: string;
    textAlign: string;
  }>({
    text: '',
    fontSize: 24,
    fontFamily: 'Amiri',
    fill: '#046A38',
    fontWeight: 'normal',
    textAlign: 'center',
  });

  // UI & Feedback states
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signatureTargetRole, setSignatureTargetRole] = useState<'admin' | 'teacher'>('admin');
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const [zoomScale, setZoomScale] = useState(0.85);

  // Frames & Backgrounds Library States
  const [designSubTab, setDesignSubTab] = useState<'presets-frames' | 'presets-backgrounds' | 'my-library' | 'upload-new'>('presets-frames');
  const [localSavedFrames, setLocalSavedFrames] = useState<CertificateFrameItem[]>(() => getLocalSavedFrames());
  const [previewModalAsset, setPreviewModalAsset] = useState<{
    isOpen: boolean;
    item?: any;
    type?: 'frame' | 'background';
  }>({ isOpen: false });
  const [templateFilter, setTemplateFilter] = useState<'all' | 'appreciation' | 'students' | 'ijaza' | 'matn' | 'teachers'>('all');

  // Custom Upload Form States
  const [customUploadTitle, setCustomUploadTitle] = useState('');
  const [customUploadType, setCustomUploadType] = useState<'frame' | 'background'>('frame');
  const [customUploadSaveToLibrary, setCustomUploadSaveToLibrary] = useState(true);
  const [customUploadPreviewUrl, setCustomUploadPreviewUrl] = useState<string | null>(null);
  const [customUploadFile, setCustomUploadFile] = useState<File | null>(null);

  // Hidden QR code canvas ref for generating data URL
  const hiddenQrRef = useRef<HTMLDivElement>(null);

  // -------------------------------------------------------------
  // Initial Canvas Setup (Fabric.js 7)
  // -------------------------------------------------------------
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: 1123,
      height: 794,
      backgroundColor: '#F9F6F0',
      selection: true,
      preserveObjectStacking: true,
    });

    fabricCanvasRef.current = canvas;

    // Selection listeners
    const handleSelection = () => {
      const activeObj = canvas.getActiveObject();
      setSelectedObject(activeObj || null);
      if (activeObj && (activeObj instanceof IText || activeObj instanceof FabricText)) {
        setSelectedTextProps({
          text: (activeObj as any).text || '',
          fontSize: (activeObj as any).fontSize || 24,
          fontFamily: (activeObj as any).fontFamily || 'Amiri',
          fill: (activeObj as any).fill || '#046A38',
          fontWeight: (activeObj as any).fontWeight || 'normal',
          textAlign: (activeObj as any).textAlign || 'center',
        });
      }
    };

    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', () => {
      setSelectedObject(null);
    });

    // Load initial template
    loadTemplateToCanvas(activeTemplate, canvas);

    // Fetch saved templates & assets from Firestore
    fetchTemplatesAndAssets();

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, []);

  // Fetch Firestore templates and uploaded design assets
  const fetchTemplatesAndAssets = async () => {
    try {
      const [fetchedTemplates, fetchedAssets] = await Promise.all([
        getCertificateTemplates(),
        getUploadedDesignAssets(),
      ]);
      if (fetchedTemplates.length > 0) {
        setTemplates(fetchedTemplates);
      }
      setDesignAssets(fetchedAssets);
    } catch (err) {
      console.warn('[Studio] Error loading initial data:', err);
    }
  };

  // -------------------------------------------------------------
  // Canvas Rendering & Template Loading
  // -------------------------------------------------------------
  const loadTemplateToCanvas = async (tmpl: CertificateTemplate, canvasInstance?: Canvas) => {
    const canvas = canvasInstance || fabricCanvasRef.current;
    if (!canvas) return;

    canvas.clear();
    canvas.backgroundColor = '#F9F6F0';

    // 1. Draw Default Ornate Borders & Background if no custom background
    if (!tmpl.backgroundUrl) {
      // Ornate Border outer
      const outerRect = new Rect({
        left: 20,
        top: 20,
        width: 1083,
        height: 754,
        fill: '#F9F6F0',
        stroke: '#C5A059',
        strokeWidth: 3,
        selectable: false,
        evented: false,
      });

      // Inner ornate emerald border
      const innerRect = new Rect({
        left: 32,
        top: 32,
        width: 1059,
        height: 730,
        fill: 'transparent',
        stroke: '#046A38',
        strokeWidth: 1.5,
        strokeDashArray: [10, 5],
        selectable: false,
        evented: false,
      });

      // Subtle center watermark logo
      const watermarkImg = new Image();
      watermarkImg.src = '/brand/official-seal.png';
      watermarkImg.crossOrigin = 'anonymous';
      watermarkImg.onload = () => {
        const fabricWatermark = new FabricImage(watermarkImg, {
          left: 561,
          top: 397,
          originX: 'center',
          originY: 'center',
          scaleX: 0.9,
          scaleY: 0.9,
          opacity: 0.05,
          selectable: false,
          evented: false,
        });
        canvas.add(fabricWatermark);
        canvas.sendObjectToBack(fabricWatermark);
        canvas.renderAll();
      };

      canvas.add(outerRect);
      canvas.add(innerRect);
    } else {
      // Load custom background image
      const bgImg = new Image();
      bgImg.crossOrigin = 'anonymous';
      bgImg.src = tmpl.backgroundUrl;
      bgImg.onload = () => {
        const fabricBg = new FabricImage(bgImg, {
          left: 0,
          top: 0,
          scaleX: 1123 / (bgImg.width || 1123),
          scaleY: 794 / (bgImg.height || 794),
          selectable: false,
          evented: false,
        });
        canvas.add(fabricBg);
        canvas.sendObjectToBack(fabricBg);
        canvas.renderAll();
      };
    }

    // 2. Load Frame if present
    if (tmpl.frameUrl) {
      const frameImg = new Image();
      frameImg.crossOrigin = 'anonymous';
      frameImg.src = tmpl.frameUrl;
      frameImg.onload = () => {
        const fabricFrame = new FabricImage(frameImg, {
          left: 0,
          top: 0,
          scaleX: 1123 / (frameImg.width || 1123),
          scaleY: 794 / (frameImg.height || 794),
          opacity: tmpl.frameOpacity ?? 0.9,
          selectable: false,
          evented: false,
        });
        canvas.add(fabricFrame);
        canvas.renderAll();
      };
    }

    // 3. Load Text Elements
    tmpl.textElements.forEach((el) => {
      const displayText = resolveDynamicPlaceholders(el.text);
      const textObj = new IText(displayText, {
        left: el.left,
        top: el.top,
        fontSize: el.fontSize,
        fontFamily: el.fontFamily || 'Amiri',
        fill: el.fill || '#046A38',
        fontWeight: el.fontWeight || 'normal',
        textAlign: el.textAlign || 'center',
        originX: el.textAlign === 'center' ? 'center' : el.textAlign === 'right' ? 'right' : 'left',
        originY: 'center',
        selectable: true,
        data: { id: el.id, fieldKey: el.fieldKey, templateRawText: el.text },
      });
      canvas.add(textObj);
    });

    // 4. Load Seals and Signatures
    tmpl.imageElements.forEach((imgEl) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imgEl.url;
      img.onload = () => {
        const fabricImg = new FabricImage(img, {
          left: imgEl.left,
          top: imgEl.top,
          originX: 'center',
          originY: 'center',
          scaleX: imgEl.scaleX,
          scaleY: imgEl.scaleY,
          angle: imgEl.angle || 0,
          opacity: imgEl.opacity ?? 1,
          selectable: true,
          data: { id: imgEl.id, type: imgEl.type, role: imgEl.role },
        });
        canvas.add(fabricImg);
        canvas.renderAll();
      };
    });

    // 5. Load QR Code & Barcode
    addQRCodeToCanvas(canvas, 980, 690);
    addBarcodeToCanvas(canvas, academicId, 140, 695);

    canvas.renderAll();
  };

  // Replace [اسم الطالب] and dynamic tokens
  const resolveDynamicPlaceholders = (text: string) => {
    return text
      .replace(/\[اسم الطالب\]|{{اسم الطالب}}/g, studentName)
      .replace(/\[البرنامج\]|{{البرنامج}}/g, courseTitle)
      .replace(/\[اسم الشيخ\]|{{اسم الشيخ}}/g, sheikhTeacherName)
      .replace(/\[المشرف العام\]|{{المشرف العام}}/g, adminSignerName)
      .replace(/\[الرقم الأكاديمي\]|{{الرقم الأكاديمي}}/g, academicId)
      .replace(/\[التاريخ\]|{{التاريخ}}/g, issueDate)
      .replace(/\[التقدير\]|{{التقدير}}/g, grade)
      .replace(/\[الرواية\]|{{الرواية}}/g, riwayah);
  };

  // Re-apply all dynamic fields to existing text elements on canvas
  const refreshCanvasDynamicTexts = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.getObjects().forEach((obj) => {
      if ((obj instanceof IText || obj instanceof FabricText) && (obj as any).data?.templateRawText) {
        const raw = (obj as any).data.templateRawText;
        (obj as any).set('text', resolveDynamicPlaceholders(raw));
      }
    });

    // Re-draw barcode
    updateBarcodeOnCanvas(academicId);
    // Re-draw QR Code using qrcode.react
    updateQRCodeOnCanvas(academicId);
    canvas.renderAll();
  };

  // -------------------------------------------------------------
  // QR Code & Barcode Helpers (qrcode.react & JsBarcode)
  // -------------------------------------------------------------
  const addQRCodeToCanvas = (canvas: Canvas, left = 980, top = 690) => {
    const renderQrFromElement = () => {
      const qrCanvas = document.getElementById('cert-offscreen-qrcode') as HTMLCanvasElement | null;
      if (qrCanvas) {
        try {
          const dataUrl = qrCanvas.toDataURL('image/png');
          const qrImg = new Image();
          qrImg.src = dataUrl;
          qrImg.onload = () => {
            const existingQr = canvas.getObjects().find((o) => (o as any).data?.type === 'qr_code');
            if (existingQr) {
              left = existingQr.left || left;
              top = existingQr.top || top;
              canvas.remove(existingQr);
            }

            const qrFabric = new FabricImage(qrImg, {
              left,
              top,
              originX: 'center',
              originY: 'center',
              scaleX: 0.75,
              scaleY: 0.75,
              selectable: true,
              data: { type: 'qr_code', id: `qr-${Date.now()}` },
            });
            canvas.add(qrFabric);
            canvas.renderAll();
          };
          return true;
        } catch (err) {
          console.warn('[QRCode] Error reading offscreen canvas:', err);
        }
      }
      return false;
    };

    if (!renderQrFromElement()) {
      setTimeout(renderQrFromElement, 120);
    }
  };

  const updateQRCodeOnCanvas = (targetAcademicId?: string) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const existingQr = canvas.getObjects().find((o) => (o as any).data?.type === 'qr_code');
    const left = existingQr ? existingQr.left : 980;
    const top = existingQr ? existingQr.top : 690;

    setTimeout(() => {
      addQRCodeToCanvas(canvas, left, top);
    }, 60);
  };

  const addBarcodeToCanvas = (canvas: Canvas, codeText: string, left = 140, top = 695) => {
    try {
      const barcodeCanvas = document.createElement('canvas');
      JsBarcode(barcodeCanvas, codeText, {
        format: 'CODE128',
        displayValue: true,
        fontSize: 14,
        font: 'Noto Kufi Arabic',
        lineColor: '#046A38',
        background: '#ffffff',
        width: 1.5,
        height: 38,
        margin: 4,
      });

      const barcodeDataUrl = barcodeCanvas.toDataURL('image/png');
      const barcodeImg = new Image();
      barcodeImg.src = barcodeDataUrl;
      barcodeImg.onload = () => {
        const barcodeFabric = new FabricImage(barcodeImg, {
          left,
          top,
          originX: 'center',
          originY: 'center',
          selectable: true,
          data: { type: 'barcode', id: 'bar-main' },
        });
        canvas.add(barcodeFabric);
        canvas.renderAll();
      };
    } catch (err) {
      console.warn('[Barcode] Error rendering barcode:', err);
    }
  };

  const updateBarcodeOnCanvas = (codeText: string) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const existingBarcode = canvas.getObjects().find((o) => (o as any).data?.type === 'barcode');
    if (existingBarcode) {
      const left = existingBarcode.left;
      const top = existingBarcode.top;
      canvas.remove(existingBarcode);
      addBarcodeToCanvas(canvas, codeText, left, top);
    }
  };

  // -------------------------------------------------------------
  // Text Insertion & Editing Controls
  // -------------------------------------------------------------
  const handleAddText = (customInitial = 'نص جديد في الشهادة', fieldKey: any = 'custom') => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const displayText = resolveDynamicPlaceholders(customInitial);
    const newText = new IText(displayText, {
      left: 561,
      top: 350,
      fontSize: 24,
      fontFamily: 'Amiri',
      fill: '#046A38',
      fontWeight: 'bold',
      textAlign: 'center',
      originX: 'center',
      originY: 'center',
      selectable: true,
      data: { id: `txt-${Date.now()}`, fieldKey, templateRawText: customInitial },
    });

    canvas.add(newText);
    canvas.setActiveObject(newText);
    canvas.renderAll();
  };

  const handleUpdateSelectedTextProp = (key: string, val: any) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active || !(active instanceof IText || active instanceof FabricText)) return;

    active.set(key as any, val);
    setSelectedTextProps((prev) => ({ ...prev, [key]: val }));
    canvas.renderAll();
  };

  const handleDeleteSelected = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    canvas.remove(active);
    setSelectedObject(null);
    canvas.renderAll();
  };

  // -------------------------------------------------------------
  // Upload Background Design / Frame (Quick File Input)
  // -------------------------------------------------------------
  const handleUploadDesign = async (e: React.ChangeEvent<HTMLInputElement>, assetType: 'background' | 'frame') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setFeedback(null);

    try {
      // 1. Upload to Cloudinary (or local server proxy)
      const res = await uploadImageToCloudinary(file, assetType === 'background' ? 'certificate_backgrounds' : 'certificate_frames');
      const uploadedUrl = res.secureUrl || URL.createObjectURL(file);

      // 2. Save in Firestore assets collection
      const saved = await saveDesignAsset({
        title: file.name.replace(/\.[^/.]+$/, ''),
        type: assetType,
        url: uploadedUrl,
        cloudinaryPublicId: res.publicId,
      });

      // 3. Save also in Local Library for instant offline availability
      saveFrameToLocalLibrary({
        id: saved.id,
        title: saved.title,
        category: 'uploaded',
        type: assetType,
        description: `تصميم مرفوع مخصص (${assetType === 'frame' ? 'إطار شفاف' : 'خلفية كاملة'})`,
        dataUri: uploadedUrl,
        aspectRatio: '1123:794',
        defaultOpacity: assetType === 'frame' ? 0.95 : 1,
      });

      setDesignAssets((prev) => [saved, ...prev]);
      setLocalSavedFrames(getLocalSavedFrames());

      // 4. Apply immediately to active template on canvas
      if (assetType === 'background') {
        setActiveTemplate((prev) => ({ ...prev, backgroundUrl: uploadedUrl }));
        applyBackgroundImageToCanvas(uploadedUrl);
      } else {
        setActiveTemplate((prev) => ({ ...prev, frameUrl: uploadedUrl }));
        applyFrameImageToCanvas(uploadedUrl);
      }

      setFeedback({ type: 'success', message: `تم رفع ${assetType === 'background' ? 'تصميم الشهادة' : 'الإطار المزخرف'} وتطبيقه وحفظه في المكتبة بنجاح!` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'فشل رفع التصميم.' });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const applyBackgroundImageToCanvas = (url: string) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Remove existing background object if any
    const existing = canvas.getObjects().find((o) => (o as any).data?.type === 'custom_bg');
    if (existing) canvas.remove(existing);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    img.onload = () => {
      const fabricBg = new FabricImage(img, {
        left: 0,
        top: 0,
        scaleX: 1123 / (img.width || 1123),
        scaleY: 794 / (img.height || 794),
        selectable: false,
        evented: false,
        data: { type: 'custom_bg' },
      });
      canvas.add(fabricBg);
      canvas.sendObjectToBack(fabricBg);
      canvas.renderAll();
    };
  };

  const applyFrameImageToCanvas = (url: string) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const existing = canvas.getObjects().find((o) => (o as any).data?.type === 'custom_frame');
    if (existing) canvas.remove(existing);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    img.onload = () => {
      const fabricFrame = new FabricImage(img, {
        left: 0,
        top: 0,
        scaleX: 1123 / (img.width || 1123),
        scaleY: 794 / (img.height || 794),
        opacity: activeTemplate.frameOpacity ?? 0.95,
        selectable: false,
        evented: false,
        data: { type: 'custom_frame' },
      });
      canvas.add(fabricFrame);
      // Bring texts and interactive seals forward so they remain cleanly selectable
      canvas.getObjects().forEach((o) => {
        const d = (o as any).data?.type;
        if (d === 'text' || d === 'seal' || d === 'signature' || d === 'qr_code' || d === 'barcode' || o instanceof IText || o instanceof FabricText) {
          canvas.bringObjectToFront(o);
        }
      });
      canvas.renderAll();
    };
  };

  // Preset Frame & Background Application Handlers
  const handleApplyPresetFrame = (frame: CertificateFrameItem) => {
    setActiveTemplate((prev) => ({
      ...prev,
      frameUrl: frame.dataUri,
      frameOpacity: frame.defaultOpacity,
    }));
    applyFrameImageToCanvas(frame.dataUri);
    setFeedback({
      type: 'success',
      message: `تم تطبيق "${frame.title}" على الشهادة بنجاح!`,
    });
  };

  const handleApplyPresetBackground = (bg: CertificateFrameItem) => {
    setActiveTemplate((prev) => ({
      ...prev,
      backgroundUrl: bg.dataUri,
    }));
    applyBackgroundImageToCanvas(bg.dataUri);
    setFeedback({
      type: 'success',
      message: `تم تطبيق "${bg.title}" كخلفية أساسية للشهادة!`,
    });
  };

  const handleRemoveFrame = () => {
    const canvas = fabricCanvasRef.current;
    if (canvas) {
      const existing = canvas.getObjects().find((o) => (o as any).data?.type === 'custom_frame');
      if (existing) canvas.remove(existing);
      canvas.renderAll();
    }
    setActiveTemplate((prev) => ({ ...prev, frameUrl: '' }));
    setFeedback({ type: 'success', message: 'تمت إزالة الإطار المزخرف من الشهادة.' });
  };

  const handleResetBackground = () => {
    setActiveTemplate((prev) => ({ ...prev, backgroundUrl: '' }));
    loadTemplateToCanvas({ ...activeTemplate, backgroundUrl: '' });
    setFeedback({ type: 'success', message: 'تمت استعادة الخلفية العاجية الرسمية المعتمدة (Brand 2026).' });
  };

  // Detailed Custom Asset Upload Form Handler
  const handleProcessCustomUpload = async () => {
    if (!customUploadFile) {
      setFeedback({ type: 'error', message: 'يرجى اختيار ملف صورة (PNG أو JPG أو SVG) أولاً.' });
      return;
    }

    setIsUploading(true);
    setFeedback(null);

    try {
      const title = customUploadTitle.trim() || customUploadFile.name.replace(/\.[^/.]+$/, '');
      const res = await uploadImageToCloudinary(customUploadFile, customUploadType === 'background' ? 'certificate_backgrounds' : 'certificate_frames');
      const finalUrl = res.secureUrl || customUploadPreviewUrl || URL.createObjectURL(customUploadFile);

      // Save in Firestore
      const savedDoc = await saveDesignAsset({
        title,
        type: customUploadType,
        url: finalUrl,
        cloudinaryPublicId: res.publicId,
      });

      // Save in local library
      if (customUploadSaveToLibrary) {
        saveFrameToLocalLibrary({
          id: savedDoc.id,
          title,
          category: 'uploaded',
          type: customUploadType,
          description: `تصميم مخصص تم رفعه وحفظه في المكتبة (${customUploadType === 'frame' ? 'إطار شفاف' : 'خلفية كاملة'})`,
          dataUri: finalUrl,
          aspectRatio: '1123:794',
          defaultOpacity: customUploadType === 'frame' ? 0.95 : 1,
        });
        setLocalSavedFrames(getLocalSavedFrames());
      }

      setDesignAssets((prev) => [savedDoc, ...prev]);

      // Apply to canvas
      if (customUploadType === 'background') {
        setActiveTemplate((prev) => ({ ...prev, backgroundUrl: finalUrl }));
        applyBackgroundImageToCanvas(finalUrl);
      } else {
        setActiveTemplate((prev) => ({ ...prev, frameUrl: finalUrl }));
        applyFrameImageToCanvas(finalUrl);
      }

      // Reset form
      setCustomUploadFile(null);
      setCustomUploadPreviewUrl(null);
      setCustomUploadTitle('');

      setFeedback({
        type: 'success',
        message: `تم رفع وتطبيق وحفظ "${title}" في مكتبة الإطارات بنجاح!`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'فشل رفع التصميم وحفظه.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteLocalFrame = (id: string) => {
    deleteFrameFromLocalLibrary(id);
    setLocalSavedFrames(getLocalSavedFrames());
    setFeedback({ type: 'success', message: 'تم حذف العنصر من مكتبتك المحفوظة.' });
  };

  const handleDeleteAsset = async (assetId: string) => {
    await deleteDesignAsset(assetId);
    setDesignAssets((prev) => prev.filter((a) => a.id !== assetId));
    deleteFrameFromLocalLibrary(assetId);
    setLocalSavedFrames(getLocalSavedFrames());
    setFeedback({ type: 'success', message: 'تم حذف التصميم من المعرض والمكتبة.' });
  };

  // -------------------------------------------------------------
  // Seals (الأختام الإلكترونية)
  // -------------------------------------------------------------
  const handleAddOfficialSeal = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const sealImg = new Image();
    sealImg.crossOrigin = 'anonymous';
    sealImg.src = '/brand/official-seal.png';
    sealImg.onload = () => {
      const fabricSeal = new FabricImage(sealImg, {
        left: 561,
        top: 650,
        originX: 'center',
        originY: 'center',
        scaleX: 0.38,
        scaleY: 0.38,
        opacity: 0.95,
        selectable: true,
        data: { type: 'seal', role: 'official_seal', id: `seal-${Date.now()}` },
      });
      canvas.add(fabricSeal);
      canvas.setActiveObject(fabricSeal);
      canvas.renderAll();
    };
  };

  const handleUploadCustomSeal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await uploadImageToCloudinary(file, 'certificate_seals');
      const sealUrl = res.secureUrl || URL.createObjectURL(file);

      // Save in assets
      await saveDesignAsset({
        title: `ختم - ${file.name}`,
        type: 'seal',
        url: sealUrl,
      });

      // Add to canvas
      const canvas = fabricCanvasRef.current;
      if (canvas) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = sealUrl;
        img.onload = () => {
          const fabricSeal = new FabricImage(img, {
            left: 561,
            top: 640,
            originX: 'center',
            originY: 'center',
            scaleX: 0.35,
            scaleY: 0.35,
            selectable: true,
            data: { type: 'seal', role: 'secondary_seal', id: `seal-${Date.now()}` },
          });
          canvas.add(fabricSeal);
          canvas.setActiveObject(fabricSeal);
          canvas.renderAll();
        };
      }
      setFeedback({ type: 'success', message: 'تم رفع الختم الإلكتروني وإدراجه على الشهادة بنجاح!' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'فشل رفع الختم.' });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // -------------------------------------------------------------
  // Signatures (التوقيعات: رفع أو رسم تفاعلي)
  // -------------------------------------------------------------
  const handleUploadSignature = async (e: React.ChangeEvent<HTMLInputElement>, role: 'admin' | 'teacher') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await uploadImageToCloudinary(file, 'certificate_signatures');
      const sigUrl = res.secureUrl || URL.createObjectURL(file);

      addSignatureToCanvas(sigUrl, role);
      setFeedback({ type: 'success', message: `تم رفع وإدراج ${role === 'admin' ? 'توقيع الإدارة (د. علي عزيزي)' : 'توقيع المعلم'} بنجاح!` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'فشل رفع التوقيع.' });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const addSignatureToCanvas = (url: string, role: 'admin' | 'teacher') => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    img.onload = () => {
      const fabricSig = new FabricImage(img, {
        left: role === 'admin' ? 880 : 240,
        top: 680,
        originX: 'center',
        originY: 'center',
        scaleX: 0.5,
        scaleY: 0.5,
        selectable: true,
        data: { type: 'signature', role: `${role}_signature`, id: `sig-${Date.now()}` },
      });
      canvas.add(fabricSig);
      canvas.setActiveObject(fabricSig);
      canvas.renderAll();
    };
  };

  // Signature Pad Handlers (Drawing Canvas)
  const openSignaturePad = (role: 'admin' | 'teacher') => {
    setSignatureTargetRole(role);
    setIsSignatureModalOpen(true);
    setTimeout(() => {
      const pad = signaturePadCanvasRef.current;
      if (pad) {
        const ctx = pad.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, pad.width, pad.height);
          ctx.strokeStyle = '#046A38';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
        }
      }
    }, 100);
  };

  const handleSignatureMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pad = signaturePadCanvasRef.current;
    if (!pad) return;
    const ctx = pad.getContext('2d');
    if (!ctx) return;

    setIsDrawingSignature(true);
    const rect = pad.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleSignatureMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingSignature) return;
    const pad = signaturePadCanvasRef.current;
    if (!pad) return;
    const ctx = pad.getContext('2d');
    if (!ctx) return;

    const rect = pad.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const handleSignatureMouseUp = () => {
    setIsDrawingSignature(false);
  };

  const clearSignaturePad = () => {
    const pad = signaturePadCanvasRef.current;
    if (!pad) return;
    const ctx = pad.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, pad.width, pad.height);
    }
  };

  const saveSignaturePadToCanvas = () => {
    const pad = signaturePadCanvasRef.current;
    if (!pad) return;

    const dataUrl = pad.toDataURL('image/png');
    addSignatureToCanvas(dataUrl, signatureTargetRole);
    setIsSignatureModalOpen(false);
    setFeedback({ type: 'success', message: 'تم إدراج التوقيع اليدوي في مكانه على الشهادة بنجاح!' });
  };

  // -------------------------------------------------------------
  // Template Saving & Switching
  // -------------------------------------------------------------
  const handleSaveCurrentTemplate = async () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    setIsSaving(true);
    setFeedback(null);

    try {
      // Extract texts
      const textElements: any[] = [];
      const imageElements: any[] = [];
      const codeElements: any[] = [];

      canvas.getObjects().forEach((obj) => {
        const data = (obj as any).data || {};
        if (obj instanceof IText || obj instanceof FabricText) {
          textElements.push({
            id: data.id || `txt-${Date.now()}`,
            type: 'text',
            text: data.templateRawText || (obj as any).text,
            fieldKey: data.fieldKey || 'custom',
            left: obj.left,
            top: obj.top,
            fontSize: (obj as any).fontSize,
            fontFamily: (obj as any).fontFamily,
            fill: (obj as any).fill,
            fontWeight: (obj as any).fontWeight,
            textAlign: (obj as any).textAlign,
          });
        } else if (data.type === 'seal' || data.type === 'signature') {
          imageElements.push({
            id: data.id,
            type: data.type,
            url: (obj as any)._element?.src || '',
            left: obj.left,
            top: obj.top,
            scaleX: obj.scaleX,
            scaleY: obj.scaleY,
            angle: obj.angle,
            role: data.role,
          });
        } else if (data.type === 'qr_code' || data.type === 'barcode') {
          codeElements.push({
            id: data.id,
            type: data.type,
            left: obj.left,
            top: obj.top,
            scaleX: obj.scaleX,
            scaleY: obj.scaleY,
          });
        }
      });

      const updatedTemplate: CertificateTemplate = {
        ...activeTemplate,
        title: templateTitle,
        category: templateCategory,
        textElements,
        imageElements,
        codeElements,
      };

      const saved = await saveCertificateTemplate(updatedTemplate);
      setTemplates((prev) => {
        const idx = prev.findIndex((t) => t.id === saved.id);
        if (idx >= 0) {
          const clone = [...prev];
          clone[idx] = saved;
          return clone;
        }
        return [saved, ...prev];
      });

      setActiveTemplate(saved);
      setFeedback({ type: 'success', message: 'تم حفظ وتحديث قالب الشهادة بنجاح في Firestore!' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'فشل حفظ القالب.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectTemplate = (tmpl: CertificateTemplate) => {
    setActiveTemplate(tmpl);
    setTemplateTitle(tmpl.title);
    setTemplateCategory(tmpl.category);
    loadTemplateToCanvas(tmpl);

    // Apply smart default values when switching between templates
    if (tmpl.category === 'matn' || tmpl.id.includes('matn')) {
      if (!courseTitle || courseTitle.includes('جزء عمّ')) {
        setCourseTitle('مَنْظُومَةُ تُحْفَةِ الأَطْفَالِ وَالغِلْمَان فِي تَجْوِيدِ القُرْآن');
      }
      setRiwayah('مَنْظُومَةٌ تَجْوِيدِيَّةٌ فِي أَحْكَامِ النُّونِ وَالمَدِّ لِلجَمْزُورِيّ');
      setGrade('مُمْتَاز مُرْتَفِع (99%)');
    } else if (tmpl.category === 'appreciation' || tmpl.id.includes('apprec')) {
      if (!courseTitle || courseTitle.includes('جزء عمّ')) {
        setCourseTitle('التَّمَيُّزُ وَالإِتْقَانُ فِي التَّعْلِيمِ القُرْآنِيِّ');
      }
      setGrade('مُمْتَاز (100%)');
    } else if (tmpl.category === 'ijaza' || tmpl.id.includes('ijaza')) {
      if (!courseTitle || courseTitle.includes('جزء عمّ')) {
        setCourseTitle('رِوَايَةُ حَفْصٍ عَنْ عَاصِمٍ مِن طَرِيقِ الشَّاطِبِيَّةِ');
      }
      setRiwayah('بِالسَّنَدِ المُتَّصِلِ إِلَى رَسُولِ اللَّهِ ﷺ');
    } else if (tmpl.category === 'students') {
      if (!courseTitle || courseTitle.includes('تحفة')) {
        setCourseTitle('حِفْظُ وَتَثْبِيتُ القُرْآنِ الكَرِيمِ كَامِلاً');
      }
      setGrade('مُمْتَاز مُرْتَفِع (99%)');
      setRiwayah('بِرِوَايَةِ حَفْصٍ عَنْ عَاصِمٍ بالسَّنَدِ المُتَّصِل');
    }

    setFeedback({
      type: 'success',
      message: `تم تحميل وتفعيل "${tmpl.title}" بنجاح! يمكنك تخصيص كافة النصوص والخطوط والعناصر.`,
    });
  };

  const handleDeleteTemplate = async (tmplId: string) => {
    if (templates.length <= 1) {
      setFeedback({ type: 'error', message: 'لا يمكن حذف القالب الوحيد المتبقي.' });
      return;
    }
    await deleteCertificateTemplate(tmplId);
    setTemplates((prev) => prev.filter((t) => t.id !== tmplId));
    if (activeTemplate.id === tmplId) {
      handleSelectTemplate(templates.find((t) => t.id !== tmplId) || DEFAULT_CERTIFICATE_TEMPLATES[0]);
    }
    setFeedback({ type: 'success', message: 'تم حذف القالب بنجاح.' });
  };

  // -------------------------------------------------------------
  // Export PDF (A4 300 DPI Print Quality) & HD PNG & Print
  // -------------------------------------------------------------
  const handleExportPDF = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Multiplier 3 generates ~3369 x 2382 px for canvas 1123 x 794, delivering 300 DPI print quality
    const dataUrl = canvas.toDataURL({
      multiplier: 3,
      format: 'png',
    });

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    // A4 Landscape exact dimensions: 297mm x 210mm
    pdf.addImage(dataUrl, 'PNG', 0, 0, 297, 210, undefined, 'FAST');

    pdf.setProperties({
      title: `${activeTemplate.title} - ${studentName}`,
      subject: `شهادة معتمدة من مقرأة رحاب القرآن الإلكترونية - رقم أكاديمي: ${academicId}`,
      author: 'مقرأة رحاب القرآن الإلكترونية - المشرف العام د. علي عزيزي',
      creator: 'نظام إدارة الشهادات المعتمد 2026',
    });

    const safeName = studentName.trim().replace(/\s+/g, '_') || 'طالب';
    const safeTitle = activeTemplate.title.replace(/[\/\\]/g, '_').slice(0, 25);
    pdf.save(`شهادة_${safeTitle}_${safeName}_${academicId}.pdf`);

    setFeedback({
      type: 'success',
      message: 'تم تصدير الشهادة بنجاح بصيغة PDF عالية الدقة بجودة طباعة A4 Landscape (300 DPI)!',
    });
  };

  const handleExportPNG = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL({
      multiplier: 3,
      format: 'png',
    });

    const link = document.createElement('a');
    link.href = dataUrl;
    const safeName = studentName.trim().replace(/\s+/g, '_') || 'طالب';
    link.download = `شهادة_${safeName}_${academicId}_HD.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setFeedback({
      type: 'success',
      message: 'تم تنزيل صورة الشهادة فائقة الجودة (Ultra HD 300 DPI PNG) بنجاح!',
    });
  };

  const handlePrint = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL({ multiplier: 3, format: 'png' });

    // Use hidden iframe to avoid iframe popup blocker
    const printIframe = document.createElement('iframe');
    printIframe.style.position = 'fixed';
    printIframe.style.right = '0';
    printIframe.style.bottom = '0';
    printIframe.style.width = '0';
    printIframe.style.height = '0';
    printIframe.style.border = 'none';
    printIframe.style.zIndex = '-9999';
    document.body.appendChild(printIframe);

    const doc = printIframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html dir="rtl">
          <head>
            <meta charset="utf-8" />
            <title>طباعة الشهادة الرسمية - ${studentName}</title>
            <style>
              @page { size: A4 landscape; margin: 0; }
              html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #ffffff; }
              body { display: flex; align-items: center; justify-content: center; }
              img { width: 100%; height: 100%; object-fit: contain; }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" onload="setTimeout(() => { window.print(); }, 250);" />
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        try {
          document.body.removeChild(printIframe);
        } catch {}
      }, 5000);
    }
  };

  const handleLivePreview = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL({ multiplier: 1.5, format: 'png' });
    setPreviewImageUrl(dataUrl);
    setIsPreviewOpen(true);
  };

  // -------------------------------------------------------------
  // Issue & Verify Certificate Direct Action
  // -------------------------------------------------------------
  const handleIssueCertificateDirectly = async () => {
    setIsSaving(true);
    try {
      const record = await issueVerifiedCertificate({
        academicId,
        serialNumber: academicId,
        studentName,
        courseTitle,
        riwayah,
        sheikhTeacherName,
        adminSignerName,
        issueDate,
        grade,
        status: 'valid',
        templateId: activeTemplate.id,
      });

      if (onCertificateIssued) {
        onCertificateIssued(record);
      }

      setFeedback({
        type: 'success',
        message: `تم اعتماد وإصدار الشهادة رسمياً للطالب (${studentName}) برقم أكاديمي ${academicId}! يمكن التحقق منها عبر صفحة /verify/${academicId}.`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'فشل إصدار الشهادة.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-right pb-16" dir="rtl">
      
      {/* 1. Header Toolbar */}
      <div className="bg-gradient-to-r from-[#046A38] via-[#05572e] to-[#046A38] text-white p-5 sm:p-6 rounded-3xl border-2 border-[#C5A059] shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold bg-[#C5A059] text-white px-3 py-0.5 rounded-full shadow-xs">
              لوحة المالك • محرر الشهادات المتقدم 2026
            </span>
            <span className="text-xs text-emerald-200">
              دعم السحب والإفلات • Fabric.js • QR Code • باركود
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-white">
            محرر ومصمم الشهادات القرآنية المتكامل
          </h2>
          <p className="text-xs text-emerald-100 max-w-2xl leading-relaxed">
            صمّم قوالب الشهادات، ارفع الخلفيات والإطارات، أضف الأختام والتوقيعات الإلكترونية والباركود، مع إمكانية التصدير والطباعة والتحقق الفوري.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleLivePreview}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-white/20"
          >
            <Eye className="w-4 h-4 text-[#C5A059]" />
            <span>معاينة مباشرة</span>
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            className="px-4 py-2 rounded-xl bg-[#C5A059] hover:bg-[#b08e4d] text-slate-900 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            title="تصدير ملف PDF عالي الجودة للطباعة الورقية A4 Landscape 300 DPI"
          >
            <Download className="w-4 h-4 text-slate-900" />
            <span>تصدير PDF (طباعة A4)</span>
          </button>

          <button
            type="button"
            onClick={handleExportPNG}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-white/20"
            title="تنزيل صورة عالية الدقة 300 DPI"
          >
            <ImageIcon className="w-4 h-4 text-[#C5A059]" />
            <span>صورة HD</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-white/20"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>طباعة</span>
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveCurrentTemplate}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>حفظ القالب</span>
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleIssueCertificateDirectly}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-950" />
            <span>اعتماد وإصدار الشهادة</span>
          </button>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-3 py-2 rounded-xl bg-black/20 hover:bg-black/30 text-white/90 text-xs font-bold transition-all cursor-pointer"
            >
              العودة ←
            </button>
          )}
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-md transition-all ${
          feedback.type === 'success'
            ? 'bg-emerald-50 text-[#046A38] border border-emerald-300'
            : 'bg-rose-50 text-rose-800 border border-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-[#046A38]" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
        </div>
      )}

      {/* Main Studio Workspace: Sidebar Tools + Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Interactive Tools & Elements (Tabs) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Studio Tab Buttons */}
          <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-3 gap-1 text-xs font-bold">
            <button
              onClick={() => setActiveTab('design')}
              className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
                activeTab === 'design' ? 'bg-[#046A38] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>التصميم والإطار</span>
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
                activeTab === 'text' ? 'bg-[#046A38] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>النصوص والحقول</span>
            </button>
            <button
              onClick={() => setActiveTab('seal')}
              className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
                activeTab === 'seal' ? 'bg-[#046A38] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>الختم الرسمي</span>
            </button>
            <button
              onClick={() => setActiveTab('signature')}
              className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
                activeTab === 'signature' ? 'bg-[#046A38] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>التوقيعات</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
                activeTab === 'code' ? 'bg-[#046A38] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR & باركود</span>
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
                activeTab === 'templates' ? 'bg-[#046A38] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>إدارة القوالب</span>
            </button>
          </div>

          {/* Tab 1: Comprehensive Frames & Backgrounds Library */}
          {activeTab === 'design' && (
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm font-serif text-[#046A38] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#C5A059]" />
                    <span>مكتبة الإطارات والخلفيات المعتمدة</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    إطارات مفرغة SVG فائقة النقاء، خلفيات ورقية عاجية، ورفع تصاميم مخصصة وحفظها.
                  </p>
                </div>
              </div>

              {/* Sub-Tabs: Preset Frames | Preset Backgrounds | My Library | Upload */}
              <div className="bg-[#F9F6F0] p-1 rounded-2xl border border-slate-200 grid grid-cols-4 gap-1 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setDesignSubTab('presets-frames')}
                  className={`py-1.5 px-1 rounded-xl transition-all cursor-pointer text-center ${
                    designSubTab === 'presets-frames'
                      ? 'bg-[#046A38] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-white'
                  }`}
                >
                  إطارات جاهزة
                </button>
                <button
                  type="button"
                  onClick={() => setDesignSubTab('presets-backgrounds')}
                  className={`py-1.5 px-1 rounded-xl transition-all cursor-pointer text-center ${
                    designSubTab === 'presets-backgrounds'
                      ? 'bg-[#046A38] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-white'
                  }`}
                >
                  خلفيات جاهزة
                </button>
                <button
                  type="button"
                  onClick={() => setDesignSubTab('my-library')}
                  className={`py-1.5 px-1 rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
                    designSubTab === 'my-library'
                      ? 'bg-[#046A38] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-white'
                  }`}
                >
                  <span>مكتبتي</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#C5A059] text-white">
                    {localSavedFrames.length + designAssets.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setDesignSubTab('upload-new')}
                  className={`py-1.5 px-1 rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
                    designSubTab === 'upload-new'
                      ? 'bg-[#C5A059] text-slate-950 shadow-xs'
                      : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  <Plus className="w-3 h-3" />
                  <span>رفع تصميم</span>
                </button>
              </div>

              {/* Sub-Tab 1: Preset Ornate Frames */}
              {designSubTab === 'presets-frames' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">الإطارات المزخرفة المعتمدة (SVG 300 DPI):</span>
                    {activeTemplate.frameUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveFrame}
                        className="text-[11px] text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>إزالة الإطار الحالي</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto p-0.5">
                    {PRESET_CERTIFICATE_FRAMES.map((frame) => {
                      const isActive = activeTemplate.frameUrl === frame.dataUri;
                      return (
                        <div
                          key={frame.id}
                          className={`p-2.5 rounded-2xl border transition-all flex flex-col justify-between ${
                            isActive
                              ? 'border-[#046A38] bg-emerald-50/70 ring-2 ring-[#046A38]/20 shadow-xs'
                              : 'border-slate-200 bg-white hover:border-[#C5A059]'
                          }`}
                        >
                          <div className="relative rounded-xl overflow-hidden bg-[#F9F6F0] border border-slate-200 aspect-[1123/794] flex items-center justify-center">
                            <img src={frame.dataUri} alt={frame.title} className="w-full h-full object-contain" />
                            {isActive && (
                              <div className="absolute top-1.5 right-1.5 bg-[#046A38] text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                                <Check className="w-2.5 h-2.5" />
                                <span>مطبق حالياً</span>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => setPreviewModalAsset({ isOpen: true, item: frame, type: 'frame' })}
                              className="absolute bottom-1.5 left-1.5 bg-black/60 hover:bg-black/80 text-white p-1 rounded-lg text-xs"
                              title="معاينة بالحجم الكامل"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="pt-2 space-y-1">
                            <h4 className="font-bold text-xs text-slate-900 font-serif line-clamp-1">{frame.title}</h4>
                            <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{frame.description}</p>
                            <div className="pt-1.5 flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleApplyPresetFrame(frame)}
                                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                  isActive
                                    ? 'bg-[#046A38] text-white'
                                    : 'bg-emerald-50 text-[#046A38] hover:bg-[#046A38] hover:text-white border border-emerald-300'
                                }`}
                              >
                                {isActive ? 'الإطار نشط' : 'تطبيق الإطار'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Frame Opacity Slider */}
                  {activeTemplate.frameUrl && (
                    <div className="p-3 bg-[#F9F6F0] rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700">شفافية الإطار المطبق:</span>
                        <span className="font-mono text-[#046A38] font-bold">
                          {Math.round((activeTemplate.frameOpacity ?? 0.95) * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={activeTemplate.frameOpacity ?? 0.95}
                        onChange={(e) => {
                          const op = parseFloat(e.target.value);
                          setActiveTemplate((prev) => ({ ...prev, frameOpacity: op }));
                          applyFrameImageToCanvas(activeTemplate.frameUrl!);
                        }}
                        className="w-full accent-[#046A38]"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Sub-Tab 2: Preset Backgrounds */}
              {designSubTab === 'presets-backgrounds' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">خلفيات الورق العاجي والمخطوطات:</span>
                    <button
                      type="button"
                      onClick={handleResetBackground}
                      className="text-[11px] font-bold text-[#046A38] hover:underline"
                    >
                      استعادة خلفية 2026 الأصلية
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto p-0.5">
                    {PRESET_CERTIFICATE_BACKGROUNDS.map((bg) => {
                      const isActive = activeTemplate.backgroundUrl === bg.dataUri;
                      return (
                        <div
                          key={bg.id}
                          className={`p-2.5 rounded-2xl border transition-all flex flex-col justify-between ${
                            isActive
                              ? 'border-[#046A38] bg-emerald-50/70 ring-2 ring-[#046A38]/20 shadow-xs'
                              : 'border-slate-200 bg-white hover:border-[#C5A059]'
                          }`}
                        >
                          <div className="relative rounded-xl overflow-hidden bg-[#F9F6F0] border border-slate-200 aspect-[1123/794] flex items-center justify-center">
                            <img src={bg.dataUri} alt={bg.title} className="w-full h-full object-cover" />
                            {isActive && (
                              <div className="absolute top-1.5 right-1.5 bg-[#046A38] text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                                <Check className="w-2.5 h-2.5" />
                                <span>الخلفية النشطة</span>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => setPreviewModalAsset({ isOpen: true, item: bg, type: 'background' })}
                              className="absolute bottom-1.5 left-1.5 bg-black/60 hover:bg-black/80 text-white p-1 rounded-lg text-xs"
                              title="معاينة بالحجم الكامل"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="pt-2 space-y-1">
                            <h4 className="font-bold text-xs text-slate-900 font-serif line-clamp-1">{bg.title}</h4>
                            <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{bg.description}</p>
                            <div className="pt-1.5">
                              <button
                                type="button"
                                onClick={() => handleApplyPresetBackground(bg)}
                                className={`w-full py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                  isActive
                                    ? 'bg-[#046A38] text-white'
                                    : 'bg-amber-50 text-[#C5A059] hover:bg-[#C5A059] hover:text-white border border-amber-300'
                                }`}
                              >
                                {isActive ? 'الخلفية نشطة' : 'تطبيق كخلفية'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sub-Tab 3: My Saved Library (Custom Uploaded & Saved) */}
              {designSubTab === 'my-library' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">
                      التصاميم والإطارات المحفوظة في مكتبتي:
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({localSavedFrames.length + designAssets.length} عنصر)
                    </span>
                  </div>

                  {localSavedFrames.length === 0 && designAssets.length === 0 ? (
                    <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2 p-4">
                      <Bookmark className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs text-slate-500 font-bold">لم تقم بحفظ إطارات أو خلفيات بعد.</p>
                      <p className="text-[11px] text-slate-400">
                        يمكنك رفع أي إطار أو خلفية من تبويب "رفع تصميم" وحفظها لإعادة استخدامها دائماً.
                      </p>
                      <button
                        type="button"
                        onClick={() => setDesignSubTab('upload-new')}
                        className="px-3 py-1.5 bg-[#046A38] text-white text-xs font-bold rounded-xl mt-1 cursor-pointer"
                      >
                        رفع أول إطار الآن
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto p-0.5">
                      {/* Local Library items */}
                      {localSavedFrames.map((item) => (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-2xl border border-slate-200 bg-white hover:border-[#046A38] transition-all flex flex-col justify-between"
                        >
                          <div className="relative rounded-xl overflow-hidden bg-slate-50 border border-slate-200 aspect-[1123/794] flex items-center justify-center">
                            <img src={item.dataUri} alt={item.title} className="w-full h-full object-contain" />
                            <span className="absolute top-1.5 right-1.5 bg-slate-800/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                              {item.type === 'frame' ? 'إطار شفاف' : 'خلفية'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setPreviewModalAsset({ isOpen: true, item, type: item.type })}
                              className="absolute bottom-1.5 left-1.5 bg-black/60 hover:bg-black/80 text-white p-1 rounded-lg text-xs"
                              title="معاينة"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="pt-2 space-y-1.5">
                            <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{item.title}</h4>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  if (item.type === 'background') {
                                    handleApplyPresetBackground(item);
                                  } else {
                                    handleApplyPresetFrame(item);
                                  }
                                }}
                                className="flex-1 py-1 bg-[#046A38] hover:bg-[#03532c] text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                              >
                                تطبيق
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteLocalFrame(item.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                                title="حذف من المكتبة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Additional Cloud Design Assets */}
                      {designAssets.filter((a) => !localSavedFrames.some((l) => l.id === a.id)).map((asset) => (
                        <div
                          key={asset.id}
                          className="p-2.5 rounded-2xl border border-slate-200 bg-white hover:border-[#046A38] transition-all flex flex-col justify-between"
                        >
                          <div className="relative rounded-xl overflow-hidden bg-slate-50 border border-slate-200 aspect-[1123/794] flex items-center justify-center">
                            <img src={asset.url} alt={asset.title} className="w-full h-full object-contain" />
                            <span className="absolute top-1.5 right-1.5 bg-emerald-800/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                              {asset.type === 'frame' ? 'إطار سحابي' : 'خلفية سحابية'}
                            </span>
                          </div>
                          <div className="pt-2 space-y-1.5">
                            <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{asset.title}</h4>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  if (asset.type === 'background') {
                                    setActiveTemplate((prev) => ({ ...prev, backgroundUrl: asset.url }));
                                    applyBackgroundImageToCanvas(asset.url);
                                  } else {
                                    setActiveTemplate((prev) => ({ ...prev, frameUrl: asset.url }));
                                    applyFrameImageToCanvas(asset.url);
                                  }
                                }}
                                className="flex-1 py-1 bg-[#046A38] hover:bg-[#03532c] text-white rounded-lg text-[11px] font-bold cursor-pointer"
                              >
                                تطبيق
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAsset(asset.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                                title="حذف"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Sub-Tab 4: Upload New Frame or Background & Save */}
              {designSubTab === 'upload-new' && (
                <div className="space-y-3.5">
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs space-y-1">
                    <span className="font-bold text-amber-900 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>إرشادات الجودة للأصول المرفوعة:</span>
                    </span>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      للإطارات المزخرفة: يفضل رفع ملف PNG مفرغ بخلفية شفافة بدقة A4 (297×210 ملم) أو SVG.<br />
                      للخلفيات: يفضل رفع ملف بدقة عالية 300 DPI للحصول على طباعة نقية.
                    </p>
                  </div>

                  {/* Dropzone / File Picker */}
                  <div className="space-y-2">
                    <label className="border-2 border-dashed border-[#C5A059] bg-[#F9F6F0] hover:bg-amber-50/60 rounded-3xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all space-y-2">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setCustomUploadFile(file);
                            setCustomUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
                            const url = URL.createObjectURL(file);
                            setCustomUploadPreviewUrl(url);
                          }
                        }}
                      />
                      {customUploadPreviewUrl ? (
                        <div className="space-y-2 w-full">
                          <img
                            src={customUploadPreviewUrl}
                            alt="معاينة الملف المختار"
                            className="max-h-32 mx-auto rounded-xl border border-slate-200 object-contain"
                          />
                          <p className="text-xs font-bold text-[#046A38]">{customUploadFile?.name}</p>
                          <span className="text-[10px] text-slate-500 block">انقر لتغيير الملف</span>
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-amber-200 flex items-center justify-center text-[#C5A059]">
                            <Upload className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="font-bold text-xs text-slate-800 block">
                              اسحب الملف هنا أو انقر للاختيار من جهازك
                            </span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              PNG شفاف، JPG، أو SVG (حتى 10 ميغابايت)
                            </span>
                          </div>
                        </>
                      )}
                    </label>
                  </div>

                  {/* Upload Configuration Form */}
                  <div className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">عنوان أو وصف التصميم:</label>
                      <input
                        type="text"
                        value={customUploadTitle}
                        onChange={(e) => setCustomUploadTitle(e.target.value)}
                        placeholder="مثال: إطار التذهيب العثماني الخاص"
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold focus:bg-white focus:border-[#046A38] outline-hidden"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">نوع هذا الأصل:</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setCustomUploadType('frame')}
                          className={`p-2 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            customUploadType === 'frame'
                              ? 'border-[#046A38] bg-emerald-50 text-[#046A38]'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>إطار علوي شفاف (Frame)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomUploadType('background')}
                          className={`p-2 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            customUploadType === 'background'
                              ? 'border-[#C5A059] bg-amber-50 text-[#C5A059]'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>خلفية كاملة (Background)</span>
                        </button>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={customUploadSaveToLibrary}
                        onChange={(e) => setCustomUploadSaveToLibrary(e.target.checked)}
                        className="rounded accent-[#046A38] w-4 h-4 cursor-pointer"
                      />
                      <span className="font-bold text-slate-700 text-xs">
                        حفظ في مكتبة الإطارات الدائمة لإعادة استخدامه في الشهادات القادمة
                      </span>
                    </label>

                    <button
                      type="button"
                      disabled={!customUploadFile || isUploading}
                      onClick={handleProcessCustomUpload}
                      className="w-full py-2.5 bg-[#046A38] hover:bg-[#03542c] text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isUploading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>جارٍ الرفع والتطبيق...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>رفع وتطبيق وحفظ في المكتبة الآن</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Text Elements & Dynamic Placeholders */}
          {activeTab === 'text' && (
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-sm font-serif text-[#046A38] pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>الكتابة على الشهادة والحقول التفاعلية</span>
                <button
                  type="button"
                  onClick={() => handleAddText()}
                  className="px-2.5 py-1 bg-[#046A38] text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة نص</span>
                </button>
              </h3>

              {/* Dynamic Field Shortcuts */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 block">
                  إدراج حقول ديناميكية تُعبأ تلقائياً:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '[اسم الطالب]', val: studentName, key: 'studentName' },
                    { label: '[البرنامج]', val: courseTitle, key: 'courseTitle' },
                    { label: '[التاريخ]', val: issueDate, key: 'issueDate' },
                    { label: '[اسم الشيخ]', val: sheikhTeacherName, key: 'sheikhTeacherName' },
                    { label: '[الرقم الأكاديمي]', val: academicId, key: 'academicId' },
                    { label: '[التقدير]', val: grade, key: 'grade' },
                    { label: '[الرواية]', val: riwayah, key: 'riwayah' },
                  ].map((field) => (
                    <button
                      key={field.key}
                      type="button"
                      onClick={() => handleAddText(field.label, field.key)}
                      className="px-2 py-1 bg-[#F9F6F0] hover:bg-emerald-50 text-[#046A38] border border-[#C5A059]/40 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      + {field.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Text Property Editor */}
              {selectedObject && (selectedObject instanceof IText || selectedObject instanceof FabricText) ? (
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                    <span className="font-bold text-[#046A38]">تعديل النص المحدد:</span>
                    <button
                      type="button"
                      onClick={handleDeleteSelected}
                      className="text-rose-600 hover:text-rose-800 flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف النص</span>
                    </button>
                  </div>

                  {/* Font Family */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">نوع الخط:</label>
                    <select
                      value={selectedTextProps.fontFamily}
                      onChange={(e) => handleUpdateSelectedTextProp('fontFamily', e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-200 bg-white font-serif text-xs cursor-pointer"
                    >
                      <option value="Amiri">أميري (Amiri - الخط الرسمي للعناوين)</option>
                      <option value="Noto Kufi Arabic">نوتو كوفي (Noto Kufi - الخط الرسمي للنصوص)</option>
                      <option value="Cairo">القاهرة (Cairo)</option>
                      <option value="Arial">Arial</option>
                    </select>
                  </div>

                  {/* Font Size & Weight */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">الحجم (px):</label>
                      <input
                        type="number"
                        min="10"
                        max="120"
                        value={selectedTextProps.fontSize}
                        onChange={(e) => handleUpdateSelectedTextProp('fontSize', parseInt(e.target.value, 10))}
                        className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">السماكة:</label>
                      <select
                        value={selectedTextProps.fontWeight}
                        onChange={(e) => handleUpdateSelectedTextProp('fontWeight', e.target.value)}
                        className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs cursor-pointer"
                      >
                        <option value="normal">عادي (Normal)</option>
                        <option value="bold">عريض (Bold)</option>
                      </select>
                    </div>
                  </div>

                  {/* Text Color (Brand Colors) */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">لون النص:</label>
                    <div className="flex items-center gap-2">
                      {[
                        { color: '#046A38', name: 'الأخضر الزمردي' },
                        { color: '#C5A059', name: 'الذهبي الملكي' },
                        { color: '#2C3531', name: 'الرمادي الداكن' },
                        { color: '#ffffff', name: 'أبيض' },
                        { color: '#0f172a', name: 'أسود داكن' },
                      ].map((c) => (
                        <button
                          key={c.color}
                          type="button"
                          onClick={() => handleUpdateSelectedTextProp('fill', c.color)}
                          style={{ backgroundColor: c.color }}
                          title={c.name}
                          className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${
                            selectedTextProps.fill === c.color ? 'border-slate-900 scale-110 shadow-xs' : 'border-slate-300'
                          }`}
                        />
                      ))}
                      <input
                        type="color"
                        value={selectedTextProps.fill}
                        onChange={(e) => handleUpdateSelectedTextProp('fill', e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                      />
                    </div>
                  </div>

                  {/* Text Align */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">المحاذاة:</label>
                    <div className="grid grid-cols-3 gap-1">
                      {['right', 'center', 'left'].map((align) => (
                        <button
                          key={align}
                          type="button"
                          onClick={() => handleUpdateSelectedTextProp('textAlign', align)}
                          className={`py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            selectedTextProps.textAlign === align
                              ? 'bg-[#046A38] text-white border-[#046A38]'
                              : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          {align === 'right' ? 'يمين' : align === 'center' ? 'وسط' : 'يسار'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 text-center">
                  انقر على أي نص في لوحة الشهادة لتعديل خطه وحجمه ولونه ومحاذاته بالسحب والإفلات.
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Official Seal & Custom Seals */}
          {activeTab === 'seal' && (
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-sm font-serif text-[#046A38] pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>الختم الإلكتروني المعتمد 2026</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">#046A38</span>
              </h3>

              {/* Seal Preview Card */}
              <div className="p-4 bg-[#F9F6F0] rounded-2xl border border-[#C5A059]/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <OfficialStamp size="sm" />
                  <div>
                    <h4 className="font-bold text-xs text-slate-800 font-serif">ختم المقرأة المعتمد</h4>
                    <p className="text-[11px] text-slate-500">حبر زمردي واقعي شفاف مطابق للدليل</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddOfficialSeal}
                  className="px-3 py-1.5 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer border border-[#C5A059]"
                >
                  + إدراج في الشهادة
                </button>
              </div>

              {/* Upload Custom Seal */}
              <div className="space-y-2">
                <label className="p-3 border-2 border-dashed border-slate-300 hover:border-[#046A38] bg-slate-50 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all space-y-1">
                  <input
                    type="file"
                    accept="image/png"
                    className="hidden"
                    onChange={handleUploadCustomSeal}
                  />
                  <Shield className="w-5 h-5 text-[#046A38]" />
                  <span className="font-bold text-xs text-slate-800">رفع صورة ختم مخصص (PNG شفاف)</span>
                  <span className="text-[10px] text-slate-500">ختم لجنة الإجازات، ختم الجودة، إلخ</span>
                </label>
              </div>

              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-[#046A38] leading-relaxed">
                <p className="font-bold mb-0.5">ضوابط الختم:</p>
                <p className="text-[11px] text-slate-700">
                  يمكنك وضع أكثر من ختم، وتغيير حجم وموقع كل ختم بالسحب على الكانفاس لتثبيته في المنتصف بين التوقيعين.
                </p>
              </div>
            </div>
          )}

          {/* Tab 4: Signatures Management (Admin & Teacher) */}
          {activeTab === 'signature' && (
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-sm font-serif text-[#046A38] pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>توقيع الإدارة وتوقيع المعلم</span>
                <span className="text-[10px] text-slate-400">توقيع يمين + توقيع يسار</span>
              </h3>

              {/* Admin Signature Card (Right) */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#046A38]">توقيع الإدارة (يمين): د. علي عزيزي</span>
                  <span className="text-[10px] bg-emerald-100 text-[#046A38] px-2 py-0.5 rounded-full font-bold">المشرف العام</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openSignaturePad('admin')}
                    className="flex-1 py-1.5 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>رسم التوقيع الآن (Canvas)</span>
                  </button>
                  <label className="py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-all">
                    <input
                      type="file"
                      accept="image/png"
                      className="hidden"
                      onChange={(e) => handleUploadSignature(e, 'admin')}
                    />
                    <span>رفع صورة PNG</span>
                  </label>
                </div>
              </div>

              {/* Teacher Signature Card (Left) */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">توقيع المعلم (يسار): {sheikhTeacherName}</span>
                  <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold">الشيخ المقرئ</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openSignaturePad('teacher')}
                    className="flex-1 py-1.5 bg-[#C5A059] hover:bg-[#b08e4d] text-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>رسم التوقيع الآن (Canvas)</span>
                  </button>
                  <label className="py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-all">
                    <input
                      type="file"
                      accept="image/png"
                      className="hidden"
                      onChange={(e) => handleUploadSignature(e, 'teacher')}
                    />
                    <span>رفع صورة PNG</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: QR Code & Academic Barcode */}
          {activeTab === 'code' && (
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-sm font-serif text-[#046A38] pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>الباركود و QR Code للتحقق الأكاديمي</span>
                <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">Code128</span>
              </h3>

              {/* Academic ID Input */}
              <div className="space-y-1">
                <label className="font-bold text-xs text-slate-700">الرقم الأكاديمي للشهادة:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={academicId}
                    onChange={(e) => {
                      setAcademicId(e.target.value);
                      refreshCanvasDynamicTexts();
                    }}
                    placeholder="مثال: RQ-2026-6365"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs font-bold text-[#046A38] focus:bg-white focus:border-[#046A38] outline-hidden uppercase"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newId = `RQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
                      setAcademicId(newId);
                      refreshCanvasDynamicTexts();
                    }}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer shrink-0"
                    title="توليد رقم أكاديمي جديد"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* QR Code Preview Card */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-xl p-1 border border-slate-200 flex items-center justify-center">
                    <QRCodeCanvas value={`${window.location.origin}/verify/${academicId}`} size={42} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800">رمز الاستجابة السريعة (QR Code)</h4>
                    <p className="text-[10px] text-slate-500 font-mono truncate max-w-[170px]" dir="ltr">
                      {window.location.origin}/verify/{academicId}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => fabricCanvasRef.current && addQRCodeToCanvas(fabricCanvasRef.current)}
                  className="px-2.5 py-1.5 bg-[#046A38] text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  + إعادة إدراج
                </button>
              </div>

              {/* Barcode Preview Card */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="font-bold text-xs text-slate-800">الباركود الأكاديمي (Code 128)</h4>
                  <p className="text-[10px] text-slate-500 font-mono">الرقم المشفر: {academicId}</p>
                </div>
                <button
                  type="button"
                  onClick={() => updateBarcodeOnCanvas(academicId)}
                  className="px-2.5 py-1.5 bg-[#046A38] text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  تحديث الباركود
                </button>
              </div>
            </div>
          )}

          {/* Tab 6: Template Management & Quick Presets */}
          {activeTab === 'templates' && (
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm font-serif text-[#046A38] flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#C5A059]" />
                    <span>قوالب الشهادات القرآنية والعلمية</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    اختر القالب المعتمد وخصّص نصوصه، أو احفظ قوالب جديدة خاصة بمقرأتك.
                  </p>
                </div>
                <span className="text-[10px] bg-emerald-50 text-[#046A38] px-2 py-0.5 rounded-full font-bold">
                  {templates.length} قوالب
                </span>
              </div>

              {/* Category Filter Chips */}
              <div className="flex flex-wrap gap-1 text-[10px] font-bold">
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'appreciation', label: 'شكر وتقدير' },
                  { id: 'students', label: 'حفظ القرآن' },
                  { id: 'ijaza', label: 'إجازة بالسند' },
                  { id: 'matn', label: 'إتمام متن علمي' },
                  { id: 'teachers', label: 'تكريم المعلمين' },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setTemplateFilter(filter.id as any)}
                    className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                      templateFilter === filter.id
                        ? 'bg-[#046A38] text-white shadow-xs font-bold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Template List */}
              <div className="space-y-2.5 max-h-72 overflow-y-auto p-0.5">
                {templates
                  .filter((t) => templateFilter === 'all' || t.category === templateFilter || (templateFilter === 'matn' && t.id.includes('matn')))
                  .map((tmpl) => {
                    const isActive = activeTemplate.id === tmpl.id;
                    return (
                      <div
                        key={tmpl.id}
                        className={`p-3 rounded-2xl border transition-all flex flex-col gap-2 ${
                          isActive
                            ? 'border-[#046A38] bg-emerald-50/70 ring-2 ring-[#046A38]/20 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-[#C5A059]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="cursor-pointer flex-1" onClick={() => handleSelectTemplate(tmpl)}>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-bold text-xs text-slate-900 font-serif">{tmpl.title}</h4>
                              <span className={`text-[9px] px-2 py-0.2 rounded-full font-bold ${
                                tmpl.category === 'appreciation'
                                  ? 'bg-amber-100 text-amber-900'
                                  : tmpl.category === 'matn'
                                  ? 'bg-purple-100 text-purple-900'
                                  : tmpl.category === 'ijaza'
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : 'bg-blue-100 text-blue-900'
                              }`}>
                                {tmpl.category === 'appreciation'
                                  ? 'شكر وتقدير'
                                  : tmpl.category === 'matn'
                                  ? 'متن علمي'
                                  : tmpl.category === 'ijaza'
                                  ? 'إجازة بالسند'
                                  : tmpl.category === 'teachers'
                                  ? 'معلمين'
                                  : 'طلاب'}
                              </span>
                            </div>
                            {tmpl.description && (
                              <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                {tmpl.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleSelectTemplate(tmpl)}
                              className={`px-3 py-1 rounded-xl text-[11px] font-bold cursor-pointer transition-all ${
                                isActive
                                  ? 'bg-[#046A38] text-white shadow-xs'
                                  : 'bg-white hover:bg-emerald-50 text-[#046A38] border border-emerald-300'
                              }`}
                            >
                              {isActive ? 'القالب نشط' : 'تفعيل القالب'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTemplate(tmpl.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                              title="حذف القالب"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Quick Curriculum / Program Fillers based on Active Template */}
              <div className="p-3 bg-[#F9F6F0] rounded-2xl border border-[#C5A059]/40 space-y-2 text-xs">
                <span className="font-bold text-[#046A38] flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>تعبئة سريعة لمسار البرنامج / المتن / الرواية:</span>
                </span>

                {/* For Matn */}
                {(activeTemplate.category === 'matn' || activeTemplate.id.includes('matn')) && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-600 font-bold block">متون علمية معتمدة:</span>
                    <div className="flex flex-wrap gap-1">
                      {[
                        'تُحْفَةُ الأَطْفَالِ وَالغِلْمَان فِي تَجْوِيدِ القُرْآن للجمزوري',
                        'المُقَدِّمَةُ الجَزَرِيَّةُ فِي التَّجْوِيدِ لابن الجزري',
                        'مَنْظُومَةُ حِرْزِ الأَمَانِي (الشَّاطِبِيَّة)',
                        'مَنْظُومَةُ المُفِيدِ فِي عِلْمِ التَّجْوِيدِ للطيبي',
                      ].map((matnName) => (
                        <button
                          key={matnName}
                          type="button"
                          onClick={() => {
                            setCourseTitle(matnName);
                            refreshCanvasDynamicTexts();
                            setFeedback({ type: 'success', message: `تم ضبط اسم المتن: "${matnName}"` });
                          }}
                          className="px-2 py-1 bg-white hover:bg-emerald-50 text-slate-800 border border-slate-200 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                        >
                          {matnName.split(' ')[0]} {matnName.split(' ')[1]} {matnName.split(' ')[2] || ''}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* For Quran Memorization */}
                {(activeTemplate.category === 'students' && !activeTemplate.id.includes('matn')) && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-600 font-bold block">مقادير الحفظ الشائعة:</span>
                    <div className="flex flex-wrap gap-1">
                      {[
                        'حِفْظُ وَتَثْبِيتُ القُرْآنِ الكَرِيمِ كَامِلاً',
                        'حِفْظُ وَتَثْبِيتُ جُزْءِ عَمَّ كَامِلاً مَعَ أَحْكَامِ التَّجْوِيد',
                        'حِفْظُ وَتَثْبِيتُ جُزْءِ تَبَارَكَ كَامِلاً',
                        'حِفْظُ وَتَثْبِيتُ العَشْرِ الأَخِيرِ مِنَ القُرْآنِ الكَرِيم',
                        'حِفْظُ وَتَثْبِيتُ سُورَتَي البَقَرَةِ وَآلِ عِمْرَان',
                      ].map((progName) => (
                        <button
                          key={progName}
                          type="button"
                          onClick={() => {
                            setCourseTitle(progName);
                            refreshCanvasDynamicTexts();
                            setFeedback({ type: 'success', message: `تم ضبط المقدار: "${progName}"` });
                          }}
                          className="px-2 py-1 bg-white hover:bg-emerald-50 text-slate-800 border border-slate-200 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                        >
                          {progName.replace('حِفْظُ وَتَثْبِيتُ ', '')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* For Appreciation */}
                {activeTemplate.category === 'appreciation' && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-600 font-bold block">مناسبات الشكر والتكريم:</span>
                    <div className="flex flex-wrap gap-1">
                      {[
                        'التَّمَيُّزُ وَالإِتْقَانُ فِي التَّعْلِيمِ القُرْآنِيِّ',
                        'المُشَارَكَةُ الفَعَّالَةُ فِي مَنَاشِطِ المَقْرَأَةِ لِعَامِ 1447هـ',
                        'التَّفَوُّقُ وَالالْتِزَامُ فِي حِلَقِ القُرْآنِ الكَرِيم',
                        'العَطَاءُ المُتَمَيِّزُ فِي تَدْرِيسِ وَإِقْرَاءِ كِتَابِ اللَّهِ',
                      ].map((apprecName) => (
                        <button
                          key={apprecName}
                          type="button"
                          onClick={() => {
                            setCourseTitle(apprecName);
                            refreshCanvasDynamicTexts();
                            setFeedback({ type: 'success', message: `تم ضبط المناسبة: "${apprecName}"` });
                          }}
                          className="px-2 py-1 bg-white hover:bg-emerald-50 text-slate-800 border border-slate-200 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                        >
                          {apprecName.slice(0, 24)}...
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* For Ijaza */}
                {activeTemplate.category === 'ijaza' && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-600 font-bold block">الروايات والقراءات المتواترة:</span>
                    <div className="flex flex-wrap gap-1">
                      {[
                        'رِوَايَةُ حَفْصٍ عَنْ عَاصِمٍ مِن طَرِيقِ الشَّاطِبِيَّةِ',
                        'رِوَايَةُ وَرْشٍ عَنْ نَافِعٍ المَدَنِيِّ مِن طَرِيقِ الأَزْرَق',
                        'رِوَايَةُ قَالُونَ عَنْ نَافِعٍ المَدَنِيّ',
                        'القِرَاءَاتُ العَشْرُ الصُّغْرَى مِنْ طَرِيقِ الشَّاطِبِيَّةِ وَالدُّرَّة',
                      ].map((riwayahName) => (
                        <button
                          key={riwayahName}
                          type="button"
                          onClick={() => {
                            setCourseTitle(riwayahName);
                            refreshCanvasDynamicTexts();
                            setFeedback({ type: 'success', message: `تم ضبط الرواية: "${riwayahName}"` });
                          }}
                          className="px-2 py-1 bg-white hover:bg-emerald-50 text-slate-800 border border-slate-200 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                        >
                          {riwayahName.replace('رِوَايَةُ ', '').slice(0, 22)}...
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Template Meta Form for Renaming / Saving Custom Template */}
              <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
                <span className="font-bold text-slate-700 block">تعديل بيانات وحفظ القالب الحالي:</span>
                <div className="space-y-1">
                  <label className="text-slate-600 font-bold">اسم القالب:</label>
                  <input
                    type="text"
                    value={templateTitle}
                    onChange={(e) => setTemplateTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#046A38] outline-hidden font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 font-bold">فئة القالب:</label>
                  <select
                    value={templateCategory}
                    onChange={(e) => setTemplateCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold cursor-pointer"
                  >
                    <option value="appreciation">شهادة شكر وتقدير وتكريم</option>
                    <option value="students">شهادة حفظ وتثبيت القرآن</option>
                    <option value="ijaza">إجازة بالسند المتصل النبوي</option>
                    <option value="matn">شهادة إتمام وإتقان متن علمي</option>
                    <option value="teachers">شهادة اعتماد وتكريم معلمين ومقرئين</option>
                    <option value="general">قالب عام</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleSaveCurrentTemplate}
                  disabled={isSaving}
                  className="w-full py-2 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>حفظ التعديلات على هذا القالب</span>
                </button>
              </div>
            </div>
          )}

          {/* Student Data Auto-Fill Picker */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3 text-xs">
            <h4 className="font-bold text-[#046A38] font-serif flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-[#C5A059]" />
              <span>تعبئة بيانات طالب حقيقي من المقرأة:</span>
            </h4>
            <div className="space-y-2">
              <select
                onChange={(e) => {
                  const std = registeredStudents.find((s) => s.id === e.target.value);
                  if (std) {
                    setStudentName(std.name || '');
                    if ((std as any).assignedHalqaTitle) setCourseTitle((std as any).assignedHalqaTitle);
                    const autoAcademic = (std as any).academicNumber || `RQ-2026-${std.id.slice(-4)}`;
                    setAcademicId(autoAcademic);
                    refreshCanvasDynamicTexts();
                  }
                }}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold cursor-pointer"
              >
                <option value="">-- اختر طالباً لملء بيانات الشهادة تلقائياً --</option>
                {registeredStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({(s as any).academicNumber || s.phone || 'طالب'})
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="اسم الطالب"
                  value={studentName}
                  onChange={(e) => {
                    setStudentName(e.target.value);
                    refreshCanvasDynamicTexts();
                  }}
                  className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
                <input
                  type="text"
                  placeholder="المسار أو البرنامج"
                  value={courseTitle}
                  onChange={(e) => {
                    setCourseTitle(e.target.value);
                    refreshCanvasDynamicTexts();
                  }}
                  className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Interactive Canvas Viewport */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Canvas Controls Header */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs font-serif text-[#046A38]">
                مساحة العمل (A4 Landscape - 1123 × 794 px)
              </span>
              <span className="text-[10px] bg-[#F9F6F0] text-[#C5A059] px-2 py-0.5 rounded-full border border-[#C5A059]/40 font-bold">
                دقة طباعة عالية
              </span>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setZoomScale((prev) => Math.max(0.4, prev - 0.1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                title="تصغير"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="font-mono font-bold text-slate-700 w-12 text-center">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomScale((prev) => Math.min(1.2, prev + 0.1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                title="تكبير"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomScale(0.85)}
                className="px-2 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-800"
              >
                إعادة ضبط
              </button>
            </div>
          </div>

          {/* Canvas Container with Scaling Wrapper */}
          <div className="bg-slate-200/80 p-4 sm:p-6 rounded-3xl border border-slate-300 shadow-inner flex items-center justify-center overflow-auto min-h-[620px]">
            <div
              style={{
                transform: `scale(${zoomScale})`,
                transformOrigin: 'top center',
                width: 1123,
                height: 794,
              }}
              className="shadow-2xl rounded-sm bg-white overflow-hidden transition-transform duration-75 relative"
            >
              <canvas ref={canvasRef} />
            </div>
          </div>

          {/* Quick Guidance Footer */}
          <div className="p-4 bg-white/90 rounded-2xl border border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C5A059]" />
              <span>نصيحة: انقر على أي عنصر لتحريكه، تدويره، أو تغيير أبعاده بالسحب مباشرة.</span>
            </span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-[#046A38] font-bold">
                <Check className="w-3.5 h-3.5" />
                <span>الختم الرسمي</span>
              </span>
              <span className="flex items-center gap-1 text-[#046A38] font-bold">
                <Check className="w-3.5 h-3.5" />
                <span>توقيع الإدارة والمعلم</span>
              </span>
              <span className="flex items-center gap-1 text-[#046A38] font-bold">
                <Check className="w-3.5 h-3.5" />
                <span>QR التحقق الفوري</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Signature Pad Modal (Drawing directly on Canvas)              */}
      {/* ------------------------------------------------------------- */}
      {isSignatureModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border-2 border-[#C5A059]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base font-serif text-[#046A38]">
                  رسم التوقيع اليدوي المباشر (Canvas)
                </h3>
                <p className="text-xs text-slate-500">
                  {signatureTargetRole === 'admin' ? 'توقيع الإدارة (د. علي عزيزي - يمين)' : `توقيع المعلم (${sheikhTeacherName} - يسار)`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSignatureModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Drawing Area */}
            <div className="border-2 border-dashed border-[#C5A059] rounded-2xl p-2 bg-[#F9F6F0] text-center">
              <canvas
                ref={signaturePadCanvasRef}
                width={460}
                height={180}
                onMouseDown={handleSignatureMouseDown}
                onMouseMove={handleSignatureMouseMove}
                onMouseUp={handleSignatureMouseUp}
                onMouseLeave={handleSignatureMouseUp}
                className="w-full h-44 bg-transparent cursor-crosshair rounded-xl touch-none"
              />
              <span className="text-[10px] text-slate-400 block pt-1">
                ارسم التوقيع هنا بالماوس أو القلم أو الإصبع على الشاشات اللمسية
              </span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={clearSignaturePad}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                مسح التوقيع
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSignatureModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={saveSignaturePadToCanvas}
                  className="px-5 py-2 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md border border-[#C5A059]"
                >
                  إدراج التوقيع في الشهادة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Fullscreen Live Preview Modal                                 */}
      {/* ------------------------------------------------------------- */}
      {isPreviewOpen && previewImageUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in" dir="rtl">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 space-y-4 shadow-2xl border-2 border-[#C5A059] my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-lg font-serif text-[#046A38]">
                  المعاينة المباشرة للشهادة النهائية
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {studentName} • {academicId} • A4 Landscape
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-md">
              <img src={previewImageUrl} alt="معاينة الشهادة" className="w-full h-auto object-contain" />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                هذه المعاينة مطابقة بنسبة 100% لملف PDF الذي سيتم تصديره وطباعته.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="px-5 py-2 bg-[#046A38] text-white rounded-xl text-xs font-bold cursor-pointer border border-[#C5A059] shadow-sm"
                >
                  تحميل PDF الآن
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  إغلاق المعاينة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Asset High-Resolution Preview Modal */}
      {previewModalAsset.isOpen && previewModalAsset.item && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border-2 border-[#C5A059] space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-50 text-[#046A38]">
                  <Sparkles className="w-5 h-5 text-[#C5A059]" />
                </span>
                <div>
                  <h3 className="font-bold text-base font-serif text-[#046A38]">
                    {previewModalAsset.item.title}
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    {previewModalAsset.type === 'frame' ? 'إطار مزخرف شفاف (Frame A4)' : 'خلفية أساسية للشهادة (Background A4)'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalAsset({ isOpen: false })}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* High-Res View Container */}
            <div className="relative rounded-2xl overflow-hidden border-2 border-[#C5A059]/40 bg-[#F9F6F0] p-4 flex items-center justify-center shadow-inner min-h-[340px]">
              <img
                src={previewModalAsset.item.dataUri || previewModalAsset.item.url}
                alt={previewModalAsset.item.title}
                className="max-h-[55vh] w-auto max-w-full object-contain drop-shadow-md rounded-lg"
              />
            </div>

            {previewModalAsset.item.description && (
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                {previewModalAsset.item.description}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>المقاس: <strong className="text-slate-800">A4 Landscape</strong></span>
                <span>•</span>
                <span>النسبة: <strong className="text-slate-800">297 × 210 ملم (1123×794)</strong></span>
                <span>•</span>
                <span>الدقة: <strong className="text-emerald-800">300 DPI Vector/HD</strong></span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const item = previewModalAsset.item;
                    if (previewModalAsset.type === 'background') {
                      handleApplyPresetBackground(item);
                    } else {
                      handleApplyPresetFrame(item);
                    }
                    setPreviewModalAsset({ isOpen: false });
                  }}
                  className="px-5 py-2.5 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold cursor-pointer border border-[#C5A059] shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-[#C5A059]" />
                  <span>اعتماد وتطبيق هذا الأصل على الشهادة</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewModalAsset({ isOpen: false })}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  إغلاق المعاينة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden QRCode Container powered by qrcode.react */}
      <div
        ref={hiddenQrRef}
        style={{ position: 'fixed', left: -9999, top: -9999, opacity: 0, pointerEvents: 'none' }}
        aria-hidden="true"
      >
        <QRCodeCanvas
          id="cert-offscreen-qrcode"
          value={`${typeof window !== 'undefined' ? window.location.origin : ''}/verify/${academicId}`}
          size={160}
          fgColor="#046A38"
          bgColor="#ffffff"
          level="H"
          marginSize={2}
        />
      </div>
    </div>
  );
};
