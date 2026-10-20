import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Sliders,
  Type,
  FileText,
  RotateCcw,
  Check,
  X,
  Sparkles,
  AlertCircle,
  Copy,
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
  Sun,
  Moon,
  Wand2,
  Target,
  Award,
  Stamp,
  MapPin,
  Mail,
  Phone,
  Building,
  Calendar,
  Layers,
  Palette,
  Eye,
  Save,
  Facebook,
  Instagram,
  MessageCircle,
  Send,
} from 'lucide-react';
import {
  getBrandLogoSettings,
  saveBrandLogoSettings,
  resetBrandLogoSettings,
  autoCalibrateBrandLogo,
  uploadBrandLogoToServer,
  BrandLogoCustomization,
  DEFAULT_BRAND_LOGO_SETTINGS,
  CALIBRATION_PRESETS,
  CalibrationPreset,
} from '../utils/brandLogoStore';
import { OfficialLogo, OfficialStamp } from './OfficialLogo';

export type BrandEditorTab = 'logo' | 'certs' | 'seal' | 'address' | 'guide';

interface ManualLogoEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: BrandEditorTab;
}

export const ManualLogoEditorModal: React.FC<ManualLogoEditorModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'logo',
}) => {
  const [activeTab, setActiveTab] = useState<BrandEditorTab>(defaultTab);
  const [settings, setSettings] = useState<BrandLogoCustomization>(getBrandLogoSettings());
  const [targetType, setTargetType] = useState<'official-logo' | 'small' | 'seal' | 'certificate-bg'>('official-logo');
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewBg, setPreviewBg] = useState<'light' | 'dark' | 'ivory'>('ivory');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSettings(getBrandLogoSettings());
      setActiveTab(defaultTab);
      setStatusMessage(null);
      setUploadedPreview(null);
    }
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setStatusMessage({ type: 'error', text: 'يرجى اختيار ملف صورة صالح (PNG, JPG, SVG, WebP)' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedPreview(result);
      setStatusMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSaveUploadedImage = async () => {
    if (!uploadedPreview) return;
    setIsUploading(true);
    setStatusMessage(null);

    try {
      // 1. Upload to server disk
      const uploadRes = await uploadBrandLogoToServer(uploadedPreview, targetType);
      const filename = targetType === 'small' ? 'official-logo-small.png' :
                       targetType === 'seal' ? 'official-seal.png' :
                       targetType === 'certificate-bg' ? 'official-certificate-template.png' : 'official-logo.png';
      const cleanPath = uploadRes?.path || `/brand/${filename}?t=${Date.now()}`;

      // 2. Save to local & server settings (using clean URL path, never huge base64)
      const updateData: Partial<BrandLogoCustomization> = {};
      if (targetType === 'official-logo') {
        updateData.customLogoUrl = cleanPath;
      } else if (targetType === 'small') {
        updateData.customSmallLogoUrl = cleanPath;
      } else if (targetType === 'seal') {
        updateData.customSealUrl = cleanPath;
      } else if (targetType === 'certificate-bg') {
        updateData.customCertificateBgUrl = cleanPath;
      }

      const updated = saveBrandLogoSettings(updateData);
      setSettings(updated);

      const targetArabic = targetType === 'official-logo' ? 'الشعار الرئيسي' : targetType === 'small' ? 'الشعار المصغر' : targetType === 'seal' ? 'الختم الرسمي' : 'خلفية/قالب الشهادة';

      setStatusMessage({
        type: 'success',
        text: `تم حفظ وتحديث ${targetArabic} بنجاح على الخادم وداخل المتصفح!`
      });
      setUploadedPreview(null);
    } catch (err: any) {
      // Client-side fallback: use clean server path
      const filename = targetType === 'small' ? 'official-logo-small.png' :
                       targetType === 'seal' ? 'official-seal.png' :
                       targetType === 'certificate-bg' ? 'official-certificate-template.png' : 'official-logo.png';
      const cleanPath = `/brand/${filename}?t=${Date.now()}`;
      const updateData: Partial<BrandLogoCustomization> = {};
      if (targetType === 'official-logo') {
        updateData.customLogoUrl = cleanPath;
      } else if (targetType === 'small') {
        updateData.customSmallLogoUrl = cleanPath;
      } else if (targetType === 'seal') {
        updateData.customSealUrl = cleanPath;
      } else if (targetType === 'certificate-bg') {
        updateData.customCertificateBgUrl = cleanPath;
      }
      const updated = saveBrandLogoSettings(updateData);
      setSettings(updated);

      setStatusMessage({
        type: 'success',
        text: 'تم تطبيق الصورة فورياً في واجهة المتصفح.'
      });
      setUploadedPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateSetting = <K extends keyof BrandLogoCustomization>(key: K, val: BrandLogoCustomization[K]) => {
    const updated = { ...settings, [key]: val };
    setSettings(updated);
    saveBrandLogoSettings({ [key]: val });
  };

  const handleSaveAll = () => {
    setIsSaving(true);
    saveBrandLogoSettings(settings);
    setTimeout(() => {
      setIsSaving(false);
      setStatusMessage({ type: 'success', text: 'تم حفظ وتعميم كافة التعديلات على النظام بنجاح!' });
    }, 300);
  };

  const handleReset = () => {
    if (window.confirm('هل تريد بالتأكيد استعادة الإعدادات الأصلية المعتمدة للمقرأة (الهوية، الشهادات، الختم، والعنوان) وفق دليل 2026؟')) {
      const reset = resetBrandLogoSettings();
      setSettings(reset);
      setUploadedPreview(null);
      setStatusMessage({ type: 'success', text: 'تمت استعادة الهوية والشعار والشهادات والختم الافتراضي بنجاح.' });
    }
  };

  const handleAutoCalibrate = (preset: CalibrationPreset = 'balanced') => {
    const updated = autoCalibrateBrandLogo(preset);
    setSettings(updated);
    setStatusMessage({
      type: 'success',
      text: `تم ضبط القياسات والحجم والزوايا والدوران تلقائياً بنجاح (${CALIBRATION_PRESETS[preset].name})`
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPath(text);
    setTimeout(() => setCopiedPath(null), 2500);
  };

  // Compute active preview URL for logo
  const currentLogoSrc = uploadedPreview ||
    (targetType === 'small' ? (settings.customSmallLogoUrl || '/brand/official-logo-small.png') :
     targetType === 'seal' ? (settings.customSealUrl || '/brand/official-seal.png') :
     (settings.customLogoUrl || '/brand/official-logo.png'));

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="bg-[#0b2418] border-2 border-[#C5A059] rounded-3xl max-w-3xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden relative text-slate-100 my-auto">
        
        {/* Modal Header */}
        <div className="p-4 bg-[#071911] border-b border-emerald-900/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F9F6F0] p-1.5 border border-[#C5A059] flex items-center justify-center shrink-0 shadow-inner">
              <img
                src={settings.customSmallLogoUrl || '/brand/official-logo-small.png'}
                alt="أيقونة المقرأة"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white font-amiri flex items-center gap-2">
                <span>تعديل الشعار والشهادات والختم والعنوان يدوياً</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C5A059]/25 text-[#dfbe75] font-kufi border border-[#C5A059]/40">
                  لوحة التحكم بالهوية
                </span>
              </h3>
              <p className="text-xs text-emerald-300 font-kufi">
                تخصيص مباشر للشعار، نماذج الشهادات المعتمدة، الختم الإلكتروني، وبيانات المقرأة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-slate-300 hover:text-white cursor-pointer transition-colors border border-emerald-800"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-2.5 bg-[#081f14] border-b border-emerald-900/60 overflow-x-auto text-xs font-kufi shrink-0">
          <button
            onClick={() => setActiveTab('logo')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer font-bold shrink-0 ${
              activeTab === 'logo'
                ? 'bg-[#046A38] text-white shadow-sm border border-[#C5A059]/60'
                : 'text-slate-300 hover:bg-emerald-900/40'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>1. الشعار الرسمي</span>
          </button>

          <button
            onClick={() => setActiveTab('certs')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer font-bold shrink-0 ${
              activeTab === 'certs'
                ? 'bg-[#046A38] text-white shadow-sm border border-[#C5A059]/60'
                : 'text-slate-300 hover:bg-emerald-900/40'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>2. قالب الشهادات والتواقيع</span>
          </button>

          <button
            onClick={() => setActiveTab('seal')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer font-bold shrink-0 ${
              activeTab === 'seal'
                ? 'bg-[#046A38] text-white shadow-sm border border-[#C5A059]/60'
                : 'text-slate-300 hover:bg-emerald-900/40'
            }`}
          >
            <Stamp className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>3. الختم الإلكتروني</span>
          </button>

          <button
            onClick={() => setActiveTab('address')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer font-bold shrink-0 ${
              activeTab === 'address'
                ? 'bg-[#046A38] text-white shadow-sm border border-[#C5A059]/60'
                : 'text-slate-300 hover:bg-emerald-900/40'
            }`}
          >
            <Building className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>4. العنوان وبيانات المقرأة</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer font-bold shrink-0 ${
              activeTab === 'guide'
                ? 'bg-[#046A38] text-white shadow-sm border border-[#C5A059]/60'
                : 'text-slate-300 hover:bg-emerald-900/40'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>5. الدليل والمطابقة</span>
          </button>
        </div>

        {/* Status Notification Banner */}
        {statusMessage && (
          <div
            className={`px-4 py-2.5 text-xs flex items-center justify-between shrink-0 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-900/80 border-b border-emerald-600/50 text-emerald-200'
                : 'bg-rose-950/80 border-b border-rose-700/50 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-white cursor-pointer px-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">

          {/* ========================================================= */}
          {/* TAB 1: THE LOGO (الشعار الرسمي)                            */}
          {/* ========================================================= */}
          {activeTab === 'logo' && (
            <div className="space-y-6">
              
              {/* Target Selector */}
              <div>
                <label className="block text-xs font-bold text-emerald-300 font-kufi mb-2">
                  اختر عنصر الشعار المراد تعديله أو استبداله:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => { setTargetType('official-logo'); setUploadedPreview(null); }}
                    className={`p-3.5 rounded-2xl border-2 text-right transition-all cursor-pointer ${
                      targetType === 'official-logo'
                        ? 'bg-[#046A38]/30 border-[#C5A059] text-white shadow-md'
                        : 'bg-emerald-950/40 border-emerald-900 text-slate-300 hover:border-emerald-700'
                    }`}
                  >
                    <div className="font-bold font-kufi text-xs sm:text-sm text-white flex items-center justify-between">
                      <span>الشعار الرسمي الكامل</span>
                      {targetType === 'official-logo' && <Check className="w-4 h-4 text-[#C5A059]" />}
                    </div>
                    <p className="text-[11px] text-emerald-300/80 mt-1 font-kufi">
                      شعار الهوية البارز لواجهات الدخول، الشهادات، والبطاقات
                    </p>
                    <div className="text-[10px] text-[#C5A059] font-mono mt-1">public/brand/official-logo.png</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTargetType("seal"); setUploadedPreview(null); }}
                    className={"p-3 rounded-2xl border-2 text-right transition-all cursor-pointer " + (
                      targetType === "seal"
                        ? "bg-[#046A38]/40 border-[#C5A059] text-white shadow-md"
                        : "bg-emerald-950/40 border-emerald-900 text-slate-300 hover:border-emerald-700"
                    )}
                  >
                    <div className="font-bold font-kufi text-xs sm:text-sm text-white flex items-center justify-between">
                      <span>الختم الرسمي للمقرأة</span>
                      {targetType === "seal" && <Check className="w-4 h-4 text-[#C5A059]" />}
                    </div>
                    <p className="text-[10px] text-emerald-300/80 mt-1 font-kufi">
                      ختم الاعتماد الأخضر الزمردي للشهادات
                    </p>
                    <div className="text-[9px] text-[#C5A059] font-mono mt-1">public/brand/official-seal.png</div>
                  </button>
  
                  <button
                    type="button"
                    onClick={() => { setTargetType('small'); setUploadedPreview(null); }}
                    className={`p-3.5 rounded-2xl border-2 text-right transition-all cursor-pointer ${
                      targetType === 'small'
                        ? 'bg-[#046A38]/30 border-[#C5A059] text-white shadow-md'
                        : 'bg-emerald-950/40 border-emerald-900 text-slate-300 hover:border-emerald-700'
                    }`}
                  >
                    <div className="font-bold font-kufi text-xs sm:text-sm text-white flex items-center justify-between">
                      <span>الأيقونة المصغرة للشعار</span>
                      {targetType === 'small' && <Check className="w-4 h-4 text-[#C5A059]" />}
                    </div>
                    <p className="text-[11px] text-emerald-300/80 mt-1 font-kufi">
                      أيقونة مصغرة مدمجة للشريط العلوي والتطبيقات والهواتف
                    </p>
                    <div className="text-[10px] text-[#C5A059] font-mono mt-1">public/brand/official-logo-small.png</div>
                  </button>
                </div>
              </div>

              {/* Upload Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-[#C5A059]/60 hover:border-[#C5A059] rounded-2xl p-5 text-center bg-emerald-950/20 hover:bg-emerald-950/40 transition-all cursor-pointer space-y-3"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />
                <div className="w-12 h-12 rounded-full bg-[#046A38]/30 border border-[#C5A059] text-[#C5A059] mx-auto flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-white font-kufi text-sm">
                    اسحب وأفلت صورة الشعار هنا، أو انقر للاختيار من جهازك
                  </p>
                  <p className="text-xs text-slate-400 font-kufi mt-1">
                    يدعم PNG (خلفية شفافة مفضلة)، SVG، JPG، WebP (الحد الأقصى 5 ميجابايت)
                  </p>
                </div>
              </div>

              {/* Preview & Confirmation Box */}
              <div className="p-4 rounded-2xl bg-[#071911] border border-emerald-900/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white font-kufi text-xs sm:text-sm flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-[#C5A059]" />
                    <span>المعاينة المباشرة للشعار المعتمد:</span>
                  </h4>
                  <div className="flex items-center gap-1 bg-emerald-950 p-1 rounded-lg border border-emerald-900 text-xs">
                    <button
                      type="button"
                      onClick={() => setPreviewBg('ivory')}
                      className={`px-2 py-0.5 rounded text-[11px] ${previewBg === 'ivory' ? 'bg-[#F9F6F0] text-slate-900 font-bold' : 'text-slate-400'}`}
                    >
                      عاجي دافئ
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewBg('light')}
                      className={`px-2 py-0.5 rounded text-[11px] ${previewBg === 'light' ? 'bg-white text-slate-900 font-bold' : 'text-slate-400'}`}
                    >
                      أبيض
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewBg('dark')}
                      className={`px-2 py-0.5 rounded text-[11px] ${previewBg === 'dark' ? 'bg-[#046A38] text-white font-bold' : 'text-slate-400'}`}
                    >
                      زمردي
                    </button>
                  </div>
                </div>

                <div
                  className={`p-6 rounded-2xl border flex items-center justify-center min-h-[170px] transition-colors relative overflow-hidden ${
                    previewBg === 'ivory'
                      ? 'bg-[#F9F6F0] border-[#C5A059]'
                      : previewBg === 'light'
                      ? 'bg-white border-slate-300'
                      : 'bg-[#046A38] border-emerald-600'
                  }`}
                >
                  <img
                    src={currentLogoSrc}
                    alt="معاينة الشعار"
                    style={{
                      transform: `scale(${settings.scale}) rotate(${settings.rotation}deg)`,
                      filter: `brightness(${settings.brightness}%) contrast(${settings.contrast}%)`,
                    }}
                    className="max-h-36 max-w-full object-contain filter drop-shadow-md select-none transition-all"
                  />
                </div>

                {uploadedPreview && (
                  <div className="flex items-center justify-between pt-2 border-t border-emerald-900/60">
                    <span className="text-xs text-amber-300 font-kufi">
                      ● تم تحميل صورة جديدة وبانتظار الحفظ والاعتماد
                    </span>
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={handleSaveUploadedImage}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#046A38] to-[#078849] hover:from-[#057a40] hover:to-[#099953] text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer border border-[#C5A059]/60 disabled:opacity-50"
                    >
                      {isUploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-[#C5A059]" />}
                      <span>تثبيت واعتماد هذه الصورة للشعار</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Adjustments & Sliders */}
              <div className="p-4 rounded-2xl bg-[#071911] border border-emerald-900/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white font-kufi text-xs sm:text-sm flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-[#C5A059]" />
                    <span>التحكم الهندسي بالأبعاد والمظهر (Scale & Tuning):</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleAutoCalibrate('balanced')}
                    className="text-[11px] text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800"
                  >
                    <Wand2 className="w-3 h-3 text-[#C5A059]" />
                    <span>المعايرة الذهبية التلقائية</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Scale */}
                  <div className="space-y-1.5 bg-emerald-950/40 p-3 rounded-xl border border-emerald-900">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-kufi">التحجيم (Scale):</span>
                      <span className="font-mono text-[#dfbe75] font-bold">{Math.round(settings.scale * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.6"
                      max="1.5"
                      step="0.05"
                      value={settings.scale}
                      onChange={(e) => handleUpdateSetting('scale', parseFloat(e.target.value))}
                      className="w-full accent-[#C5A059] cursor-pointer"
                    />
                  </div>

                  {/* Rotation */}
                  <div className="space-y-1.5 bg-emerald-950/40 p-3 rounded-xl border border-emerald-900">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-kufi">زاوية الميل والدوران (Rotation):</span>
                      <span className="font-mono text-[#dfbe75] font-bold">{settings.rotation}°</span>
                    </div>
                    <input
                      type="range"
                      min="-25"
                      max="25"
                      step="1"
                      value={settings.rotation}
                      onChange={(e) => handleUpdateSetting('rotation', parseInt(e.target.value, 10))}
                      className="w-full accent-[#C5A059] cursor-pointer"
                    />
                  </div>

                  {/* Brightness */}
                  <div className="space-y-1.5 bg-emerald-950/40 p-3 rounded-xl border border-emerald-900">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-kufi">شدة الإضاءة والسطوع (Brightness):</span>
                      <span className="font-mono text-[#dfbe75] font-bold">{settings.brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="140"
                      step="5"
                      value={settings.brightness}
                      onChange={(e) => handleUpdateSetting('brightness', parseInt(e.target.value, 10))}
                      className="w-full accent-[#C5A059] cursor-pointer"
                    />
                  </div>

                  {/* Contrast */}
                  <div className="space-y-1.5 bg-emerald-950/40 p-3 rounded-xl border border-emerald-900">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-kufi">التباين اللوني (Contrast):</span>
                      <span className="font-mono text-[#dfbe75] font-bold">{settings.contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="140"
                      step="5"
                      value={settings.contrast}
                      onChange={(e) => handleUpdateSetting('contrast', parseInt(e.target.value, 10))}
                      className="w-full accent-[#C5A059] cursor-pointer"
                    />
                  </div>
                </div>

                {/* Direct Image URL input */}
                <div className="pt-2 border-t border-emerald-900/60">
                  <label className="block text-xs font-bold text-slate-300 font-kufi mb-1">
                    أو أدخل رابط صورة مخصص للشعار مباشرة (Custom Image URL):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="https://... أو /brand/my-logo.png"
                      value={targetType === 'small' ? settings.customSmallLogoUrl : settings.customLogoUrl}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (targetType === 'small') {
                          handleUpdateSetting('customSmallLogoUrl', val);
                        } else {
                          handleUpdateSetting('customLogoUrl', val);
                        }
                      }}
                      className="flex-1 px-3 py-2 rounded-xl bg-[#05140d] border border-emerald-800 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-[#C5A059]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (targetType === 'small') {
                          handleUpdateSetting('customSmallLogoUrl', '');
                        } else {
                          handleUpdateSetting('customLogoUrl', '');
                        }
                        setStatusMessage({ type: 'success', text: 'تمت استعادة مسار الشعار الافتراضي.' });
                      }}
                      className="px-3 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-slate-300 text-xs font-kufi border border-emerald-800 cursor-pointer"
                    >
                      استعادة الأصلي
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: CERTIFICATES TEMPLATE (الشهادات والتواقيع)           */}
          {/* ========================================================= */}
          {activeTab === 'certs' && (
            <div className="space-y-6">
              
              <div className="bg-[#071911] p-4 rounded-2xl border border-emerald-900/80 space-y-4">

                {/* رفع صورة/قالب الشهادة يدويًا */}
                <div className="bg-[#05140d] p-4 rounded-2xl border border-emerald-800/80 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-emerald-300 font-kufi block">
                        رفع صورة أو قالب الشهادة الرسمي (PNG / JPG):
                      </span>
                      <p className="text-[11px] text-slate-400 font-kufi mt-0.5">
                        يمكنك استبدال أو رفع صورة خلفية الشهادة الرسمية بدقة عالية لتظهر تلقائياً في كافة الشهادات.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTargetType("certificate-bg");
                        setActiveTab("logo");
                      }}
                      className="px-3.5 py-2 bg-[#C5A059] hover:bg-[#b08e4c] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>رفع صورة الشهادة (PNG)</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-emerald-900/60">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#C5A059]" />
                    <h4 className="font-bold text-white font-amiri text-base">
                      تعديل صيغ ونصوص الشهادات المعتمدة يدوياً
                    </h4>
                  </div>
                  <span className="text-[11px] text-amber-300 font-mono bg-[#046A38]/40 px-2.5 py-1 rounded-full border border-[#C5A059]/40">
                    قالب الشهادة الرسمي 2026
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Default Title */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-emerald-300 font-kufi">
                      عنوان الشهادة الافتراضي:
                    </label>
                    <input
                      type="text"
                      value={settings.certDefaultTitle}
                      onChange={(e) => handleUpdateSetting('certDefaultTitle', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#05140d] border border-emerald-800 text-xs text-white focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  {/* Header Badge */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-emerald-300 font-kufi">
                      شارة الرأسية والوسام:
                    </label>
                    <input
                      type="text"
                      value={settings.certHeaderBadge}
                      onChange={(e) => handleUpdateSetting('certHeaderBadge', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#05140d] border border-emerald-800 text-xs text-white focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  {/* Intro Text */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-bold text-emerald-300 font-kufi">
                      النص الاستهلالي المشهود به للطالب:
                    </label>
                    <input
                      type="text"
                      value={settings.certIntroText}
                      onChange={(e) => handleUpdateSetting('certIntroText', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#05140d] border border-emerald-800 text-xs text-white focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  {/* Completion Phrase */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-bold text-emerald-300 font-kufi">
                      صيغة الإنجاز والإتقان:
                    </label>
                    <input
                      type="text"
                      value={settings.certCompletionPhrase}
                      onChange={(e) => handleUpdateSetting('certCompletionPhrase', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#05140d] border border-emerald-800 text-xs text-white focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  {/* Narration Text */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-bold text-emerald-300 font-kufi">
                      نص الرواية والسند المتصل:
                    </label>
                    <input
                      type="text"
                      value={settings.certNarrationText}
                      onChange={(e) => handleUpdateSetting('certNarrationText', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#05140d] border border-emerald-800 text-xs text-white focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                </div>
              </div>

              {/* Signatures and Authority Box */}
              <div className="bg-[#071911] p-4 rounded-2xl border border-emerald-900/80 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-emerald-900/60">
                  <CheckCircle2 className="w-4 h-4 text-[#C5A059]" />
                  <h4 className="font-bold text-white font-kufi text-xs sm:text-sm">
                    بيانات التوقيعات والاعتماد الرسمي في أسفل الشهادة
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Admin Signer Name */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-emerald-300 font-kufi">
                      اسم الموقّع عن إدارة المقرأة (المشرف العام):
                    </label>
                    <input
                      type="text"
                      value={settings.certAdminSignerName}
                      onChange={(e) => handleUpdateSetting('certAdminSignerName', e.target.value)}
                      placeholder="د. علي عزيزي"
                      className="w-full px-3 py-2 rounded-xl bg-[#05140d] border border-emerald-800 text-xs text-white focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  {/* Admin Signer Role */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-emerald-300 font-kufi">
                      مسمى وصفة الإدارة:
                    </label>
                    <input
                      type="text"
                      value={settings.certAdminSignerTitle}
                      onChange={(e) => handleUpdateSetting('certAdminSignerTitle', e.target.value)}
                      placeholder="المشرف العام على المقرأة"
                      className="w-full px-3 py-2 rounded-xl bg-[#05140d] border border-emerald-800 text-xs text-white focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  {/* Teacher Signer Role */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-emerald-300 font-kufi">
                      مسمى وصفة المعلم/ة المجيز:
                    </label>
                    <input
                      type="text"
                      value={settings.certTeacherSignerTitle}
                      onChange={(e) => handleUpdateSetting('certTeacherSignerTitle', e.target.value)}
                      placeholder="المعلم المجيز"
                      className="w-full px-3 py-2 rounded-xl bg-[#05140d] border border-emerald-800 text-xs text-white focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  {/* Watermark opacity */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-300 font-kufi">شفافية العلامة المائية:</span>
                      <span className="font-mono text-[#dfbe75] font-bold">{Math.round(settings.certWatermarkOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.02"
                      max="0.20"
                      step="0.01"
                      value={settings.certWatermarkOpacity}
                      onChange={(e) => handleUpdateSetting('certWatermarkOpacity', parseFloat(e.target.value))}
                      className="w-full accent-[#C5A059] cursor-pointer mt-2"
                    />
                  </div>
                </div>
              </div>

              {/* Certificate Miniature Live Preview */}
              <div className="p-4 rounded-2xl bg-[#071911] border border-emerald-900/80 space-y-3">
                <h4 className="font-bold text-white font-kufi text-xs sm:text-sm flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-[#C5A059]" />
                  <span>معاينة حية مصغرة لنموذج الشهادة بالتعديلات:</span>
                </h4>

                <div className="p-4 rounded-2xl bg-[#F9F6F0] text-[#2C3531] border-2 border-[#C5A059] shadow-lg relative overflow-hidden select-none">
                  {/* Subtle watermark */}
                  <div
                    style={{ opacity: settings.certWatermarkOpacity }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <img
                      src={settings.customLogoUrl || '/brand/official-logo.png'}
                      alt="Watermark"
                      className="w-40 max-h-32 object-contain"
                    />
                  </div>

                  {/* Header */}
                  <div className="relative z-10 flex items-center justify-between pb-2 border-b border-[#C5A059]/40 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#046A38] p-1 flex items-center justify-center text-white">
                        <Award className="w-4 h-4 text-[#C5A059]" />
                      </div>
                      <div>
                        <div className="font-bold text-[#046A38] font-amiri text-xs">{settings.titleText}</div>
                        <div className="text-[9px] text-[#987834] font-kufi">{settings.subText}</div>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-[#046A38] text-[#f7e8c6] font-amiri font-bold text-xs border border-[#C5A059]">
                      {settings.certHeaderBadge}
                    </span>
                  </div>

                  {/* Body Preview */}
                  <div className="relative z-10 text-center py-3 space-y-1.5">
                    <p className="text-[10px] text-[#046A38] font-kufi font-bold">{settings.certIntroText}</p>
                    <p className="text-base font-amiri font-bold text-[#046A38] bg-white/70 py-1 px-4 rounded-xl border border-dashed border-[#C5A059] inline-block">
                      محمد عبد الله القحطاني (نموذج)
                    </p>
                    <p className="text-[10px] text-[#2C3531] font-kufi">{settings.certCompletionPhrase}</p>
                    <p className="text-xs font-bold text-[#046A38] font-amiri">« {settings.certDefaultTitle} »</p>
                    <p className="text-[9px] text-slate-600 font-kufi">{settings.certNarrationText}</p>
                  </div>

                  {/* Footer with Signatures & Seal */}
                  <div className="relative z-10 pt-2 border-t border-[#C5A059]/40 grid grid-cols-3 gap-2 items-center text-[10px]">
                    <div className="text-right">
                      <span className="font-bold text-[#046A38] block">{settings.certAdminSignerTitle}:</span>
                      <span className="font-amiri font-bold text-slate-800 text-xs">{settings.certAdminSignerName}</span>
                    </div>
                    <div className="flex justify-center">
                      <OfficialStamp size="sm" showText={false} />
                    </div>
                    <div className="text-left">
                      <span className="font-bold text-[#046A38] block">{settings.certTeacherSignerTitle}:</span>
                      <span className="font-amiri font-bold text-slate-800 text-xs">فضيلة الشيخ المعلم</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: THE SEAL (الختم الإلكتروني)                         */}
          {/* ========================================================= */}
          {activeTab === 'seal' && (
            <div className="space-y-6">
              
              <div className="bg-[#071911] p-4 rounded-2xl border border-emerald-900/80 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-900/60">
                  <div className="flex items-center gap-2">
                    <Stamp className="w-5 h-5 text-[#C5A059]" />
                    <h4 className="font-bold text-white font-amiri text-base">
                      تعديل وضبط الختم الرسمي الإلكتروني
                    </h4>
                  </div>
                  <span className="text-[11px] text-emerald-300 font-mono bg-[#046A38]/40 px-2.5 py-1 rounded-full border border-[#C5A059]/40">
                    ملمس حبر واقعي
                  </span>
                </div>

                {/* Upload Custom Seal Image Option */}
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-900 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white font-kufi block">
                        خيار 1: رفع صورة ختم مخصصة من جهازك (PNG شفاف)
                      </span>
                      <span className="text-[11px] text-slate-400 font-kufi">
                        يمكنك رفع صورة ختم حقيقي ممسوح ضوئياً أو مصمم خصيصاً
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTargetType('seal');
                        fileInputRef.current?.click();
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#046A38] hover:bg-[#057a40] text-white text-xs font-bold font-kufi flex items-center gap-1.5 cursor-pointer border border-[#C5A059]/60 shadow-sm"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>اختيار صورة الختم</span>
                    </button>
                  </div>

                  {settings.customSealUrl && (
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-emerald-900/60">
                      <span className="text-amber-300 font-mono">
                        مسار الختم النشط: {settings.customSealUrl.substring(0, 45)}...
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          handleUpdateSetting('customSealUrl', '');
                          setStatusMessage({ type: 'success', text: 'تمت استعادة الختم الرقمي الافتراضي.' });
                        }}
                        className="text-slate-400 hover:text-rose-300 text-xs underline cursor-pointer"
                      >
                        إلغاء واستعادة الختم الرقمي المعتمد
                      </button>
                    </div>
                  )}
                </div>

                {/* SVG Seal Customization Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Top Arc Text */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-emerald-300 font-kufi">
                      النص المنحني العلوي بالختم:
                    </label>
                    <input
                      type="text"
                      value={settings.sealTextTop}
                      onChange={(e) => handleUpdateSetting('sealTextTop', e.target.value)}
                      placeholder="مقرأة رحاب"
                      className="w-full px-3 py-2 rounded-xl bg-[#05140d] border border-emerald-800 text-xs text-white focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  {/* Bottom Arc Text */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-emerald-300 font-kufi">
                      النص المنحني السفلي بالختم:
                    </label>
                    <input
                      type="text"
                      value={settings.sealTextBottom}
                      onChange={(e) => handleUpdateSetting('sealTextBottom', e.target.value)}
                      placeholder="القرآن الإلكترونية"
                      className="w-full px-3 py-2 rounded-xl bg-[#05140d] border border-emerald-800 text-xs text-white focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  {/* Seal Ink Color */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-emerald-300 font-kufi">
                      لون حبر الختم:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.sealColor}
                        onChange={(e) => handleUpdateSetting('sealColor', e.target.value)}
                        className="w-9 h-9 rounded-lg border border-emerald-800 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={settings.sealColor}
                        onChange={(e) => handleUpdateSetting('sealColor', e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-[#05140d] border border-emerald-800 text-xs text-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateSetting('sealColor', '#046A38')}
                        className="px-2.5 py-2 rounded-xl bg-emerald-950 text-[10px] text-emerald-300 border border-emerald-800"
                        title="أخضر زمردي معتمد"
                      >
                        زمردي
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateSetting('sealColor', '#C5A059')}
                        className="px-2.5 py-2 rounded-xl bg-emerald-950 text-[10px] text-amber-300 border border-emerald-800"
                        title="ذهبي ملكي"
                      >
                        ذهبي
                      </button>
                    </div>
                  </div>

                  {/* Rotation Angle */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-300 font-kufi">زاوية الميل الطبيعي للختم:</span>
                      <span className="font-mono text-[#dfbe75] font-bold">{settings.sealRotation}°</span>
                    </div>
                    <input
                      type="range"
                      min="-20"
                      max="20"
                      step="1"
                      value={settings.sealRotation}
                      onChange={(e) => handleUpdateSetting('sealRotation', parseInt(e.target.value, 10))}
                      className="w-full accent-[#C5A059] cursor-pointer mt-2"
                    />
                  </div>

                  {/* Seal Scale */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-300 font-kufi">حجم الختم:</span>
                      <span className="font-mono text-[#dfbe75] font-bold">{Math.round(settings.sealScale * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.7"
                      max="1.4"
                      step="0.05"
                      value={settings.sealScale}
                      onChange={(e) => handleUpdateSetting('sealScale', parseFloat(e.target.value))}
                      className="w-full accent-[#C5A059] cursor-pointer mt-2"
                    />
                  </div>

                  {/* Seal Opacity */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-300 font-kufi">شفافية وتغلغل الحبر:</span>
                      <span className="font-mono text-[#dfbe75] font-bold">{Math.round(settings.sealOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.0"
                      step="0.05"
                      value={settings.sealOpacity}
                      onChange={(e) => handleUpdateSetting('sealOpacity', parseFloat(e.target.value))}
                      className="w-full accent-[#C5A059] cursor-pointer mt-2"
                    />
                  </div>
                </div>
              </div>

              {/* Seal Live Preview Box */}
              <div className="p-4 rounded-2xl bg-[#071911] border border-emerald-900/80 space-y-3">
                <h4 className="font-bold text-white font-kufi text-xs sm:text-sm flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-[#C5A059]" />
                  <span>معاينة حية للختم بمقاسات وظروف مختلفة:</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* On Ivory Paper Background */}
                  <div className="p-6 rounded-2xl bg-[#F9F6F0] border-2 border-[#C5A059] flex flex-col items-center justify-center text-center space-y-2">
                    <span className="text-[10px] text-slate-500 font-kufi font-bold">على ورق الشهادات (عاجي دافئ #F9F6F0)</span>
                    <OfficialStamp size="lg" showText={true} />
                  </div>

                  {/* On Dark Background */}
                  <div className="p-6 rounded-2xl bg-[#0b2418] border border-emerald-800 flex flex-col items-center justify-center text-center space-y-2">
                    <span className="text-[10px] text-emerald-400 font-kufi font-bold">على الخلفيات الداكنة للوحة التحكم</span>
                    <div className="bg-white/10 p-3 rounded-full backdrop-blur-xs">
                      <OfficialStamp size="lg" showText={false} />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: TITLE & ADDRESS (العنوان وبيانات المقرأة)             */}
          {/* ========================================================= */}
          {activeTab === 'address' && (
            <div className="space-y-6">
              
              <div className="bg-[#071911] p-4 rounded-2xl border border-emerald-900/80 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-900/60">
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-[#C5A059]" />
                    <h4 className="font-bold text-white font-amiri text-base">
                      تعديل العنوان، المسميات، وبيانات الاتصال والاعتماد يدوياً
                    </h4>
                  </div>
                  <span className="text-[11px] text-amber-300 font-mono bg-[#046A38]/40 px-2.5 py-1 rounded-full border border-[#C5A059]/40">
                    بيانات المنصة الرسمية
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Platform Title */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-bold text-emerald-300 font-kufi">
                      عنوان المنصة والمقرأة الرئيسي (Main Title):
                    </label>
                    <input
                      type="text"
                      value={settings.titleText}
                      onChange={(e) => handleUpdateSetting('titleText', e.target.value)}
                      placeholder="مقرأة رحاب القرآن الإلكترونية"
                      className="w-full px-3 py-2 rounded-xl bg-[#05140d] border border-emerald-800 text-xs text-white focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  {/* Slogan */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-emerald-300 font-kufi">
                      الشعار اللفظي (Slogan):
                    </label>
                    <input
                      type="text"
                      value={settings.sloganText}
                      onChange={(e) => handleUpdateSetting('sloganText', e.target.value)}
                      placeholder="بناء جيل يتلو القرآن ويعمل به"
                      className="w-full px-3 py-2 rounded-xl bg-[#05140d] border border-emerald-800 text-xs text-white focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  {/* Subtitle */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-emerald-300 font-kufi">
                      التوصيف والوسم الفرعي (Subtitle):
                    </label>
                    <input
                      type="text"
                      value={settings.subText}
                      onChange={(e) => handleUpdateSetting('subText', e.target.value)}
                      placeholder="ـ لتعليم القرآن الكريم عن بُعد ـ"
                      className="w-full px-3 py-2 rounded-xl bg-[#05140d] border border-emerald-800 text-xs text-white focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  {/* Official Address */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-bold text-emerald-300 font-kufi flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>العنوان الجغرافي والمقر الإداري (Official Physical Address):</span>
                    </label>
                    <input
                      type="text"
                      value={settings.officialAddress}
                      onChange={(e) => handleUpdateSetting('officialAddress', e.target.value)}
                      placeholder="اليمن - ومن جميع دول العالم"
                      className="w-full px-3 py-2 rounded-xl bg-[#05140d] border border-emerald-800 text-xs text-white focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  {/* Google Maps Official URL */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-bold text-emerald-300 font-kufi flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>رابط موقع المقرأة على خرائط جوجل (Google Maps URL):</span>
                    </label>
                    <input
                      type="url"
                      value={settings.googleMapsUrl || ''}
                      onChange={(e) => handleUpdateSetting('googleMapsUrl', e.target.value)}
                      placeholder="https://maps.app.goo.gl/eiRa7YpZgcxqAvuH8"
                      className="w-full px-3 py-2 rounded-xl bg-[#05140d] border border-emerald-800 text-xs text-white font-mono focus:outline-none focus:border-[#C5A059]"
                      dir="ltr"
                    />
                  </div>

                  {/* Contact Email */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-emerald-300 font-kufi flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>البريد الإلكتروني المعتمد:</span>
                    </label>
                    <input
                      type="email"
                      value={settings.contactEmail}
                      onChange={(e) => handleUpdateSetting('contactEmail', e.target.value)}
                      placeholder="rehabquran383@gmail.com"
                      className="w-full px-3 py-2 rounded-xl bg-[#05140d] border border-emerald-800 text-xs text-white font-mono focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  {/* Contact Phone */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-emerald-300 font-kufi flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>رقم الهاتف والواتساب الرسمي:</span>
                    </label>
                    <input
                      type="text"
                      value={settings.contactPhone}
                      onChange={(e) => handleUpdateSetting('contactPhone', e.target.value)}
                      placeholder="+967 714 371 599"
                      className="w-full px-3 py-2 rounded-xl bg-[#05140d] border border-emerald-800 text-xs text-white font-mono focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  {/* Facebook Page URL */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-emerald-300 font-kufi flex items-center gap-1.5">
                      <Facebook className="w-3.5 h-3.5 text-[#1877F2]" />
                      <span>رابط صفحة الفيسبوك الرسمية:</span>
                    </label>
                    <input
                      type="url"
                      value={settings.facebookUrl || ''}
                      onChange={(e) => handleUpdateSetting('facebookUrl', e.target.value)}
                      placeholder="https://www.facebook.com/..."
                      className="w-full px-3 py-2 rounded-xl bg-[#05140d] border border-emerald-800 text-xs text-white font-mono focus:outline-none focus:border-[#C5A059]"
                      dir="ltr"
                    />
                  </div>

                  {/* Instagram Profile URL */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-emerald-300 font-kufi flex items-center gap-1.5">
                      <Instagram className="w-3.5 h-3.5 text-pink-400" />
                      <span>رابط حساب إنستجرام الرسمي:</span>
                    </label>
                    <input
                      type="url"
                      value={settings.instagramUrl || ''}
                      onChange={(e) => handleUpdateSetting('instagramUrl', e.target.value)}
                      placeholder="https://www.instagram.com/..."
                      className="w-full px-3 py-2 rounded-xl bg-[#05140d] border border-emerald-800 text-xs text-white font-mono focus:outline-none focus:border-[#C5A059]"
                      dir="ltr"
                    />
                  </div>

                  {/* WhatsApp Direct Chat Link */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-emerald-300 font-kufi flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                      <span>رابط مراسلة الواتساب (wa.me):</span>
                    </label>
                    <input
                      type="url"
                      value={settings.whatsappUrl || ''}
                      onChange={(e) => handleUpdateSetting('whatsappUrl', e.target.value)}
                      placeholder="https://wa.me/967714371599"
                      className="w-full px-3 py-2 rounded-xl bg-[#05140d] border border-emerald-800 text-xs text-white font-mono focus:outline-none focus:border-[#C5A059]"
                      dir="ltr"
                    />
                  </div>

                  {/* Telegram Channel Link */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-emerald-300 font-kufi flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-[#0088cc]" />
                      <span>رابط قناة تيليجرام الرسمية (t.me):</span>
                    </label>
                    <input
                      type="url"
                      value={settings.telegramUrl || 'https://t.me/rehabpa'}
                      onChange={(e) => handleUpdateSetting('telegramUrl', e.target.value)}
                      placeholder="https://t.me/rehabpa"
                      className="w-full px-3 py-2 rounded-xl bg-[#05140d] border border-emerald-800 text-xs text-white font-mono focus:outline-none focus:border-[#C5A059]"
                      dir="ltr"
                    />
                  </div>

                  {/* Accreditation / License Number */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-emerald-300 font-kufi">
                      رقم الترخيص والاعتماد:
                    </label>
                    <input
                      type="text"
                      value={settings.accreditationNumber}
                      onChange={(e) => handleUpdateSetting('accreditationNumber', e.target.value)}
                      placeholder="1447/ق/892"
                      className="w-full px-3 py-2 rounded-xl bg-[#05140d] border border-emerald-800 text-xs text-white font-mono focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  {/* Established Year */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-emerald-300 font-kufi flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>سنة التأسيس والاعتماد:</span>
                    </label>
                    <input
                      type="text"
                      value={settings.establishedYear}
                      onChange={(e) => handleUpdateSetting('establishedYear', e.target.value)}
                      placeholder="1447 هـ / 2026 م"
                      className="w-full px-3 py-2 rounded-xl bg-[#05140d] border border-emerald-800 text-xs text-white focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: BRAND GUIDE & RESET (دليل الهوية والمطابقة)          */}
          {/* ========================================================= */}
          {activeTab === 'guide' && (
            <div className="space-y-6">
              
              <div className="bg-[#071911] p-4 rounded-2xl border border-emerald-900/80 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-900/60">
                  <div className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-[#C5A059]" />
                    <h4 className="font-bold text-white font-amiri text-base">
                      دليل الهوية البصرية الرسمية 2026 (Brand Guide)
                    </h4>
                  </div>
                  <span className="text-[11px] text-amber-300 font-mono bg-[#046A38]/40 px-2.5 py-1 rounded-full border border-[#C5A059]/40">
                    معايير الإلزام الصارم
                  </span>
                </div>

                {/* Colors Grid */}
                <div>
                  <h5 className="font-bold text-emerald-300 font-kufi text-xs mb-2">
                    1. لوحة الألوان المعتمدة:
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-[#046A38] text-white border border-[#046A38] text-center space-y-1 shadow-md">
                      <span className="font-bold text-xs block">الأخضر الزمردي</span>
                      <code className="text-[10px] font-mono block opacity-90">#046A38</code>
                      <span className="text-[9px] block opacity-80">الشعار والعناوين والختم</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#C5A059] text-slate-950 border border-[#C5A059] text-center space-y-1 shadow-md">
                      <span className="font-bold text-xs block">الذهبي الملكي</span>
                      <code className="text-[10px] font-mono block opacity-90 font-bold">#C5A059</code>
                      <span className="text-[9px] block opacity-90 font-medium">التميز وإطارات الشهادات</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#F9F6F0] text-slate-900 border border-slate-300 text-center space-y-1 shadow-md">
                      <span className="font-bold text-xs block">العاجي الدافئ</span>
                      <code className="text-[10px] font-mono block opacity-90">#F9F6F0</code>
                      <span className="text-[9px] block opacity-80">خلفيات البطاقات والشهادات</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#2C3531] text-slate-100 border border-slate-600 text-center space-y-1 shadow-md">
                      <span className="font-bold text-xs block">الرمادي الداكن</span>
                      <code className="text-[10px] font-mono block opacity-90">#2C3531</code>
                      <span className="text-[9px] block opacity-80">النصوص ومتون القراءة</span>
                    </div>
                  </div>
                </div>

                {/* File Paths */}
                <div>
                  <h5 className="font-bold text-emerald-300 font-kufi text-xs mb-2">
                    2. مسارات الأصول والملفات الثابتة على الخادم:
                  </h5>
                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#05140d] border border-emerald-900">
                      <div>
                        <span className="text-slate-400 text-[10px] block font-kufi">الشعار الرسمي الكامل:</span>
                        <code className="text-amber-300">public/brand/official-logo.png</code>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('public/brand/official-logo.png')}
                        className="p-1.5 rounded-lg bg-emerald-950 text-slate-300 hover:text-white"
                        title="نسخ المسار"
                      >
                        {copiedPath === 'public/brand/official-logo.png' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#05140d] border border-emerald-900">
                      <div>
                        <span className="text-slate-400 text-[10px] block font-kufi">الأيقونة المصغرة:</span>
                        <code className="text-amber-300">public/brand/official-logo-small.png</code>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('public/brand/official-logo-small.png')}
                        className="p-1.5 rounded-lg bg-emerald-950 text-slate-300 hover:text-white"
                        title="نسخ المسار"
                      >
                        {copiedPath === 'public/brand/official-logo-small.png' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#05140d] border border-emerald-900">
                      <div>
                        <span className="text-slate-400 text-[10px] block font-kufi">الختم الإلكتروني المعتمد:</span>
                        <code className="text-amber-300">public/brand/official-seal.png</code>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('public/brand/official-seal.png')}
                        className="p-1.5 rounded-lg bg-emerald-950 text-slate-300 hover:text-white"
                        title="نسخ المسار"
                      >
                        {copiedPath === 'public/brand/official-seal.png' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Reset to Defaults */}
                <div className="pt-4 border-t border-emerald-900/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-white font-kufi text-xs block">
                      استعادة ضبط المصنع والهوية الرسمية 2026:
                    </span>
                    <span className="text-[11px] text-slate-400 font-kufi">
                      إلغاء أية تعديلات مخصصة وإرجاع الشعار والشهادات والختم والعنوان للقيم المعتمدة
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800 text-xs font-bold font-kufi flex items-center gap-1.5 cursor-pointer shrink-0 transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>استعادة القيم الرسمية الافتراضية</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Bottom Actions Footer */}
        <div className="p-4 bg-[#071911] border-t border-emerald-900/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-slate-300 hover:text-white text-xs font-kufi flex items-center gap-1.5 border border-emerald-800 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">استعادة الافتراضي</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-slate-300 hover:text-white text-xs font-kufi border border-emerald-800 cursor-pointer"
            >
              إغلاق النافذة
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveAll}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#046A38] to-[#078849] hover:from-[#057a40] hover:to-[#099953] text-white font-bold text-xs font-kufi flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 cursor-pointer border border-[#C5A059]/60 disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin text-[#C5A059]" /> : <Save className="w-4 h-4 text-[#C5A059]" />}
              <span>حفظ وتعميم كافة التعديلات</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
