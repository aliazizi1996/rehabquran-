import React, { useState, useEffect, useRef } from 'react';
import {
  Upload, Sliders, Image as ImageIcon, Sparkles, CheckCircle2,
  RefreshCw, RotateCcw, Copy, Check, Eye, Download, ShieldCheck,
  AlertCircle, ExternalLink, Award, FileText, Palette, Save,
  Maximize2, ArrowRight, Layers, Sun, Moon, Info, Trash2, CheckCircle,
  Building2
} from 'lucide-react';
import {
  getBrandLogoSettings,
  saveBrandLogoSettings,
  resetBrandLogoSettings,
  autoCalibrateBrandLogo,
  BrandLogoCustomization,
  DEFAULT_BRAND_LOGO_SETTINGS,
} from '../../utils/brandLogoStore';
import { uploadBrandAssetToFirebaseStorage, BrandAssetUploadResult } from '../../lib/firebaseStorage';
import { OfficialLogo, OfficialStamp } from '../OfficialLogo';
import { TajweedPdfSettingsManager } from './TajweedPdfSettingsManager';

export type BrandAssetTab = 'logo' | 'seal' | 'membership' | 'pdf_settings' | 'certs' | 'preview' | 'audit';

interface AdminBrandAssetsManagerProps {
  onBack?: () => void;
}

export const AdminBrandAssetsManager: React.FC<AdminBrandAssetsManagerProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<BrandAssetTab>('logo');
  const [settings, setSettings] = useState<BrandLogoCustomization>(getBrandLogoSettings());
  const [previewBg, setPreviewBg] = useState<'ivory' | 'white' | 'dark'>('ivory');
  
  // Logo sub-mode: colored full or transparent
  const [logoVariant, setLogoVariant] = useState<'full' | 'transparent' | 'small'>('full');

  // Upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      setSettings(e.detail || getBrandLogoSettings());
    };
    window.addEventListener('brand_logo_updated', handleUpdate);
    return () => window.removeEventListener('brand_logo_updated', handleUpdate);
  }, []);

  const handleTabChange = (tab: BrandAssetTab) => {
    setActiveTab(tab);
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    setFeedback(null);
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.includes('png') && !file.type.includes('image/')) {
      setFeedback({ type: 'error', message: 'يرجى اختيار ملف صورة صالح بصيغة PNG أو صورة عالية الدقة.' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'حجم الصورة كبير جداً. الحد الأقصى المسموح هو 10 ميغابايت.' });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
      setFeedback(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUploadAndSave = async (targetType: 'official-logo' | 'small' | 'seal' | 'certificate-bg') => {
    if (!selectedFile) {
      setFeedback({ type: 'error', message: 'يرجى اختيار صورة PNG أولاً قبل بدء الرفع.' });
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setFeedback({ type: 'info', message: 'جاري رفع الملف إلى Firebase Storage وتحديث مسارات المنظومة...' });

    try {
      const res: BrandAssetUploadResult = await uploadBrandAssetToFirebaseStorage(
        selectedFile,
        targetType,
        (pct) => setUploadProgress(Math.max(10, pct))
      );

      setUploadProgress(100);
      setSettings(getBrandLogoSettings());
      setSelectedFile(null);
      setPreviewUrl(null);

      const targetArabicName = 
        targetType === 'official-logo' ? (logoVariant === 'transparent' ? 'الشعار الرسمي (النسخة الشفافة)' : 'الشعار الرسمي (النسخة الملونة)') :
        targetType === 'small' ? 'الأيقونة المصغرة للشعار' :
        targetType === 'seal' ? 'الختم الإلكتروني المعتمد' :
        'قالب وخلفية الشهادة';

      setFeedback({
        type: 'success',
        message: `تم بنجاح رفع ${targetArabicName} وتخزينه في Firebase Storage وتحديث مسارات النظام فورياً.`
      });
    } catch (err: any) {
      console.error('Upload failed:', err);
      setFeedback({
        type: 'error',
        message: `فشل رفع الملف: ${err?.message || 'تعذر الاتصال بـ Firebase Storage'}`
      });
    } finally {
      setIsUploading(false);
    }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleResetDefaults = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في استعادة ضبط المصنع والهوية الرسمية 2026؟ سيتم إلغاء أي تعديلات مخصصة وإرجاع الأصول الافتراضية.')) {
      resetBrandLogoSettings();
      setSettings(getBrandLogoSettings());
      setFeedback({ type: 'success', message: 'تمت استعادة الأصول الرسمية المعتمدة للهوية 2026 بنجاح.' });
    }
  };

  return (
    <div className="space-y-6 w-full text-[#2C3531] font-sans text-right" dir="rtl">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-l from-emerald-950 via-[#046A38] to-emerald-900 rounded-3xl p-6 text-white border-2 border-[#C5A059] shadow-lg relative overflow-hidden">
        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-[#C5A059]/15 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-10 h-10 rounded-2xl bg-[#C5A059]/20 border border-[#C5A059]/40 flex items-center justify-center text-[#f7e8c6]">
                <Palette className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold font-serif text-[#f7e8c6]">
                لوحة إعدادات الهوية البصرية الرسمية 2026
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#046A38] text-white border border-[#C5A059] text-[11px] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#C5A059]" />
                <span>دليل الهوية المعتمد</span>
              </span>
            </div>
            <p className="text-xs text-emerald-100 max-w-2xl leading-relaxed font-sans">
              الواجهة المعتمدة لإدارة وتخصيص الهوية البصرية: رفع الشعار (النسخة الملونة والنسخة الشفافة)، رفع الختم الإلكتروني، تعديل قالب الشهادة، والمعاينة المباشرة للتغييرات في الوقت الفعلي مع الحفظ السحابي في Firebase Storage.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>العودة للإدارة</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3.5 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="استعادة الأصول الرسمية المعتمدة لعام 2026"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>استعادة ضبط 2026</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Feedback Notification */}
      {feedback && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 border transition-all animate-fadeIn ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
            : feedback.type === 'error'
            ? 'bg-rose-50 text-rose-900 border-rose-300'
            : 'bg-amber-50 text-amber-900 border-amber-300'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {feedback.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            {feedback.type === 'info' && <RefreshCw className="w-4 h-4 text-amber-600 animate-spin shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setFeedback(null)} 
            className="text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3. Main Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => handleTabChange('logo')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeTab === 'logo'
              ? 'bg-[#046A38] text-white shadow-sm border border-[#C5A059]'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-[#C5A059]" />
          <span>1. رفع الشعار (ملونة وشفافة)</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('seal')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeTab === 'seal'
              ? 'bg-[#046A38] text-white shadow-sm border border-[#C5A059]'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
          <span>2. رفع الختم الإلكتروني</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('membership')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeTab === 'membership'
              ? 'bg-[#046A38] text-white shadow-sm border border-[#C5A059]'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4 text-[#C5A059]" />
          <span>3. إظهار/إخفاء عضوية التجمع العالمي</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
            settings.showGlobalAssemblyMembership
              ? 'bg-amber-400 text-slate-950'
              : 'bg-slate-100 text-slate-500'
          }`}>
            {settings.showGlobalAssemblyMembership ? 'مُفعَّل' : 'مخفي'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('certs')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeTab === 'certs'
              ? 'bg-[#046A38] text-white shadow-sm border border-[#C5A059]'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Award className="w-4 h-4 text-[#C5A059]" />
          <span>3. تعديل قالب الشهادة</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('pdf_settings')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeTab === 'pdf_settings'
              ? 'bg-[#046A38] text-white shadow-sm border border-[#C5A059]'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4 text-[#C5A059]" />
          <span>4. إعدادات وثائق PDF وملخصات التجويد</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('preview')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeTab === 'preview'
              ? 'bg-[#046A38] text-white shadow-sm border border-[#C5A059]'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Eye className="w-4 h-4 text-[#C5A059]" />
          <span>4. معاينة مباشرة للتغييرات</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('audit')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-[#046A38] text-white shadow-sm border border-[#C5A059]'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4 text-[#C5A059]" />
          <span>سجل المسارات وروابط التخزين</span>
        </button>
      </div>

      {/* 4. Tab 1: رفع الشعار (ملونة وشفافة) */}
      {activeTab === 'logo' && (
        <div className="space-y-6">
          {/* شريط التحكم السريع بظهور صفة عضو التجمع العالمي */}
          <div className="bg-[#F9F6F0] p-3.5 sm:p-4 rounded-2xl border border-[#C5A059]/60 flex items-center justify-between gap-3 flex-wrap shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#046A38]/10 text-[#046A38] flex items-center justify-center font-bold shrink-0">
                <Building2 className="w-4 h-4 text-[#046A38]" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">ظهور صفة «عضو التجمع العالمي للقرآن الكريم»:</span>
                <span className="text-[11px] text-slate-500">
                  {settings.showGlobalAssemblyMembership
                    ? '🟢 مُفعَّل: العبارة ظاهرة حالياً في ترويسات وصفحات المقرأة'
                    : '⚪ مخفي ومحذوف: العبارة محذوفة من جميع الصفحات (الافتراضي والمعتمد)'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextVal = !settings.showGlobalAssemblyMembership;
                const updated = saveBrandLogoSettings({ showGlobalAssemblyMembership: nextVal });
                setSettings(updated);
                setFeedback({
                  type: 'success',
                  message: nextVal
                    ? 'تم إظهار صفة عضو التجمع العالمي للقرآن الكريم في واجهات المنظومة.'
                    : 'تم إخفاء وحذف صفة عضو التجمع العالمي للقرآن الكريم من جميع الصفحات.'
                });
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                settings.showGlobalAssemblyMembership
                  ? 'bg-amber-100 text-amber-950 border-[#C5A059] hover:bg-amber-200'
                  : 'bg-[#046A38] text-white border-[#046A38] hover:bg-[#03542c]'
              }`}
            >
              {settings.showGlobalAssemblyMembership ? 'إخفاء وحذف من الصفحات ✕' : 'إظهار في الصفحات ✓'}
            </button>
          </div>

          {/* Sub-variant selection */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700 ml-2">اختر النسخة المراد رفعها أو معايرتها:</span>
            <button
              type="button"
              onClick={() => setLogoVariant('full')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                logoVariant === 'full' ? 'bg-[#046A38] text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              النسخة الملونة الكاملة
            </button>
            <button
              type="button"
              onClick={() => setLogoVariant('transparent')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                logoVariant === 'transparent' ? 'bg-[#046A38] text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              النسخة الشفافة (Transparent PNG)
            </button>
            <button
              type="button"
              onClick={() => setLogoVariant('small')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                logoVariant === 'small' ? 'bg-[#046A38] text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              الأيقونة المصغرة للشعار
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Live Preview Box (5 cols) */}
            <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold font-serif text-[#046A38] text-sm flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-[#046A38]" />
                  <span>معاينة {logoVariant === 'transparent' ? 'النسخة الشفافة' : logoVariant === 'small' ? 'الأيقونة المصغرة' : 'النسخة الملونة'}</span>
                </h3>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => setPreviewBg('ivory')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      previewBg === 'ivory' ? 'bg-[#F9F6F0] text-[#046A38] shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    عاجي
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewBg('white')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      previewBg === 'white' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    أبيض
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewBg('dark')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      previewBg === 'dark' ? 'bg-slate-900 text-amber-200 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    داكن
                  </button>
                </div>
              </div>

              <div className={`w-full min-h-[260px] rounded-2xl border-2 border-dashed border-[#C5A059]/40 flex flex-col items-center justify-center p-6 relative transition-colors ${
                previewBg === 'ivory' ? 'bg-[#F9F6F0]' : previewBg === 'white' ? 'bg-white' : 'bg-[#071911]'
              }`}>
                {previewUrl ? (
                  <div className="space-y-2 text-center">
                    <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-700 text-[10px] font-bold">
                      معاينة الملف المختار قبل الرفع
                    </span>
                    <img
                      src={previewUrl}
                      alt="معاينة الشعار"
                      className="max-h-48 max-w-full object-contain mx-auto"
                      style={{
                        transform: `scale(${settings.scale}) rotate(${settings.rotation}deg)`,
                        filter: `brightness(${settings.brightness}%) contrast(${settings.contrast}%)`,
                      }}
                    />
                  </div>
                ) : logoVariant === 'small' ? (
                  <img
                    src={settings.customSmallLogoUrl || '/brand/official-logo-small.png'}
                    alt="الأيقونة المصغرة"
                    className="w-24 h-24 object-contain"
                  />
                ) : (
                  <OfficialLogo size="xl" showText={true} />
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">المسار المعتمد:</span>
                  <button
                    type="button"
                    onClick={() => copyText(settings.customLogoUrl || '/brand/official-logo.png', 'logo-p')}
                    className="text-[#046A38] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'logo-p' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>نسخ</span>
                  </button>
                </div>
                <code className="block font-mono text-[11px] text-slate-800 bg-white p-2 rounded-xl border border-slate-200 truncate" dir="ltr">
                  {logoVariant === 'small' ? (settings.customSmallLogoUrl || '/brand/official-logo-small.png') : (settings.customLogoUrl || '/brand/official-logo.png')}
                </code>
              </div>
            </div>

            {/* Upload Area (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold font-serif text-[#046A38] text-base flex items-center gap-2">
                    <Upload className="w-5 h-5 text-[#046A38]" />
                    <span>رفع صورة PNG لـ {logoVariant === 'transparent' ? 'النسخة الشفافة' : logoVariant === 'small' ? 'الأيقونة المصغرة' : 'النسخة الملونة'}</span>
                  </h3>
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    PNG عالية الدقة
                  </span>
                </div>

                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all space-y-3 ${
                    selectedFile
                      ? 'border-[#046A38] bg-emerald-50/50'
                      : 'border-slate-300 hover:border-[#C5A059] bg-[#F9F6F0]/60 hover:bg-[#F9F6F0]'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png,image/svg+xml"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                  />

                  <div className="w-14 h-14 rounded-2xl bg-[#046A38]/10 text-[#046A38] flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>

                  {selectedFile ? (
                    <div>
                      <span className="font-bold text-[#046A38] text-sm block">
                        تم اختيار: {selectedFile.name}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        الحجم: {(selectedFile.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="font-bold text-slate-800 text-sm block">
                        اسحب ملف PNG هنا أو انقر للاختيار من جهازك
                      </span>
                      <p className="text-xs text-slate-500 mt-1">
                        {logoVariant === 'transparent' ? 'ارفع شعاراً بخلفية شفافة تماماً بدون تشويه أو تمديد' : 'ارفع الشعار الرسمي الكامل المعتمد لعام 2026'}
                      </p>
                    </div>
                  )}
                </div>

                {isUploading && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-600">
                      <span>جاري الرفع إلى Firebase Storage...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#046A38] to-[#C5A059]" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    disabled={!selectedFile || isUploading}
                    onClick={() => handleUploadAndSave(logoVariant === 'small' ? 'small' : 'official-logo')}
                    className="px-6 py-2.5 rounded-xl bg-[#046A38] hover:bg-[#03542c] text-white font-bold text-xs font-serif flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50 transition-all border border-[#C5A059]"
                  >
                    {isUploading ? <RefreshCw className="w-4 h-4 animate-spin text-[#C5A059]" /> : <Save className="w-4 h-4 text-[#C5A059]" />}
                    <span>تخزين في Firebase Storage وتحديث الشعار فورياً</span>
                  </button>
                </div>
              </div>

              {/* Geometry Guidelines Check */}
              <div className="bg-[#F9F6F0] p-4 rounded-2xl border border-[#C5A059]/40 space-y-2 text-xs">
                <span className="font-bold text-[#046A38] block font-serif">
                  ضوابط استخدام الشعار المعتمدة (صفحة 5 بالدليل الرسمي):
                </span>
                <ul className="space-y-1 text-slate-700 list-disc list-inside text-[11px]">
                  <li>الحفاظ على مساحة آمنة حول الشعار من جميع الجهات.</li>
                  <li>استخدام النسخة الشفافة فوق الخلفيات الملونة الهادئة.</li>
                  <li>الالتزام بالنسب الأصلية للطول والعرض عند التكبير أو التصغير (يُمنع ضغط الشعار أو تمديده).</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab 2: رفع الختم الإلكتروني */}
      {activeTab === 'seal' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold font-serif text-[#046A38] text-sm pb-2 border-b border-slate-100">
              معاينة الختم الإلكتروني المعتمد
            </h3>
            <div className="w-full min-h-[260px] rounded-2xl bg-[#F9F6F0] border-2 border-dashed border-[#C5A059]/40 flex flex-col items-center justify-center p-6 relative overflow-hidden">
              {previewUrl ? (
                <img src={previewUrl} alt="معاينة الختم" className="w-36 h-36 object-contain filter drop-shadow-md" />
              ) : (
                <OfficialStamp size="lg" showText={true} />
              )}
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
              <span className="text-slate-500 font-bold block">مسار الختم الحالي:</span>
              <code className="block font-mono text-[11px] text-slate-800 bg-white p-2 rounded-xl border border-slate-200 truncate" dir="ltr">
                {settings.customSealUrl || '/brand/official-seal.png'}
              </code>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold font-serif text-[#046A38] text-base">
                  رفع صورة PNG للختم الإلكتروني
                </h3>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  ملمس حبر واقعي #046A38
                </span>
              </div>

              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-[#C5A059] bg-[#F9F6F0]/60 p-8 rounded-3xl text-center cursor-pointer transition-all space-y-3"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-12 h-12 rounded-2xl bg-[#046A38]/10 text-[#046A38] flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <p className="font-bold text-sm text-slate-800">
                  {selectedFile ? `تم اختيار: ${selectedFile.name}` : 'اسحب صورة PNG للختم هنا أو انقر للاختيار'}
                </p>
                <p className="text-xs text-slate-500">خلفية شفافة تماماً وملمس حبري أخضر زمردي معتمد</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={!selectedFile || isUploading}
                  onClick={() => handleUploadAndSave('seal')}
                  className="px-6 py-2.5 rounded-xl bg-[#046A38] hover:bg-[#03542c] text-white font-bold text-xs font-serif flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50 transition-all border border-[#C5A059]"
                >
                  {isUploading ? <RefreshCw className="w-4 h-4 animate-spin text-[#C5A059]" /> : <Save className="w-4 h-4 text-[#C5A059]" />}
                  <span>تخزين الختم في Firebase Storage وتحديث الشهادات فورياً</span>
                </button>
              </div>
            </div>

            {/* Seal Text & Angle Tuning */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h4 className="font-bold font-serif text-[#046A38] text-sm pb-2 border-b border-slate-100">
                ضبط نصوص وزاوية الختم المعتمد
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">نص القوس العلوي:</label>
                  <input
                    type="text"
                    value={settings.sealTextTop || 'مقرأة رحاب'}
                    onChange={(e) => {
                      const updated = saveBrandLogoSettings({ sealTextTop: e.target.value });
                      setSettings(updated);
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#046A38] outline-hidden font-serif"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">نص القوس السفلي:</label>
                  <input
                    type="text"
                    value={settings.sealTextBottom || 'القرآن الإلكترونية'}
                    onChange={(e) => {
                      const updated = saveBrandLogoSettings({ sealTextBottom: e.target.value });
                      setSettings(updated);
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#046A38] outline-hidden font-serif"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">النص المركزي:</label>
                  <input
                    type="text"
                    value={settings.sealCenterText || 'إتقان وسند'}
                    onChange={(e) => {
                      const updated = saveBrandLogoSettings({ sealCenterText: e.target.value });
                      setSettings(updated);
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#046A38] outline-hidden font-serif"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">ميلان الختم الحبري الطبيعي (-3°):</label>
                  <input
                    type="range"
                    min="-15"
                    max="15"
                    value={settings.sealRotation ?? -3}
                    onChange={(e) => {
                      const updated = saveBrandLogoSettings({ sealRotation: parseInt(e.target.value, 10) });
                      setSettings(updated);
                    }}
                    className="w-full accent-[#046A38] cursor-pointer mt-2"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab: إعدادات العضوية والظهور الرسمي (عضو التجمع العالمي للقرآن الكريم) */}
      {activeTab === 'membership' && (
        <div className="space-y-6 animate-fade-in" dir="rtl">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#C5A059] uppercase">إعدادات الهوية والشارات الرسمية</span>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    settings.showGlobalAssemblyMembership
                      ? 'bg-emerald-50 text-[#046A38] border-emerald-300'
                      : 'bg-amber-50 text-amber-800 border-amber-300'
                  }`}>
                    {settings.showGlobalAssemblyMembership ? 'الحالة: ظاهرة في الواجهات' : 'الحالة: مخفية ومحذوفة (الافتراضي)'}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold font-serif text-[#046A38]">
                  التحكم في ظهور صفة «عضو التجمع العالمي للقرآن الكريم»
                </h3>
              </div>

              {/* زر التبديل السريع */}
              <button
                type="button"
                onClick={() => {
                  const nextVal = !settings.showGlobalAssemblyMembership;
                  const updated = saveBrandLogoSettings({ showGlobalAssemblyMembership: nextVal });
                  setSettings(updated);
                  setFeedback({
                    type: 'success',
                    message: nextVal
                      ? 'تم تفعيل إظهار صفة عضو التجمع العالمي للقرآن الكريم في واجهات المنظومة.'
                      : 'تم بنجاح إخفاء وحذف صفة عضو التجمع العالمي للقرآن الكريم من جميع الصفحات والترويسات.'
                  });
                }}
                className={`relative inline-flex h-9 w-20 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  settings.showGlobalAssemblyMembership ? 'bg-[#046A38]' : 'bg-slate-300'
                }`}
                title={settings.showGlobalAssemblyMembership ? 'انقر لإخفاء العبارة من الصفحات' : 'انقر لإظهار العبارة في الصفحات'}
              >
                <span className="sr-only">تبديل ظهور عضوية التجمع</span>
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-8 w-8 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out flex items-center justify-center text-xs font-bold ${
                    settings.showGlobalAssemblyMembership ? '-translate-x-11 text-[#046A38]' : 'translate-x-0 text-slate-400'
                  }`}
                >
                  {settings.showGlobalAssemblyMembership ? '✓' : '✕'}
                </span>
              </button>
            </div>

            {/* تفاصيل وشرح الضابط الإداري */}
            <div className="bg-[#F9F6F0] p-5 rounded-2xl border border-[#C5A059]/40 space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <div className="flex items-center gap-2 font-bold text-[#046A38]">
                <Info className="w-4 h-4 text-[#C5A059]" />
                <span>التعليمات والضوابط الإدارية:</span>
              </div>
              <p>
                تم حذف اسم <strong>«عضو التجمع العالمي للقرآن الكريم»</strong> من جميع الصفحات والترويسات الظاهرة (الصفحة الرئيسية، شريط الإعلانات العلوي، نبذة من نحن، التذييل، صفحات الطلاب، صفحات المعلمين، واستمارة التسجيل).
              </p>
              <p className="text-slate-600">
                هذا الخيار محصور حصرياً بـ <strong>لوحة المشرف العام</strong>؛ بحيث يمكنك في أي وقت إظهاره إذا تطلب الأمر أو إبقاؤه مخفياً ومحذوفاً بالكامل بنقرة زر واحدة دون التأثير على بقية عناصر الهوية البصرية الرسمية لعام 2026.
              </p>
            </div>

            {/* بطاقة التبديل السريع التفاعلية */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                onClick={() => {
                  const updated = saveBrandLogoSettings({ showGlobalAssemblyMembership: false });
                  setSettings(updated);
                  setFeedback({ type: 'success', message: 'تم إخفاء وحذف العبارة من جميع الصفحات.' });
                }}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  !settings.showGlobalAssemblyMembership
                    ? 'border-[#046A38] bg-emerald-50/40 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold font-serif text-[#046A38] text-sm">1. الوضع الافتراضي والمعتمد (إخفاء وحذف)</span>
                  {!settings.showGlobalAssemblyMembership && <CheckCircle2 className="w-5 h-5 text-[#046A38]" />}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  تكون عبارة «عضو التجمع العالمي للقرآن الكريم» محذوفة تماماً من كافة الترويسات والبطاقات والأشرطة الإعلانية لجميع الزوار والطلاب والمعلمين.
                </p>
                <div className="pt-2">
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700">
                    الوضع النشط حالياً ✅
                  </span>
                </div>
              </div>

              <div
                onClick={() => {
                  const updated = saveBrandLogoSettings({ showGlobalAssemblyMembership: true });
                  setSettings(updated);
                  setFeedback({ type: 'success', message: 'تم تفعيل وإظهار العبارة في صفحات المقرأة.' });
                }}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  settings.showGlobalAssemblyMembership
                    ? 'border-[#046A38] bg-emerald-50/40 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold font-serif text-[#046A38] text-sm">2. تفعيل الإظهار (بقرار المشرف)</span>
                  {settings.showGlobalAssemblyMembership && <CheckCircle2 className="w-5 h-5 text-[#046A38]" />}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  تظهر العبارة كشارة رسمية في الشريط العلوي، وقسم من نحن، وبوابة المعلم والطالب واستمارة التسجيل.
                </p>
                <div className="pt-2">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                    settings.showGlobalAssemblyMembership
                      ? 'bg-[#046A38] text-white border-[#046A38]'
                      : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}>
                    {settings.showGlobalAssemblyMembership ? 'الوضع النشط حالياً ✅' : 'انقر للتفعيل'}
                  </span>
                </div>
              </div>
            </div>

            {/* معاينة حية سريعة لما يراه المستخدمون */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">معاينة حية للشريط الإعلاني العلوي كما يظهر للزوار:</span>
              <div className="w-full bg-[#046A38] text-white text-xs py-2 px-4 rounded-xl text-center border border-[#C5A059]/40 flex items-center justify-center gap-2">
                <span className="font-sans font-bold text-[#F9F6F0] flex items-center gap-2 flex-wrap justify-center text-xs">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#C5A059] animate-pulse"></span>
                  <span>مقرأة رحاب القرآن الإلكترونية</span>
                  {settings.showGlobalAssemblyMembership && (
                    <>
                      <span className="text-[#C5A059]">•</span>
                      <span className="text-[#F9F6F0] bg-emerald-900/80 px-2.5 py-0.5 rounded-full border border-[#C5A059]/50 text-xs">عضو التجمع العالمي للقرآن الكريم</span>
                    </>
                  )}
                  <span className="text-[#C5A059]">•</span>
                  <span>تعليم وإقراء بالسند المتصل إلى رسول الله ﷺ</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Tab 4: تعديل قالب الشهادة */}
      {activeTab === 'certs' && (
        <div className="space-y-6">
          <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-white to-amber-50 rounded-3xl border-2 border-[#C5A059] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#C5A059]" />
                <h3 className="font-bold text-base font-serif text-[#046A38]">
                  محرر ومصمم الشهادات التفاعلي المتقدم (Fabric.js & Canvas Studio)
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                انتقل الآن إلى المحرر الكامل: اسحب النصوص بحرية، أضف الأختام والتوقيعات بالرسم الحي، وأدرج QR Code والباركود مع التصدير المباشر لـ PDF.
              </p>
            </div>
            <a
              href="/admin/certificate-editor"
              className="px-5 py-2.5 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 border border-[#C5A059] shrink-0 transition-all"
            >
              <Award className="w-4 h-4 text-[#C5A059]" />
              <span>فتح محرر الشهادات الكامل ←</span>
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold font-serif text-[#046A38] text-sm pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>معاينة حية لقالب الشهادة A4</span>
              <span className="text-[11px] font-mono text-[#C5A059] font-bold">تنسيق أفقي فاخر</span>
            </h3>
            
            <div className="relative w-full rounded-2xl bg-[#F9F6F0] border-4 border-[#C5A059] p-5 text-center text-[#2C3531] overflow-hidden shadow-md space-y-3">
              {settings.customCertificateBgUrl && (
                <img
                  src={settings.customCertificateBgUrl}
                  alt="خلفية الشهادة"
                  className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none"
                />
              )}
              <div className="absolute inset-2 border-2 border-[#046A38] rounded-xl pointer-events-none opacity-80"></div>
              
              <div className="relative z-10 flex items-center justify-between border-b border-[#C5A059]/40 pb-2 px-2">
                <div className="flex items-center gap-2">
                  <OfficialLogo size="sm" showText={false} />
                  <span className="font-amiri font-bold text-xs text-[#046A38]">
                    {settings.titleText || 'مقرأة رحاب القرآن الإلكترونية'}
                  </span>
                </div>
                <span className="px-3 py-1 rounded-xl bg-[#046A38] text-white font-amiri font-bold text-xs border border-[#C5A059]">
                  {settings.certHeaderBadge || 'شهادة إنجاز'}
                </span>
              </div>

              <div className="relative z-10 space-y-2 py-2">
                <p className="text-[10px] font-bold text-[#046A38]">
                  {settings.certIntroText || '❖ تَشْهَدُ مَقْرَأَةُ رِحَابِ القُرْآنِ الإِلِكْتُرُونِيَّةِ بِأَنَّ: ❖'}
                </p>
                <div className="px-4 py-1.5 rounded-xl bg-white/80 border border-dashed border-[#C5A059] inline-block font-amiri font-bold text-sm text-[#046A38]">
                  الطالب / عبد الرحمن محمد باعبيد
                </div>
                <p className="text-[10px] text-slate-600">
                  {settings.certCompletionPhrase || 'قَدْ أَتَمَّ بِمَنِّ اللَّهِ تَعَالَى وَتَوْفِيقِهِ مُتَطَلَّبَاتِ إِتْقَانِ وَتَثْبِيتِ:'}
                </p>
                <div className="p-1.5 rounded-xl bg-[#046A38]/5 border border-[#046A38]/20 font-serif text-xs font-bold text-[#046A38]">
                  « حفظ وتثبيت جزء عمّ كاملاً »
                </div>
              </div>

              <div className="relative z-10 pt-2 border-t border-[#C5A059]/40 grid grid-cols-3 items-center text-[10px]">
                <div className="text-right">
                  <span className="font-bold text-[#046A38] block">{settings.certAdminSignerTitle || 'إدارة المقرأة:'}</span>
                  <span className="font-bold text-slate-800 font-amiri">{settings.certAdminSignerName || 'د. علي عزيزي'}</span>
                </div>
                <div className="flex justify-center">
                  <OfficialStamp size="sm" />
                </div>
                <div className="text-left">
                  <span className="font-bold text-[#046A38] block">{settings.certTeacherSignerTitle || 'معلم/ة الحلقة:'}</span>
                  <span className="font-bold text-slate-800 font-amiri">الشيخ المقرئ</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <span className="text-slate-500 font-bold block">مسار قالب الشهادة الحالي:</span>
              <code className="block font-mono text-[11px] text-slate-800 bg-white p-2 rounded-xl border border-slate-200 truncate" dir="ltr">
                {settings.customCertificateBgUrl || 'النموذج الذهبي الإسلامي المعتمد'}
              </code>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold font-serif text-[#046A38] text-base">
                  رفع صورة PNG لقالب أو خلفية الشهادة
                </h3>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  300DPI عالية الدقة
                </span>
              </div>

              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-[#C5A059] bg-[#F9F6F0]/60 p-8 rounded-3xl text-center cursor-pointer transition-all space-y-3"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-12 h-12 rounded-2xl bg-[#046A38]/10 text-[#046A38] flex items-center justify-center mx-auto">
                  <Award className="w-6 h-6" />
                </div>
                <p className="font-bold text-sm text-slate-800">
                  {selectedFile ? `تم اختيار: ${selectedFile.name}` : 'اسحب صورة قالب الشهادة (PNG) هنا أو انقر للاختيار'}
                </p>
                <p className="text-xs text-slate-500">
                  يمكنك رفع إطار مزخرف مخصص يظهر خلف بيانات الشهادة المعتمدة
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={!selectedFile || isUploading}
                  onClick={() => handleUploadAndSave('certificate-bg')}
                  className="px-6 py-2.5 rounded-xl bg-[#046A38] hover:bg-[#03542c] text-white font-bold text-xs font-serif flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50 transition-all border border-[#C5A059]"
                >
                  {isUploading ? <RefreshCw className="w-4 h-4 animate-spin text-[#C5A059]" /> : <Save className="w-4 h-4 text-[#C5A059]" />}
                  <span>تخزين القالب في Firebase Storage وتعميم الشهادة</span>
                </button>
              </div>
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h4 className="font-bold font-serif text-[#046A38] text-sm pb-2 border-b border-slate-100">
                بيانات التوقيع والاعتماد للشهادة
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">اسم المشرف العام (التوقيع الأيمن):</label>
                  <input
                    type="text"
                    value={settings.certAdminSignerName || 'د. علي عزيزي'}
                    onChange={(e) => {
                      const updated = saveBrandLogoSettings({ certAdminSignerName: e.target.value });
                      setSettings(updated);
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#046A38] outline-hidden font-amiri font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">صفة التوقيع الإداري:</label>
                  <input
                    type="text"
                    value={settings.certAdminSignerTitle || 'المشرف العام على المقرأة'}
                    onChange={(e) => {
                      const updated = saveBrandLogoSettings({ certAdminSignerTitle: e.target.value });
                      setSettings(updated);
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#046A38] outline-hidden font-serif"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700">شفافية العلامة المائية للشعار بالشهادة:</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0.02"
                      max="0.25"
                      step="0.01"
                      value={settings.certWatermarkOpacity ?? 0.06}
                      onChange={(e) => {
                        const updated = saveBrandLogoSettings({ certWatermarkOpacity: parseFloat(e.target.value) });
                        setSettings(updated);
                      }}
                      className="w-full accent-[#046A38] cursor-pointer"
                    />
                    <span className="font-mono font-bold text-[#046A38] w-12 text-left">
                      {Math.round((settings.certWatermarkOpacity ?? 0.06) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Tab 4: إعدادات وثائق PDF وملخصات التجويد */}
      {activeTab === 'pdf_settings' && (
        <TajweedPdfSettingsManager />
      )}

      {/* 7. Tab 5: معاينة مباشرة للتغييرات */}
      {activeTab === 'preview' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="font-bold font-serif text-[#046A38] text-base">
                المعاينة الشاملة المباشرة لكافة عناصر الهوية البصرية 2026
              </h3>
              <p className="text-xs text-slate-500 font-sans">
                اختبار تفاعلي حي يوضح كيفية ظهور الشعار، الختم، والشهادات فوق الخلفيات المعتمدة
              </p>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl text-xs">
              <span className="text-slate-600 font-bold ml-1">اختبار الخلفية:</span>
              <button
                type="button"
                onClick={() => setPreviewBg('ivory')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  previewBg === 'ivory' ? 'bg-[#F9F6F0] text-[#046A38] shadow-xs border border-[#C5A059]' : 'text-slate-600'
                }`}
              >
                عاجي دافئ #F9F6F0 (الرسمية)
              </button>
              <button
                type="button"
                onClick={() => setPreviewBg('white')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  previewBg === 'white' ? 'bg-white text-slate-900 shadow-xs border border-slate-300' : 'text-slate-600'
                }`}
              >
                أبيض #FFFFFF
              </button>
              <button
                type="button"
                onClick={() => setPreviewBg('dark')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  previewBg === 'dark' ? 'bg-[#2C3531] text-[#f7e8c6] shadow-xs border border-slate-600' : 'text-slate-600'
                }`}
              >
                رمادي داكن #2C3531
              </button>
            </div>
          </div>

          {/* Side-by-side components preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Official Logo Preview */}
            <div className={`p-6 rounded-3xl border-2 border-[#C5A059]/40 flex flex-col items-center justify-center text-center space-y-4 transition-colors ${
              previewBg === 'ivory' ? 'bg-[#F9F6F0]' : previewBg === 'white' ? 'bg-white' : 'bg-[#2C3531] text-white'
            }`}>
              <span className="text-xs font-bold text-[#046A38] font-serif bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                الشعار الرسمي المعتمد
              </span>
              <OfficialLogo size="xl" showText={true} />
              <p className="text-xs opacity-75">
                نسبة 100% متوازنة بدون تشويه أو ميلان
              </p>
            </div>

            {/* 2. Official Seal Preview */}
            <div className={`p-6 rounded-3xl border-2 border-[#C5A059]/40 flex flex-col items-center justify-center text-center space-y-4 transition-colors ${
              previewBg === 'ivory' ? 'bg-[#F9F6F0]' : previewBg === 'white' ? 'bg-white' : 'bg-[#2C3531] text-white'
            }`}>
              <span className="text-xs font-bold text-[#046A38] font-serif bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                الختم الإلكتروني المعتمد
              </span>
              <OfficialStamp size="lg" showText={true} />
              <p className="text-xs opacity-75">
                حبر زمردي واقعي وميلان -3° معتمد
              </p>
            </div>

            {/* 3. Color Palette Swatches */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <span className="text-xs font-bold text-[#046A38] font-serif block pb-2 border-b border-slate-100">
                لوحة الألوان الرسمية المعتمدة 2026:
              </span>
              <div className="space-y-2 text-xs font-sans">
                <div className="p-2.5 rounded-xl bg-[#046A38] text-white flex items-center justify-between font-bold">
                  <span>الأخضر الزمردي</span>
                  <code className="font-mono text-emerald-200">#046A38</code>
                </div>
                <div className="p-2.5 rounded-xl bg-[#C5A059] text-[#2C3531] flex items-center justify-between font-bold">
                  <span>الذهبي الملكي</span>
                  <code className="font-mono">#C5A059</code>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F9F6F0] text-[#2C3531] border border-slate-200 flex items-center justify-between font-bold">
                  <span>العاجي الدافئ</span>
                  <code className="font-mono">#F9F6F0</code>
                </div>
                <div className="p-2.5 rounded-xl bg-[#2C3531] text-slate-100 flex items-center justify-between font-bold">
                  <span>الرمادي الداكن</span>
                  <code className="font-mono text-slate-300">#2C3531</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Tab 5: سجل المسارات وروابط التخزين النشطة */}
      {activeTab === 'audit' && (
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#046A38]" />
              <h3 className="font-bold font-serif text-[#046A38] text-base">
                سجل مسارات أصول الهوية الرقمية المعتمدة في النظام
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              حاوية التخزين: flawless-cacao-n4r4b.firebasestorage.app
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="bg-[#F9F6F0] text-slate-700 border-b border-slate-200">
                  <th className="p-3.5 font-bold">اسم الأصل</th>
                  <th className="p-3.5 font-bold">المسار المحلي الثابت</th>
                  <th className="p-3.5 font-bold">المسار السحابي / الرابط النشط</th>
                  <th className="p-3.5 font-bold text-center">الحالة</th>
                  <th className="p-3.5 font-bold text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 font-bold text-[#046A38] flex items-center gap-2">
                    <img src={settings.customLogoUrl || '/brand/official-logo.png'} alt="" className="w-6 h-6 object-contain" />
                    <span>الشعار الرسمي الكامل</span>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-slate-600" dir="ltr">
                    /brand/official-logo.png
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-slate-800 max-w-xs truncate" dir="ltr">
                    {settings.customLogoUrl || '/brand/official-logo.png'}
                  </td>
                  <td className="p-3.5 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      معتمد ونشط
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => copyText(settings.customLogoUrl || '/brand/official-logo.png', 't-logo')}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                      title="نسخ الرابط"
                    >
                      {copiedKey === 't-logo' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 font-bold text-[#046A38] flex items-center gap-2">
                    <img src={settings.customSmallLogoUrl || '/brand/official-logo-small.png'} alt="" className="w-6 h-6 object-contain" />
                    <span>الأيقونة المصغرة للشعار</span>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-slate-600" dir="ltr">
                    /brand/official-logo-small.png
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-slate-800 max-w-xs truncate" dir="ltr">
                    {settings.customSmallLogoUrl || '/brand/official-logo-small.png'}
                  </td>
                  <td className="p-3.5 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      معتمد ونشط
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => copyText(settings.customSmallLogoUrl || '/brand/official-logo-small.png', 't-small')}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                      title="نسخ الرابط"
                    >
                      {copiedKey === 't-small' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 font-bold text-[#046A38] flex items-center gap-2">
                    <img src={settings.customSealUrl || '/brand/official-seal.png'} alt="" className="w-6 h-6 object-contain" />
                    <span>الختم الإلكتروني المعتمد</span>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-slate-600" dir="ltr">
                    /brand/official-seal.png
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-slate-800 max-w-xs truncate" dir="ltr">
                    {settings.customSealUrl || '/brand/official-seal.png'}
                  </td>
                  <td className="p-3.5 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      معتمد ونشط
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => copyText(settings.customSealUrl || '/brand/official-seal.png', 't-seal')}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                      title="نسخ الرابط"
                    >
                      {copiedKey === 't-seal' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 font-bold text-[#046A38] flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#C5A059]" />
                    <span>قالب وخلفية الشهادات الرسمية</span>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-slate-600" dir="ltr">
                    /brand/official-certificate-template.png
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-slate-800 max-w-xs truncate" dir="ltr">
                    {settings.customCertificateBgUrl || 'النموذج الذهبي الأصلي'}
                  </td>
                  <td className="p-3.5 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      معتمد ونشط
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => copyText(settings.customCertificateBgUrl || '/brand/official-certificate-template.png', 't-cert')}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                      title="نسخ الرابط"
                    >
                      {copiedKey === 't-cert' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
