import React, { useState, useEffect } from 'react';
import {
  FileText, ShieldCheck, CheckCircle2, AlertCircle, Save,
  RefreshCw, RotateCcw, Eye, Phone, MessageSquare, Globe,
  Mail, Image as ImageIcon, Sparkles, Printer, ExternalLink
} from 'lucide-react';
import {
  TajweedPdfSettings,
  getTajweedPdfSettings,
  saveTajweedPdfSettings,
  DEFAULT_TAJWEED_PDF_SETTINGS,
  subscribeTajweedPdfSettings
} from '../../services/pdfSettingsService';
import { TAJWEED_CURRICULUM } from '../../data/tajweedLessonsData';
import { TajweedPdfPreviewModal } from '../student/TajweedPdfPreviewModal';

interface TajweedPdfSettingsManagerProps {
  userRole?: string;
  userEmail?: string;
  onBack?: () => void;
}

export const TajweedPdfSettingsManager: React.FC<TajweedPdfSettingsManagerProps> = ({
  userRole = 'academic_supervisor',
  userEmail = 'aliazize101@gmail.com',
  onBack,
}) => {
  const [settings, setSettings] = useState<TajweedPdfSettings>(getTajweedPdfSettings());
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  
  // Test modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewLessonIndex, setPreviewLessonIndex] = useState(0);

  // Available sample lessons for multi-page test
  const sampleLessons = [
    { lesson: TAJWEED_CURRICULUM[0]?.lessons[0], chapter: TAJWEED_CURRICULUM[0] },
    { lesson: TAJWEED_CURRICULUM[0]?.lessons[1], chapter: TAJWEED_CURRICULUM[0] },
    { lesson: TAJWEED_CURRICULUM[1]?.lessons[0], chapter: TAJWEED_CURRICULUM[1] },
  ].filter(item => item.lesson);

  const activeTest = sampleLessons[previewLessonIndex] || sampleLessons[0];

  useEffect(() => {
    const unsub = subscribeTajweedPdfSettings((updated) => {
      setSettings(updated);
    });
    return () => unsub();
  }, []);

  const handleChange = (field: keyof TajweedPdfSettings, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      await saveTajweedPdfSettings(settings, userRole, userEmail);
      setFeedback({
        type: 'success',
        message: 'تم حفظ إعدادات وثائق PDF في Firebase بنجاح! تم تعميم البيانات لجميع دروس التجويد بالمقرأة.',
      });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'حدث خطأ أثناء حفظ الإعدادات في Firebase.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('هل أنت متأكد من استعادة الإعدادات الافتراضية الرسمية للهوية البصرية 2026؟')) {
      setSettings(DEFAULT_TAJWEED_PDF_SETTINGS);
      setFeedback({
        type: 'info',
        message: 'تم استرجاع الإعدادات الافتراضية. اضغط على "حفظ الإعدادات" لاعتمادها في Firebase.',
      });
    }
  };

  const isSupervisor = 
    userRole === 'academic_supervisor' || 
    userRole === 'system_admin' || 
    userRole === 'admin' ||
    userEmail.toLowerCase() === 'aliazize101@gmail.com';

  return (
    <div className="space-y-6 animate-fade-in text-slate-100 pb-12">
      
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#03301a] via-[#046A38] to-[#022413] border-2 border-[#C5A059] shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#C5A059] text-[#111f18] flex items-center justify-center font-bold shadow-xl shrink-0">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-3 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30">
                لوحة المشرف الأكاديمي
              </span>
              <span className="text-[11px] text-emerald-200">هوية 2026 الرسمية</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white font-amiri mt-1">
              إعدادات وثائق وملخصات دروس التجويد (PDF)
            </h1>
            <p className="text-xs text-slate-200 mt-0.5">
              تخصيص بيانات الترويسة، الشعار الرسمي، الختم المعتمد، العلامة المائية، بيانات التواصل، وحقوق النشر المحفوظة في Firebase.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>معاينة واختبار PDF متعدد الصفحات</span>
          </button>
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm transition cursor-pointer"
            >
              رجوع
            </button>
          )}
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-bold shadow-lg animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-950 border border-emerald-500 text-emerald-200'
              : feedback.type === 'error'
              ? 'bg-rose-950 border border-rose-500 text-rose-200'
              : 'bg-amber-950 border border-amber-500 text-amber-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Settings Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Card 1: ترويسة الوثيقة والشعار المعتمد */}
        <div className="p-6 rounded-3xl bg-[#0e1d15] border border-emerald-800/80 shadow-xl space-y-5">
          <div className="flex items-center gap-3 border-b border-emerald-800 pb-3">
            <Sparkles className="w-5 h-5 text-[#C5A059]" />
            <h2 className="font-bold text-base text-white">ترويسة الوثيقة وهوية المقرأة</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-emerald-300 mb-1.5">
                عبارة البسملة في أعلى كل صفحة:
              </label>
              <input
                type="text"
                value={settings.headerBismillah}
                onChange={(e) => handleChange('headerBismillah', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#09150e] border border-emerald-800 text-white text-sm focus:border-[#C5A059] focus:outline-none"
                placeholder="بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-300 mb-1.5">
                اسم المقرأة المعتمد في الترويسة:
              </label>
              <input
                type="text"
                value={settings.academyName}
                onChange={(e) => handleChange('academyName', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#09150e] border border-emerald-800 text-white text-sm focus:border-[#C5A059] focus:outline-none font-bold"
                placeholder="مقرأة رحاب القرآن الإلكترونية"
              />
            </div>

            {/* Official Logo Display */}
            <div>
              <label className="block text-xs font-bold text-emerald-300 mb-1.5">
                شعار المقرأة الرسمي في الترويسة والعلامة المائية:
              </label>
              <div className="flex items-center gap-4 p-3 rounded-xl bg-[#09150e] border border-emerald-800">
                <img
                  src={settings.logoUrl}
                  alt="شعار المقرأة"
                  className="w-14 h-14 object-contain rounded-lg bg-white/5 p-1 border border-emerald-700"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">الشعار الرسمي المعتمد (2026)</span>
                    <span className="text-[10px] bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-full font-bold">
                      أصلي دائم
                    </span>
                  </div>
                  <input
                    type="text"
                    value={settings.logoUrl}
                    onChange={(e) => handleChange('logoUrl', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#040d08] border border-emerald-900 text-slate-300 text-xs font-mono"
                    readOnly
                  />
                  <p className="text-[10.5px] text-slate-400">
                    ملتزم بضوابط الهوية البصرية الصارمة دون تغيير أو تشويه في الأبعاد.
                  </p>
                </div>
              </div>
            </div>

            {/* Watermark Controls */}
            <div className="p-4 rounded-2xl bg-[#07120b] border border-emerald-900 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">
                  العلامة المائية الشفافة في منتصف الصفحة:
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.watermarkEnabled}
                    onChange={(e) => handleChange('watermarkEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#046A38]"></div>
                </label>
              </div>

              {settings.watermarkEnabled && (
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>نسبة الشفافية للعلامة المائية:</span>
                    <span className="font-mono text-[#C5A059] font-bold">
                      {Math.round((settings.watermarkOpacity || 0.05) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.15"
                    step="0.01"
                    value={settings.watermarkOpacity || 0.05}
                    onChange={(e) => handleChange('watermarkOpacity', parseFloat(e.target.value))}
                    className="w-full accent-[#C5A059] cursor-pointer"
                  />
                  <span className="text-[10.5px] text-slate-400 block mt-1">
                    (تظهر العلامة المائية بخفة وهدوء خلف النص لضمان قراءة مريحة بنسبة 100%).
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: ختم المقرأة والتوقيع الإداري */}
        <div className="p-6 rounded-3xl bg-[#0e1d15] border border-emerald-800/80 shadow-xl space-y-5">
          <div className="flex items-center gap-3 border-b border-emerald-800 pb-3">
            <ShieldCheck className="w-5 h-5 text-[#C5A059]" />
            <h2 className="font-bold text-base text-white">ختم المقرأة والتوقيع المعتمد</h2>
          </div>

          <div className="space-y-4">
            {/* Official Seal Display */}
            <div>
              <label className="block text-xs font-bold text-emerald-300 mb-1.5">
                الختم الإلكتروني المعتمد في أسفل الوثيقة جهة اليمين:
              </label>
              <div className="flex items-center gap-4 p-3 rounded-xl bg-[#09150e] border border-emerald-800">
                <img
                  src={settings.sealUrl}
                  alt="ختم المقرأة"
                  className="w-16 h-16 object-contain rounded-full bg-white/5 p-1 border border-emerald-700"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">الختم الرسمي الشفاف (أخضر زمردي)</span>
                    <span className="text-[10px] bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-full font-bold">
                      معتمد
                    </span>
                  </div>
                  <input
                    type="text"
                    value={settings.sealUrl}
                    onChange={(e) => handleChange('sealUrl', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#040d08] border border-emerald-900 text-slate-300 text-xs font-mono"
                    readOnly
                  />
                  <p className="text-[10.5px] text-slate-400">
                    ملمس حبر واقعي أخضر زمردي (#046A38) على خلفية شفافة نقية.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-300 mb-1.5">
                عنوان الختم:
              </label>
              <input
                type="text"
                value={settings.sealTitle || 'ختم مقرأة رحاب القرآن الإلكترونية'}
                onChange={(e) => handleChange('sealTitle', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#09150e] border border-emerald-800 text-white text-sm focus:border-[#C5A059] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-emerald-300 mb-1.5">
                  اسم الإدارة الموقعة:
                </label>
                <input
                  type="text"
                  value={settings.adminSignerName || 'د. علي عزيزي'}
                  onChange={(e) => handleChange('adminSignerName', e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-[#09150e] border border-emerald-800 text-white text-xs focus:border-[#C5A059] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-emerald-300 mb-1.5">
                  صفة المشرف العام:
                </label>
                <input
                  type="text"
                  value={settings.adminSignerTitle || 'المشرف العام على المقرأة'}
                  onChange={(e) => handleChange('adminSignerTitle', e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-[#09150e] border border-emerald-800 text-white text-xs focus:border-[#C5A059] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-300 mb-1.5">
                نص حقوق النشر في التذييل:
              </label>
              <input
                type="text"
                value={settings.copyrightText}
                onChange={(e) => handleChange('copyrightText', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#09150e] border border-emerald-800 text-white text-sm focus:border-[#C5A059] focus:outline-none"
                placeholder="© مقرأة رحاب القرآن الإلكترونية – جميع الحقوق محفوظة"
              />
            </div>
          </div>
        </div>

        {/* Card 3: أرقام وحسابات التواصل المعتمدة */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-[#0e1d15] border border-emerald-800/80 shadow-xl space-y-5">
          <div className="flex items-center gap-3 border-b border-emerald-800 pb-3">
            <Phone className="w-5 h-5 text-[#C5A059]" />
            <h2 className="font-bold text-base text-white">بيانات التواصل وحسابات المقرأة الرسمية في تذييل الـ PDF</h2>
            <span className="text-xs text-amber-300 mr-auto font-medium">
              * تُعرض في أسفل كل صفحة مطبوعة
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-emerald-300 mb-1.5">
                📞 هاتف المقرأة الرسمي:
              </label>
              <input
                type="text"
                value={settings.contactPhone}
                onChange={(e) => handleChange('contactPhone', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#09150e] border border-emerald-800 text-white text-xs font-mono focus:border-[#C5A059] focus:outline-none"
                placeholder="0967714371599"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-300 mb-1.5">
                💬 رابط واتساب للتواصل:
              </label>
              <input
                type="text"
                value={settings.whatsappUrl}
                onChange={(e) => handleChange('whatsappUrl', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#09150e] border border-emerald-800 text-white text-xs font-mono focus:border-[#C5A059] focus:outline-none"
                placeholder="https://wa.me/967714371599"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-300 mb-1.5">
                ✉️ البريد الإلكتروني للمقرأة:
              </label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => handleChange('contactEmail', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#09150e] border border-emerald-800 text-white text-xs font-mono focus:border-[#C5A059] focus:outline-none"
                placeholder="rehabquran383@gmail.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-300 mb-1.5">
                🌐 رابط صفحة فيسبوك:
              </label>
              <input
                type="text"
                value={settings.facebookUrl}
                onChange={(e) => handleChange('facebookUrl', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#09150e] border border-emerald-800 text-white text-xs font-mono focus:border-[#C5A059] focus:outline-none"
                placeholder="https://www.facebook.com/..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-300 mb-1.5">
                📸 رابط حساب انستغرام:
              </label>
              <input
                type="text"
                value={settings.instagramUrl}
                onChange={(e) => handleChange('instagramUrl', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#09150e] border border-emerald-800 text-white text-xs font-mono focus:border-[#C5A059] focus:outline-none"
                placeholder="https://www.instagram.com/..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-300 mb-1.5">
                📢 رابط قناة واتساب الرسمية:
              </label>
              <input
                type="text"
                value={settings.whatsappChannelUrl}
                onChange={(e) => handleChange('whatsappChannelUrl', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#09150e] border border-emerald-800 text-white text-xs font-mono focus:border-[#C5A059] focus:outline-none"
                placeholder="https://whatsapp.com/channel/..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-300 mb-1.5">
                ✈️ رابط قناة التيلجرام الرسمية:
              </label>
              <input
                type="text"
                value={settings.telegramUrl || 'https://t.me/rehabpa'}
                onChange={(e) => handleChange('telegramUrl', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#09150e] border border-emerald-800 text-white text-xs font-mono focus:border-[#C5A059] focus:outline-none"
                placeholder="https://t.me/rehabpa"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Action Buttons Bar */}
      <div className="p-5 rounded-2xl bg-[#0a1610] border border-emerald-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving || !isSupervisor}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-[#046A38] to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-sm flex items-center gap-2 shadow-xl shadow-emerald-950 transition disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? 'جاري الحفظ في Firebase...' : 'حفظ الإعدادات في Firebase'}</span>
          </button>

          <button
            onClick={handleReset}
            disabled={isSaving || !isSupervisor}
            className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>استعادة الافتراضيات</span>
          </button>
        </div>

        {/* Multi-page test lesson selector */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-300">اختبار على درس:</span>
          <select
            value={previewLessonIndex}
            onChange={(e) => setPreviewLessonIndex(parseInt(e.target.value, 10))}
            className="px-3 py-2 rounded-xl bg-[#06120b] border border-emerald-800 text-xs text-white focus:outline-none"
          >
            {sampleLessons.map((item, idx) => (
              <option key={item.lesson.id} value={idx}>
                الدرس {item.lesson.order}: {item.lesson.title}
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsPreviewOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#d6b26d] text-slate-950 font-black text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>معاينة وطباعة A4</span>
          </button>
        </div>
      </div>

      {/* Interactive Modal for Multi-Page PDF Verification */}
      {activeTest && (
        <TajweedPdfPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          lesson={activeTest.lesson}
          chapter={activeTest.chapter}
          customSettings={settings}
        />
      )}

    </div>
  );
};
