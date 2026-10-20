import React, { useState, useEffect } from 'react';
import {
  Palette,
  Share2,
  Mail,
  LayoutGrid,
  BookOpen,
  GraduationCap,
  Save,
  RotateCcw,
  Eye,
  Plus,
  Trash2,
  CheckCircle2,
  Sliders,
  ExternalLink,
  Smartphone,
  Tablet,
  Monitor,
  Sparkles,
  Phone,
  Clock,
  AlertCircle,
  HelpCircle,
  Volume2,
  Check,
  Award,
  Layers,
  ChevronLeft
} from 'lucide-react';
import {
  DesignAndCommunicationSettings,
  DEFAULT_DESIGN_AND_COMMUNICATION_SETTINGS,
  SocialLinkItem,
  CardGridDensity,
  CardVisualTheme,
  LessonViewMode,
  MutunCardStyle,
  ExamBadgeDisplay,
} from '../../types/designAndCommunication';
import {
  getDesignAndCommunicationSettings,
  saveDesignAndCommunicationSettings,
  syncDesignSettingsFromFirestore,
} from '../../services/designSettingsService';

interface AdminDesignAndCommunicationManagerProps {
  onBack?: () => void;
  adminName?: string;
}

export const AdminDesignAndCommunicationManager: React.FC<AdminDesignAndCommunicationManagerProps> = ({
  onBack,
  adminName = 'المشرف العام',
}) => {
  // الحالات الأساسية للإعدادات
  const [settings, setSettings] = useState<DesignAndCommunicationSettings>(() =>
    getDesignAndCommunicationSettings()
  );
  const [initialSettings, setInitialSettings] = useState<DesignAndCommunicationSettings>(() =>
    getDesignAndCommunicationSettings()
  );

  // التبويب النشط داخل قسم الإعدادات
  const [activeSubTab, setActiveSubTab] = useState<'dashboards' | 'curriculum' | 'social' | 'contact'>('dashboards');

  // وضع المعاينة المباشرة قبل الحفظ
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [previewTarget, setPreviewTarget] = useState<'student' | 'teacher' | 'curriculum'>('student');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // حالة الحفظ والإشعار
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // حالة إضافة رابط جديد
  const [isAddingLinkModal, setIsAddingLinkModal] = useState(false);
  const [newLinkPlatform, setNewLinkPlatform] = useState<SocialLinkItem['platform']>('whatsapp');
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkDesc, setNewLinkDesc] = useState('');

  // استرجاع الإعدادات المحدثة من السحابة عند الفتح
  useEffect(() => {
    let mounted = true;
    syncDesignSettingsFromFirestore().then((remote) => {
      if (mounted) {
        setSettings(remote);
        setInitialSettings(remote);
      }
    });

    const handleUpdate = (e: any) => {
      if (e.detail) {
        setSettings(e.detail);
      }
    };
    window.addEventListener('rehab_design_settings_updated', handleUpdate);
    return () => {
      mounted = false;
      window.removeEventListener('rehab_design_settings_updated', handleUpdate);
    };
  }, []);

  // دالة مساعدة لتحديث جزئي للكائن
  const updateSettings = (updater: (prev: DesignAndCommunicationSettings) => DesignAndCommunicationSettings) => {
    setSettings((prev) => updater(prev));
  };

  // حفظ الإعدادات وتطبيقها
  const handleSaveSettings = async () => {
    setIsSaving(true);
    setStatusMessage({ type: 'info', text: 'جاري حفظ الإعدادات وتطبيقها على جميع الواجهات وتحديث Firestore...' });

    try {
      const saved = await saveDesignAndCommunicationSettings(settings, adminName);
      setSettings(saved);
      setInitialSettings(saved);
      setIsSaving(false);
      setStatusMessage({
        type: 'success',
        text: 'تم حفظ إعدادات التصميم والتواصل وتطبيقها على واجهات الطلاب والمعلمين بنجاح!',
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      setIsSaving(false);
      setStatusMessage({
        type: 'error',
        text: 'حدث خطأ أثناء حفظ الإعدادات، يرجى المحاولة مرة أخرى.',
      });
    }
  };

  // استعادة الإعدادات الافتراضية
  const handleResetToDefaults = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في استعادة إعدادات التصميم والتواصل الافتراضية المعتمدة؟')) {
      setSettings({
        ...DEFAULT_DESIGN_AND_COMMUNICATION_SETTINGS,
        lastUpdated: Date.now(),
      });
      setStatusMessage({
        type: 'info',
        text: 'تم استرجاع الإعدادات الافتراضية، اضغط «حفظ وتطبيق» لتثبيتها في النظام.',
      });
    }
  };

  // معالجة إضافة رابط تواصل جديد
  const handleCreateSocialLink = () => {
    if (!newLinkLabel.trim() || !newLinkUrl.trim()) {
      alert('يرجى كتابة اسم الحساب ورابطه أولاً');
      return;
    }

    const newLink: SocialLinkItem = {
      id: `social-${Date.now()}`,
      platform: newLinkPlatform,
      label: newLinkLabel.trim(),
      url: newLinkUrl.trim(),
      description: newLinkDesc.trim(),
      enabled: true,
      order: settings.socialLinks.length + 1,
    };

    updateSettings((prev) => ({
      ...prev,
      socialLinks: [...prev.socialLinks, newLink],
    }));

    setNewLinkLabel('');
    setNewLinkUrl('');
    setNewLinkDesc('');
    setIsAddingLinkModal(false);
  };

  // معالجة حذف رابط تواصل
  const handleDeleteSocialLink = (id: string) => {
    if (window.confirm('هل تريد بالتأكيد حذف هذا الرابط؟')) {
      updateSettings((prev) => ({
        ...prev,
        socialLinks: prev.socialLinks.filter((l) => l.id !== id),
      }));
    }
  };

  // تبديل حالة تفعيل الرابط
  const handleToggleSocialLink = (id: string) => {
    updateSettings((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.map((l) =>
        l.id === id ? { ...l, enabled: !l.enabled } : l
      ),
    }));
  };

  // تعديل حقل في رابط تواصل
  const handleUpdateSocialLinkField = (id: string, field: keyof SocialLinkItem, value: any) => {
    updateSettings((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.map((l) =>
        l.id === id ? { ...l, [field]: value } : l
      ),
    }));
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(initialSettings);

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl">
      {/* رأس الصفحة والشريط العلوي */}
      <div className="bg-white rounded-3xl p-6 border-2 border-[#C5A059]/30 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#046A38] text-[#C5A059] flex items-center justify-center text-2xl shadow-inner font-serif">
              ⚙️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-serif">
                  إعدادات التصميم والتواصل
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-[#046A38] border border-emerald-300">
                  لوحة المشرف المعتمدة
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                التحكم بنظام شبكة بطاقات الطالب والمعلم، وطريقة عرض دروس التجويد والمتون، وإدارة روابط التواصل وبريد الاستفسارات
              </p>
            </div>
          </div>
        </div>

        {/* أزرار الإجراءات (معاينة قبل الحفظ + حفظ وتطبيق + استعادة) */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setIsPreviewModalOpen(true)}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-colors border border-slate-300"
          >
            <Eye className="w-4 h-4 text-[#046A38]" />
            <span>معاينة حية للواجهات</span>
          </button>

          <button
            type="button"
            onClick={handleResetToDefaults}
            className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-medium text-xs transition-colors border border-slate-200"
            title="استعادة الإعدادات الافتراضية"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">افتراضي</span>
          </button>

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={isSaving}
            className={`flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all shadow-md ${
              hasChanges
                ? 'bg-[#046A38] hover:bg-emerald-800 text-white shadow-emerald-900/20 animate-pulse'
                : 'bg-[#046A38] text-white hover:bg-emerald-800'
            } disabled:opacity-60`}
          >
            <Save className="w-4 h-4 text-amber-300" />
            <span>{isSaving ? 'جاري الحفظ...' : 'حفظ وتطبيق التغييرات'}</span>
          </button>
        </div>
      </div>

      {/* رسالة الحالة والتنبيهات */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm flex items-center gap-3 shadow-md animate-fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950 text-emerald-100 border border-emerald-400'
              : statusMessage.type === 'error'
              ? 'bg-rose-950 text-rose-100 border border-rose-400'
              : 'bg-slate-900 text-slate-100 border border-amber-400'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : statusMessage.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : (
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          )}
          <span className="font-bold">{statusMessage.text}</span>
        </div>
      )}

      {/* شريط التبويبات الفرعية الأربعة */}
      <div className="bg-[#F9F6F0] p-1.5 rounded-2xl border border-[#C5A059]/40 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setActiveSubTab('dashboards')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
            activeSubTab === 'dashboards'
              ? 'bg-[#046A38] text-white shadow-md'
              : 'bg-white/80 text-slate-700 hover:bg-white hover:text-slate-900'
          }`}
        >
          <LayoutGrid className="w-4 h-4 text-amber-300" />
          <span>شبكة بطاقات الطالب والمعلم</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('curriculum')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
            activeSubTab === 'curriculum'
              ? 'bg-[#046A38] text-white shadow-md'
              : 'bg-white/80 text-slate-700 hover:bg-white hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4 text-amber-300" />
          <span>عرض التجويد والمتون والاختبارات</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('social')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
            activeSubTab === 'social'
              ? 'bg-[#046A38] text-white shadow-md'
              : 'bg-white/80 text-slate-700 hover:bg-white hover:text-slate-900'
          }`}
        >
          <Share2 className="w-4 h-4 text-amber-300" />
          <span>روابط التواصل الاجتماعي ({settings.socialLinks.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('contact')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
            activeSubTab === 'contact'
              ? 'bg-[#046A38] text-white shadow-md'
              : 'bg-white/80 text-slate-700 hover:bg-white hover:text-slate-900'
          }`}
        >
          <Mail className="w-4 h-4 text-amber-300" />
          <span>بريد التواصل والاستفسارات</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. تبويب شبكة بطاقات الطالب والمعلم (متجاوبة مع الجوال والتابلت والحاسوب) */}
      {/* ========================================================================= */}
      {activeSubTab === 'dashboards' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* قسم لوحة الطالب */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#046A38] flex items-center justify-center font-bold">
                  🎓
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">تصميم لوحة الطالب (بطاقات المتابعة)</h3>
                  <p className="text-xs text-slate-500">حفظي، مراجعتي، جدولي، معلمي، دروسي</p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-[#F9F6F0] text-[#046A38] font-black border border-[#C5A059]/40">
                شبكة متجاوبة
              </span>
            </div>

            {/* عدد الأعمدة المتجاوبة */}
            <div className="space-y-3">
              <label className="block text-xs font-black text-slate-700">
                توزيع الأعمدة بحسب نوع الجهاز (Responsive Columns):
              </label>
              
              <div className="grid grid-cols-3 gap-3">
                {/* الجوال */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1.5">
                  <div className="flex items-center justify-center gap-1 text-slate-600 text-xs font-bold">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>الجوال</span>
                  </div>
                  <select
                    value={settings.studentDashboard.mobileColumns}
                    onChange={(e) =>
                      updateSettings((prev) => ({
                        ...prev,
                        studentDashboard: {
                          ...prev.studentDashboard,
                          mobileColumns: Number(e.target.value) as 1 | 2,
                        },
                      }))
                    }
                    className="w-full text-xs font-bold p-1.5 rounded-lg border border-slate-300 bg-white text-center"
                  >
                    <option value={1}>عمود 1 (بطاقات عريضة)</option>
                    <option value={2}>عمودان (بطاقات ثنائية - موصى به)</option>
                  </select>
                </div>

                {/* التابلت */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1.5">
                  <div className="flex items-center justify-center gap-1 text-slate-600 text-xs font-bold">
                    <Tablet className="w-3.5 h-3.5" />
                    <span>التابلت</span>
                  </div>
                  <select
                    value={settings.studentDashboard.tabletColumns}
                    onChange={(e) =>
                      updateSettings((prev) => ({
                        ...prev,
                        studentDashboard: {
                          ...prev.studentDashboard,
                          tabletColumns: Number(e.target.value) as 2 | 3,
                        },
                      }))
                    }
                    className="w-full text-xs font-bold p-1.5 rounded-lg border border-slate-300 bg-white text-center"
                  >
                    <option value={2}>عمودان متناسقان</option>
                    <option value={3}>3 أعمدة (الأمثل للآيباد)</option>
                  </select>
                </div>

                {/* الحاسوب */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1.5">
                  <div className="flex items-center justify-center gap-1 text-slate-600 text-xs font-bold">
                    <Monitor className="w-3.5 h-3.5" />
                    <span>الحاسوب</span>
                  </div>
                  <select
                    value={settings.studentDashboard.desktopColumns}
                    onChange={(e) =>
                      updateSettings((prev) => ({
                        ...prev,
                        studentDashboard: {
                          ...prev.studentDashboard,
                          desktopColumns: Number(e.target.value) as 3 | 4,
                        },
                      }))
                    }
                    className="w-full text-xs font-bold p-1.5 rounded-lg border border-slate-300 bg-white text-center"
                  >
                    <option value={3}>3 أعمدة متوازنة</option>
                    <option value={4}>4 أعمدة عريضة</option>
                  </select>
                </div>
              </div>
            </div>

            {/* نمط الهوية البصرية للبطاقات */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-700">نمط ومظهر البطاقات:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'heritage', label: 'تراثي ذهبي ملكي', icon: '🏛️' },
                  { id: 'emerald_classic', label: 'زمردي كلاسيكي', icon: '🌿' },
                  { id: 'modern_minimal', label: 'عصري ناصع', icon: '✨' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() =>
                      updateSettings((prev) => ({
                        ...prev,
                        studentDashboard: {
                          ...prev.studentDashboard,
                          visualTheme: t.id as CardVisualTheme,
                        },
                      }))
                    }
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      settings.studentDashboard.visualTheme === t.id
                        ? 'bg-emerald-50 border-[#046A38] text-[#046A38] font-black shadow-xs ring-1 ring-[#046A38]'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-base">{t.icon}</div>
                    <div className="text-xs mt-1">{t.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* خيارات عناصر البطاقات التفاعلية */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer">
                <span className="text-xs font-bold text-slate-800">إظهار مؤشرات وأشرطة التقدم التفاعلية داخل البطاقات</span>
                <input
                  type="checkbox"
                  checked={settings.studentDashboard.showProgressBars}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      studentDashboard: {
                        ...prev.studentDashboard,
                        showProgressBars: e.target.checked,
                      },
                    }))
                  }
                  className="w-4 h-4 text-[#046A38] rounded accent-[#046A38]"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer">
                <span className="text-xs font-bold text-slate-800">إظهار شارة الإحصاء المختصر برأس البطاقة (الجزء، نسبة الحضور...)</span>
                <input
                  type="checkbox"
                  checked={settings.studentDashboard.showQuickStats}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      studentDashboard: {
                        ...prev.studentDashboard,
                        showQuickStats: e.target.checked,
                      },
                    }))
                  }
                  className="w-4 h-4 text-[#046A38] rounded accent-[#046A38]"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer">
                <span className="text-xs font-bold text-slate-800">تمييز حواف البطاقات باللون الذهبي الملكي مع تفاعل التحويم</span>
                <input
                  type="checkbox"
                  checked={settings.studentDashboard.cardBorderHighlight}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      studentDashboard: {
                        ...prev.studentDashboard,
                        cardBorderHighlight: e.target.checked,
                      },
                    }))
                  }
                  className="w-4 h-4 text-[#046A38] rounded accent-[#046A38]"
                />
              </label>
            </div>
          </div>

          {/* قسم لوحة المعلم */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center font-bold">
                  👨‍🏫
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">تصميم لوحة المعلم (إدارة الحلقات والطلاب)</h3>
                  <p className="text-xs text-slate-500">بطاقات الطلاب، الحضور اليومي، رصد التسميع</p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-[#F9F6F0] text-[#046A38] font-black border border-[#C5A059]/40">
                شبكة متجاوبة
              </span>
            </div>

            {/* عدد أعمدة المعلم */}
            <div className="space-y-3">
              <label className="block text-xs font-black text-slate-700">
                توزيع الأعمدة في قائمة الطلاب والحلقات للمعلم:
              </label>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1.5">
                  <div className="flex items-center justify-center gap-1 text-slate-600 text-xs font-bold">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>الجوال</span>
                  </div>
                  <select
                    value={settings.teacherDashboard.mobileColumns}
                    onChange={(e) =>
                      updateSettings((prev) => ({
                        ...prev,
                        teacherDashboard: {
                          ...prev.teacherDashboard,
                          mobileColumns: Number(e.target.value) as 1 | 2,
                        },
                      }))
                    }
                    className="w-full text-xs font-bold p-1.5 rounded-lg border border-slate-300 bg-white text-center"
                  >
                    <option value={1}>عمود 1</option>
                    <option value={2}>عمودان</option>
                  </select>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1.5">
                  <div className="flex items-center justify-center gap-1 text-slate-600 text-xs font-bold">
                    <Tablet className="w-3.5 h-3.5" />
                    <span>التابلت</span>
                  </div>
                  <select
                    value={settings.teacherDashboard.tabletColumns}
                    onChange={(e) =>
                      updateSettings((prev) => ({
                        ...prev,
                        teacherDashboard: {
                          ...prev.teacherDashboard,
                          tabletColumns: Number(e.target.value) as 2 | 3,
                        },
                      }))
                    }
                    className="w-full text-xs font-bold p-1.5 rounded-lg border border-slate-300 bg-white text-center"
                  >
                    <option value={2}>عمودان</option>
                    <option value={3}>3 أعمدة</option>
                  </select>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1.5">
                  <div className="flex items-center justify-center gap-1 text-slate-600 text-xs font-bold">
                    <Monitor className="w-3.5 h-3.5" />
                    <span>الحاسوب</span>
                  </div>
                  <select
                    value={settings.teacherDashboard.desktopColumns}
                    onChange={(e) =>
                      updateSettings((prev) => ({
                        ...prev,
                        teacherDashboard: {
                          ...prev.teacherDashboard,
                          desktopColumns: Number(e.target.value) as 3 | 4,
                        },
                      }))
                    }
                    className="w-full text-xs font-bold p-1.5 rounded-lg border border-slate-300 bg-white text-center"
                  >
                    <option value={3}>3 أعمدة</option>
                    <option value={4}>4 أعمدة (عرض مكثف)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* خصائص بطاقات المعلم */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer">
                <span className="text-xs font-bold text-slate-800">إظهار عداد الحضور والغياب اليومي في بطاقة الطالب للمعلم</span>
                <input
                  type="checkbox"
                  checked={settings.teacherDashboard.showDailyAttendanceCounter}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      teacherDashboard: {
                        ...prev.teacherDashboard,
                        showDailyAttendanceCounter: e.target.checked,
                      },
                    }))
                  }
                  className="w-4 h-4 text-[#046A38] rounded accent-[#046A38]"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer">
                <span className="text-xs font-bold text-slate-800">إظهار أزرار التسميع والتقييم السريع مباشرة داخل بطاقة الطالب</span>
                <input
                  type="checkbox"
                  checked={settings.teacherDashboard.showQuickRecitationButtons}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      teacherDashboard: {
                        ...prev.teacherDashboard,
                        showQuickRecitationButtons: e.target.checked,
                      },
                    }))
                  }
                  className="w-4 h-4 text-[#046A38] rounded accent-[#046A38]"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. تبويب عرض دروس التجويد والمتون وشروحها واختباراتها الأسبوعية */}
      {/* ========================================================================= */}
      {activeSubTab === 'curriculum' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* دروس التجويد والمستويات */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#C5A059] flex items-center justify-center font-bold">
                  📜
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">طريقة عرض دروس التجويد</h3>
                  <p className="text-xs text-slate-500">القواعد والمخارج والصفات وأحكام النون والمدود</p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
                منهج التجويد
              </span>
            </div>

            {/* أسلوب العرض */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-700">أسلوب عرض فهرس الدروس:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'grid', label: 'شبكة بطاقات مرئية', desc: 'بطاقات أنيقة مع شارات الإنجاز' },
                  { id: 'grouped_by_level', label: 'مجمّع حسب المستوى', desc: 'تبويبات منفصلة لكل مستوى تجويدي' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() =>
                      updateSettings((prev) => ({
                        ...prev,
                        curriculumDisplay: {
                          ...prev.curriculumDisplay,
                          tajweedViewMode: mode.id as LessonViewMode,
                        },
                      }))
                    }
                    className={`p-3 rounded-2xl border text-right transition-all ${
                      settings.curriculumDisplay.tajweedViewMode === mode.id
                        ? 'bg-emerald-50 border-[#046A38] text-[#046A38] font-black ring-1 ring-[#046A38]'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-black">{mode.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{mode.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* عدد البطاقات بالصف في شاشات الحاسوب */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-700">عدد بطاقات دروس التجويد بالصف (شاشة كبيرة):</label>
              <select
                value={settings.curriculumDisplay.tajweedCardsPerRow}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    curriculumDisplay: {
                      ...prev.curriculumDisplay,
                      tajweedCardsPerRow: Number(e.target.value) as 1 | 2 | 3,
                    },
                  }))
                }
                className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-white"
              >
                <option value={1}>بطاقة واحدة عريضة في كل صف</option>
                <option value={2}>بطاقتان في كل صف (المعتمد والمتوازن)</option>
                <option value={3}>3 بطاقات في كل صف (عرض مكثف)</option>
              </select>
            </div>

            {/* مشغل التلاوة الصوتي السريع */}
            <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-slate-800 block">إظهار أيقونة الاستماع للتلاوة الصوتية بالدرس</span>
                <span className="text-[11px] text-slate-500">تمكين الطالب من سماع النطق الصحيح للمثال فوراً</span>
              </div>
              <input
                type="checkbox"
                checked={settings.curriculumDisplay.showTajweedAudioPlayer}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    curriculumDisplay: {
                      ...prev.curriculumDisplay,
                      showTajweedAudioPlayer: e.target.checked,
                    },
                  }))
                }
                className="w-4 h-4 text-[#046A38] rounded accent-[#046A38]"
              />
            </label>
          </div>

          {/* المتون العلمية وشروحها واختباراتها */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#046A38] flex items-center justify-center font-bold">
                  📖
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">المتون العلمية وشروحها واختباراتها الأسبوعية</h3>
                  <p className="text-xs text-slate-500">تحفة الأطفال، الجزرية، الشروح الميسرة، الاختبارات الذاتية</p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-[#046A38] font-bold border border-emerald-200">
                المتون العلمية
              </span>
            </div>

            {/* أسلوب بطاقة المتن */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-700">أسلوب عرض بطاقات المتون:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'detailed', label: 'مفصل متكامل', desc: 'عرض الأبيات والشرح والإنجاز' },
                  { id: 'compact', label: 'مقتضب ومضغوط', desc: 'حجم أصغر يتيح رؤية عدة متون' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() =>
                      updateSettings((prev) => ({
                        ...prev,
                        curriculumDisplay: {
                          ...prev.curriculumDisplay,
                          mutunViewStyle: st.id as MutunCardStyle,
                        },
                      }))
                    }
                    className={`p-3 rounded-2xl border text-right transition-all ${
                      settings.curriculumDisplay.mutunViewStyle === st.id
                        ? 'bg-emerald-50 border-[#046A38] text-[#046A38] font-black ring-1 ring-[#046A38]'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-black">{st.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{st.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* إظهار الشروح والأبيات */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer">
                <span className="text-xs font-bold text-slate-800">إظهار مقتطف الشرح الإجمالي للأبيات بالبطاقة</span>
                <input
                  type="checkbox"
                  checked={settings.curriculumDisplay.mutunShowExplanationExcerpt}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      curriculumDisplay: {
                        ...prev.curriculumDisplay,
                        mutunShowExplanationExcerpt: e.target.checked,
                      },
                    }))
                  }
                  className="w-4 h-4 text-[#046A38] rounded accent-[#046A38]"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer">
                <span className="text-xs font-bold text-slate-800">إظهار عداد الأبيات المنجزة والنسبة المئوية</span>
                <input
                  type="checkbox"
                  checked={settings.curriculumDisplay.mutunShowVersesCount}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      curriculumDisplay: {
                        ...prev.curriculumDisplay,
                        mutunShowVersesCount: e.target.checked,
                      },
                    }))
                  }
                  className="w-4 h-4 text-[#046A38] rounded accent-[#046A38]"
                />
              </label>
            </div>

            {/* إعدادات الاختبارات الأسبوعية */}
            <div className="p-3.5 rounded-2xl bg-[#F9F6F0] border border-[#C5A059]/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 font-serif">✏️ الاختبارات الأسبوعية للمتون:</span>
                <span className="text-[11px] text-emerald-800 font-bold bg-white px-2 py-0.5 rounded-lg border border-emerald-200">
                  فتح المستويات التلقائي
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={settings.curriculumDisplay.highlightPendingExams}
                    onChange={(e) =>
                      updateSettings((prev) => ({
                        ...prev,
                        curriculumDisplay: {
                          ...prev.curriculumDisplay,
                          highlightPendingExams: e.target.checked,
                        },
                      }))
                    }
                    className="w-3.5 h-3.5 text-[#046A38] rounded accent-[#046A38]"
                  />
                  <span className="font-bold text-slate-700">تمييز الاختبار المستحق بلون ذهبي</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={settings.curriculumDisplay.showExamDirectLaunchButton}
                    onChange={(e) =>
                      updateSettings((prev) => ({
                        ...prev,
                        curriculumDisplay: {
                          ...prev.curriculumDisplay,
                          showExamDirectLaunchButton: e.target.checked,
                        },
                      }))
                    }
                    className="w-3.5 h-3.5 text-[#046A38] rounded accent-[#046A38]"
                  />
                  <span className="font-bold text-slate-700">زر مباشر لبدء الاختبار بالبطاقة</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. تبويب قنوات وروابط التواصل الاجتماعي (إضافة، تعديل، حذف، تفعيل) */}
      {/* ========================================================================= */}
      {activeSubTab === 'social' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-black text-slate-900 text-lg">إدارة قنوات وروابط التواصل الاجتماعي</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تظهر هذه الروابط في فوتر الموقع، وفي بطاقات تواصل الطلاب، وفي المستندات والمراسلات
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddingLinkModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#046A38] text-white hover:bg-emerald-800 font-bold text-xs shadow-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة قناة أو رابط جديد</span>
            </button>
          </div>

          {/* قائمة الروابط القائمة */}
          <div className="space-y-3">
            {settings.socialLinks.map((link) => (
              <div
                key={link.id}
                className={`p-4 rounded-2xl border transition-all ${
                  link.enabled
                    ? 'bg-white border-slate-200 shadow-xs hover:border-[#C5A059]'
                    : 'bg-slate-50 border-dashed border-slate-300 opacity-60'
                }`}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  {/* نوع المنصة والاسم */}
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <span className="text-2xl shrink-0">
                      {link.platform === 'whatsapp'
                        ? '🟢'
                        : link.platform === 'telegram'
                        ? '✈️'
                        : link.platform === 'facebook'
                        ? '🔵'
                        : link.platform === 'instagram'
                        ? '📸'
                        : link.platform === 'youtube'
                        ? '▶️'
                        : link.platform === 'tiktok'
                        ? '🎵'
                        : link.platform === 'x'
                        ? '✖️'
                        : '🌐'}
                    </span>
                    <div className="flex-1 md:w-64">
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => handleUpdateSocialLinkField(link.id, 'label', e.target.value)}
                        className="w-full text-xs sm:text-sm font-black text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#046A38] focus:bg-white p-1 rounded"
                        placeholder="اسم القناة أو الحساب"
                      />
                      <input
                        type="text"
                        value={link.description || ''}
                        onChange={(e) => handleUpdateSocialLinkField(link.id, 'description', e.target.value)}
                        className="w-full text-xs text-slate-500 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#046A38] focus:bg-white p-1 rounded"
                        placeholder="وصف مختصر للرابط"
                      />
                    </div>
                  </div>

                  {/* رابط الـ URL */}
                  <div className="flex-1 w-full md:w-auto">
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => handleUpdateSocialLinkField(link.id, 'url', e.target.value)}
                        className="w-full text-xs font-mono text-slate-700 bg-slate-50 border border-slate-200 focus:border-[#046A38] p-2 rounded-xl text-left"
                        dir="ltr"
                        placeholder="https://..."
                      />
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors shrink-0"
                        title="تجربة الرابط"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* أزرار التحكم (تفعيل/تعطيل + حذف) */}
                  <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => handleToggleSocialLink(link.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        link.enabled
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {link.enabled ? 'مفعّل' : 'معطّل'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteSocialLink(link.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="حذف هذا الرابط"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. تبويب بريد التواصل المعتمد واستفسارات المقرأة */}
      {/* ========================================================================= */}
      {activeSubTab === 'contact' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#046A38] flex items-center justify-center font-bold text-xl">
              ✉️
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg">بريد وبيانات التواصل المعتمدة للمقرأة</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تعديل أو استبدال بريد التواصل واستقبال استفسارات الزوار والطلاب (دون المساس بحسابات تسجيل الدخول)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* بريد التواصل */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-800">
                بريد التواصل الرسمي (Contact & Support Email):
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      contactEmail: e.target.value,
                    }))
                  }
                  className="w-full text-sm font-bold text-slate-900 p-3 rounded-2xl border border-slate-200 focus:border-[#046A38] bg-slate-50 focus:bg-white text-left pl-10"
                  dir="ltr"
                  placeholder="rehabquran383@gmail.com"
                />
                <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                📌 هذا البريد يظهر في الفوتر والصفحات العامة واستقبال رسائل الزوار. لن يؤثر استبداله على بريدك الإداري المسجل للدخول.
              </p>
            </div>

            {/* رقم هاتف المقرأة */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-800">
                رقم الهاتف والاتصال الرسمي:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={settings.contactPhone}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      contactPhone: e.target.value,
                    }))
                  }
                  className="w-full text-sm font-bold text-slate-900 p-3 rounded-2xl border border-slate-200 focus:border-[#046A38] bg-slate-50 focus:bg-white text-left pl-10"
                  dir="ltr"
                  placeholder="+967 714 371 599"
                />
                <Phone className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
              </div>
              <p className="text-[11px] text-slate-500">
                رقم الاستقبال المعتمد للاتصال الهاتفي المباشر.
              </p>
            </div>

            {/* رقم الواتساب المباشر */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-800">
                رقم الواتساب المباشر للدعم والرد:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={settings.whatsappNumber}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      whatsappNumber: e.target.value,
                    }))
                  }
                  className="w-full text-sm font-bold text-slate-900 p-3 rounded-2xl border border-slate-200 focus:border-[#046A38] bg-slate-50 focus:bg-white text-left pl-10"
                  dir="ltr"
                  placeholder="+967 714 371 599"
                />
                <span className="text-base absolute left-3 top-3">📱</span>
              </div>
              <p className="text-[11px] text-slate-500">
                يُربط مباشرة بزر الواتساب العائم في أسفل الموقع.
              </p>
            </div>

            {/* أوقات عمل الدعم والتواصل */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-800">
                أوقات عمل الدعم والإشراف المعتمدة:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={settings.supportWorkingHours}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      supportWorkingHours: e.target.value,
                    }))
                  }
                  className="w-full text-xs sm:text-sm font-bold text-slate-900 p-3 rounded-2xl border border-slate-200 focus:border-[#046A38] bg-slate-50 focus:bg-white pr-10"
                  placeholder="متابعة يومية من 8 صباحاً حتى 10 مساءً"
                />
                <Clock className="w-5 h-5 text-slate-400 absolute right-3 top-3.5" />
              </div>
              <p className="text-[11px] text-slate-500">
                تظهر في صفحة التواصل واستمارة الاستفسارات.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* نافذة المعاينة الحية المباشرة للواجهات قبل الحفظ */}
      {/* ========================================================================= */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border-2 border-[#C5A059]">
            {/* رأس نافذة المعاينة */}
            <div className="p-4 sm:p-5 bg-[#046A38] text-white flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Eye className="w-5 h-5 text-amber-300" />
                <h3 className="font-black text-sm sm:text-base font-serif">
                  معاينة حية لتصميم البطاقات قبل الاعتماد والحفظ
                </h3>
              </div>

              {/* أزرار اختيار الشاشة والجهاز */}
              <div className="flex items-center gap-1.5 bg-emerald-950/60 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                    previewDevice === 'mobile' ? 'bg-[#C5A059] text-slate-950' : 'text-slate-300 hover:text-white'
                  }`}
                  title="معاينة شاشة الجوال"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">جوال</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewDevice('tablet')}
                  className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                    previewDevice === 'tablet' ? 'bg-[#C5A059] text-slate-950' : 'text-slate-300 hover:text-white'
                  }`}
                  title="معاينة شاشة التابلت"
                >
                  <Tablet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">تابلت</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                    previewDevice === 'desktop' ? 'bg-[#C5A059] text-slate-950' : 'text-slate-300 hover:text-white'
                  }`}
                  title="معاينة شاشة الحاسوب"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">حاسوب</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* شريط اختيار نوع الواجهة في المعاينة */}
            <div className="px-5 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">واجهة المعاينة:</span>
              <button
                type="button"
                onClick={() => setPreviewTarget('student')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  previewTarget === 'student' ? 'bg-[#046A38] text-white' : 'bg-white text-slate-700'
                }`}
              >
                بطاقات لوحة الطالب ({settings.studentDashboard.desktopColumns} أعمدة)
              </button>
              <button
                type="button"
                onClick={() => setPreviewTarget('teacher')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  previewTarget === 'teacher' ? 'bg-[#046A38] text-white' : 'bg-white text-slate-700'
                }`}
              >
                بطاقات لوحة المعلم ({settings.teacherDashboard.desktopColumns} أعمدة)
              </button>
              <button
                type="button"
                onClick={() => setPreviewTarget('curriculum')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  previewTarget === 'curriculum' ? 'bg-[#046A38] text-white' : 'bg-white text-slate-700'
                }`}
              >
                عرض التجويد والمتون
              </button>
            </div>

            {/* محتوى المعاينة التفاعلية التجسيدية */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              <div
                className={`mx-auto transition-all ${
                  previewDevice === 'mobile'
                    ? 'max-w-sm border-4 border-slate-700 rounded-3xl p-3 bg-white shadow-xl'
                    : previewDevice === 'tablet'
                    ? 'max-w-2xl border-4 border-slate-500 rounded-2xl p-4 bg-white shadow-xl'
                    : 'w-full'
                }`}
              >
                {/* 1. تجسيد بطاقات لوحة الطالب */}
                {previewTarget === 'student' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-sm text-slate-800">بطاقات لوحة الطالب التعليمية (محاكاة حية)</h4>
                      <span className="text-[11px] text-emerald-700 font-bold">
                        نمط: {settings.studentDashboard.visualTheme}
                      </span>
                    </div>

                    <div
                      className={`grid gap-3 ${
                        previewDevice === 'mobile'
                          ? settings.studentDashboard.mobileColumns === 1
                            ? 'grid-cols-1'
                            : 'grid-cols-2'
                          : previewDevice === 'tablet'
                          ? settings.studentDashboard.tabletColumns === 2
                            ? 'grid-cols-2'
                            : 'grid-cols-3'
                          : settings.studentDashboard.desktopColumns === 4
                          ? 'grid-cols-4'
                          : 'grid-cols-3'
                      }`}
                    >
                      {[
                        { title: 'حفظي', desc: 'الجزء الأول', icon: '📖', stat: 'الجزء 1', current: 'سورة البقرة' },
                        { title: 'مراجعتي', desc: 'تثبيت يومي', icon: '📚', stat: 'تثبيت مستمر', current: 'سورة الكهف' },
                        { title: 'جدولي', desc: 'مواعيد التسميع', icon: '📅', stat: 'حضور 98%', current: '3 أيام بالأسبوع' },
                        { title: 'معلمي', desc: 'بيانات وتواصل', icon: '👨‍🏫', stat: 'مجاز بالسند', current: 'الشيخ إبراهيم الوصابي' },
                        { title: 'دروسي', desc: 'الحصص والمقرر', icon: '🎓', stat: '14 درس', current: 'تجويد وتلاوة' },
                        { title: 'المتون العلمية', desc: 'شروحات واختبارات', icon: '📜', stat: 'تحفة الأطفال', current: 'باب أحكام النون' },
                      ].map((card, idx) => (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-2xl border transition-all ${
                            settings.studentDashboard.cardBorderHighlight
                              ? 'border-[#C5A059]/60 hover:border-[#046A38] bg-white shadow-xs'
                              : 'border-slate-200 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-lg">{card.icon}</span>
                            {settings.studentDashboard.showQuickStats && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                {card.stat}
                              </span>
                            )}
                          </div>
                          <h5 className="font-black text-xs sm:text-sm text-slate-900">{card.title}</h5>
                          <p className="text-[11px] text-slate-500 mt-0.5">{card.desc}</p>
                          {settings.studentDashboard.showProgressBars && (
                            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                              <div className="bg-[#046A38] h-full rounded-full" style={{ width: '75%' }} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. تجسيد بطاقات لوحة المعلم */}
                {previewTarget === 'teacher' && (
                  <div className="space-y-4">
                    <h4 className="font-black text-sm text-slate-800">بطاقات شؤون الطلاب للمعلم (محاكاة حية)</h4>
                    <div
                      className={`grid gap-3 ${
                        previewDevice === 'mobile'
                          ? settings.teacherDashboard.mobileColumns === 1
                            ? 'grid-cols-1'
                            : 'grid-cols-2'
                          : previewDevice === 'tablet'
                          ? settings.teacherDashboard.tabletColumns === 2
                            ? 'grid-cols-2'
                            : 'grid-cols-3'
                          : settings.teacherDashboard.desktopColumns === 4
                          ? 'grid-cols-4'
                          : 'grid-cols-3'
                      }`}
                    >
                      {['عبدالله أحمد', 'يوسف محمد', 'سارة خالد', 'عمر فاروق'].map((name, idx) => (
                        <div key={idx} className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-xs text-slate-900">{name}</span>
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
                              حاضر اليوم
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">مقرر اليوم: سورة مريم (1-20)</div>
                          {settings.teacherDashboard.showQuickRecitationButtons && (
                            <div className="pt-1 flex gap-1 text-[11px]">
                              <button className="flex-1 py-1 bg-[#046A38] text-white rounded-lg font-bold">
                                رصد تسميع
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. تجسيد التجويد والمتون */}
                {previewTarget === 'curriculum' && (
                  <div className="space-y-4">
                    <h4 className="font-black text-sm text-slate-800">بطاقات التجويد والمتون العلمية (محاكاة حية)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-4 rounded-2xl bg-white border-2 border-[#C5A059] shadow-xs">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-black text-xs text-emerald-900">متن تحفة الأطفال</span>
                          {settings.curriculumDisplay.weeklyExamsDisplay === 'badge' && (
                            <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                              اختبار أسبوعي مستحق
                            </span>
                          )}
                        </div>
                        {settings.curriculumDisplay.mutunShowExplanationExcerpt && (
                          <p className="text-xs text-slate-600 line-clamp-2">
                            شرح باب النون الساكنة والتنوين: أحكامها أربعة (الإظهار، الإدغام، القلب، الإخفاء)...
                          </p>
                        )}
                        {settings.curriculumDisplay.showExamDirectLaunchButton && (
                          <button className="mt-3 w-full py-1.5 bg-[#046A38] text-white rounded-xl text-xs font-bold">
                            بدء الاختبار الأسبوعي الذاتي
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* أسفل نافذة المعاينة */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                تظهر المعاينة بدقة التجاوب مع مقاسات الشاشة المختارة.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
                >
                  إغلاق المعاينة
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPreviewModalOpen(false);
                    handleSaveSettings();
                  }}
                  className="px-5 py-2 rounded-xl bg-[#046A38] text-white text-xs font-black hover:bg-emerald-800 shadow-md"
                >
                  حفظ وتطبيق الآن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* مودال إضافة رابط تواصل جديد */}
      {isAddingLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border-2 border-[#C5A059] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">إضافة قناة أو رابط تواصل جديد</h3>
              <button
                type="button"
                onClick={() => setIsAddingLinkModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نوع المنصة:</label>
                <select
                  value={newLinkPlatform}
                  onChange={(e) => setNewLinkPlatform(e.target.value as any)}
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="whatsapp">واتساب (WhatsApp)</option>
                  <option value="telegram">تيليجرام (Telegram)</option>
                  <option value="facebook">فيسبوك (Facebook)</option>
                  <option value="instagram">إنستجرام (Instagram)</option>
                  <option value="youtube">يوتيوب (YouTube)</option>
                  <option value="tiktok">تيك توك (TikTok)</option>
                  <option value="x">منصة إكس (X / Twitter)</option>
                  <option value="other">رابط آخر</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم القناة أو الحساب:</label>
                <input
                  type="text"
                  value={newLinkLabel}
                  onChange={(e) => setNewLinkLabel(e.target.value)}
                  placeholder="مثال: قناة الختمات القرآنية"
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الرابط المباشر (URL):</label>
                <input
                  type="url"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  placeholder="https://..."
                  dir="ltr"
                  className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-200 text-left"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">وصف مختصر (اختياري):</label>
                <input
                  type="text"
                  value={newLinkDesc}
                  onChange={(e) => setNewLinkDesc(e.target.value)}
                  placeholder="مثال: تنبيهات الحلقات والتسجيل"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddingLinkModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleCreateSocialLink}
                className="px-5 py-2 rounded-xl text-xs font-black text-white bg-[#046A38] hover:bg-emerald-800 shadow-md"
              >
                إضافة الرابط
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
