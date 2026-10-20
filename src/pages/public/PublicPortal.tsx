/**
 * البوابة العامة لمقرأة رحاب القرآن الإلكترونية
 * تشمل الصفحات العامة التسعة:
 * 1. الصفحة الرئيسية (Home)
 * 2. من نحن (About Us)
 * 3. البرامج التعليمية (Educational Programs)
 * 4. المعلمون (Teachers)
 * 5. المقرئون والمجازون (Reciters & Certified Sheikhs)
 * 6. الأسئلة الشائعة (FAQ)
 * 7. تواصل معنا (Contact Us)
 * 8. سياسة الخصوصية (Privacy Policy)
 * 9. الشروط والأحكام (Terms & Conditions)
 */

import React, { useState, useEffect } from 'react';
import { MakraaLocationCard } from '../../components/MakraaLocationCard';
const WeeklyHonorBoard = React.lazy(() => import('../../components/WeeklyHonorBoard').then(m => ({ default: m.WeeklyHonorBoard })));

import { 
  BookOpen, Users, Award, HelpCircle, Phone, ShieldCheck, 
  FileText, CheckCircle2, ChevronLeft, ArrowRight, Star, 
  MapPin, Clock, Send, MessageCircle, Instagram, Facebook, Headphones, Sparkles, Filter,
  LogIn, UserPlus, ExternalLink, Globe, Calendar, Trophy, HeartHandshake, Mic, Lock, 
  TrendingUp, Laptop, ArrowLeft, Search, Volume2, Shield, Mail, Youtube
} from 'lucide-react';
import { OfficialLogo } from '../../components/OfficialLogo';
import { getBrandLogoSettings } from '../../utils/brandLogoStore';
import { SearchFilterBar, LoadingState, ErrorState, EmptyState, FeedbackBanner } from '../../components/common/PortalUiKit';

export type PublicPageTab = 
  | 'home' 
  | 'about' 
  | 'programs' 
  | 'teachers' 
  | 'certified' 
  | 'faq' 
  | 'contact' 
  | 'privacy' 
  | 'terms';

interface PublicPortalProps {
  initialTab?: PublicPageTab;
  onOpenLogin: () => void;
  onOpenRegistration: () => void;
  onOpenQuranAudio?: () => void;
  onOpenTafsir?: () => void;
  onBackToWelcome?: () => void;
}

export const PublicPortal: React.FC<PublicPortalProps> = ({
  initialTab = 'home',
  onOpenLogin,
  onOpenRegistration,
  onOpenQuranAudio,
  onOpenTafsir,
  onBackToWelcome,
}) => {
  const [activeTab, setActiveTab] = useState<PublicPageTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [tafsirSearchInput, setTafsirSearchInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [brandSettings, setBrandSettings] = useState(() => getBrandLogoSettings());

  useEffect(() => {
    const handleBrandUpdate = (e: any) => {
      setBrandSettings(e.detail || getBrandLogoSettings());
    };
    window.addEventListener('brand_logo_updated', handleBrandUpdate);
    return () => window.removeEventListener('brand_logo_updated', handleBrandUpdate);
  }, []);

  // Contact form states
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactCategory, setContactCategory] = useState<'general' | 'academic' | 'technical' | 'financial'>('general');
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [honeypotValue, setHoneypotValue] = useState('');

  // Firestore dynamic teachers & sheikhs list
  const [teachersList, setTeachersList] = useState<any[]>([]);
  const [teachersError, setTeachersError] = useState<string | null>(null);
  const [faqList, setFaqList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const loadPublicTeachers = async () => {
    setIsLoading(true);
    setTeachersError(null);
    try {
      const { fetchCollectionItems } = await import('../../services/firestoreService');
      // Load teachers from Firestore public_teachers collection (NOT teachers)
      const teachersRes = await fetchCollectionItems<any>('public_teachers', { limitCount: 30 });
      if (teachersRes.error) {
        setTeachersError(teachersRes.error);
        setTeachersList([]);
      } else if (teachersRes.data && teachersRes.data.length > 0) {
        setTeachersList(teachersRes.data);
      } else {
        setTeachersList([]);
      }
    } catch (e: any) {
      console.warn('Error loading public teachers:', e);
      setTeachersError(e?.message || 'تعذر تحميل قائمة المعلمين');
      setTeachersList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'teachers' && activeTab !== 'certified') return;
    if (teachersList.length > 0) return;

    void loadPublicTeachers();
  }, [activeTab, teachersList.length]);

  useEffect(() => {
    if (activeTab !== 'faq' || faqList.length > 0) return;
    setFaqList([
      { q: 'ما هي شروط الالتحاق بمقرأة رحاب القرآن الإلكترونية؟', a: 'المقرأة مفتوحة لجميع الراغبين في حفظ كتاب الله وتجويده من جميع الفئات العمرية (بنين، فتيات، كبار وصغار)، دون اشتراط مستوى مسبق حيث يتم تحديد المستوى في الحلقة الأولى.' },
      { q: 'كيف يتم عقد جلسات التسميع والحلقات القرآنية؟', a: 'تُعقد الحلقات عن بعد عبر القاعات الصوتية والمرئية المباشرة داخل المنصة وبإشراف مباشر من شيوخ ومعلمات متخصصين.' },
      { q: 'هل تمنح المقرأة إجازات بالسند المتصل إلى رسول الله ﷺ؟', a: 'نعم، يوجد مسار مخصص لمن أتم حفظ القرآن الكريم وحقق الضوابط التجويدية لنيل الإجازة القرآنية بالسند المتصل بعد اجتياز العرض الكامل أمام اللجنة العلمية.' },
      { q: 'ما هو مقدار المساهمة الشهرية لدعم المقرأة؟', a: 'المقرأة مؤسسة تعليمية وقفية غير ربحية، والمساهمة الرمزية المقترحة هي (3000 ريال يمني أو ما يعادلها) لتغطية تكاليف الخوادم ومكافآت المعلمين، مع إعفاء غير القادرين.' },
      { q: 'هل توجد حلقات مخصصة للأخوات والنساء؟', a: 'نعم، يتوفر قسم مستقل تماماً للطالبات بإشراف معلمات ومقرئات مجازات مع مراعاة كاملة للخصوصية والضوابط الشرعية.' },
    ]);
  }, [activeTab, faqList.length]);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // فحص حقل المصيدة Honeypot لمكافحة الرسائل الآلية والبوتات
    if (honeypotValue.trim().length > 0) {
      // إرجاع نجاح وهمي فوري دون إرسال أي بيانات لـ Firestore لتقليل الرسائل الآلية
      setFeedback({ type: 'success', message: 'تم إرسال رسالتكم بنجاح وسيتواصل معكم فريق المقرأة قريباً.' });
      setContactName('');
      setContactPhone('');
      setContactEmail('');
      setContactMessage('');
      setHoneypotValue('');
      return;
    }

    const trimmedName = contactName.trim().slice(0, 100);
    const trimmedMessage = contactMessage.trim().slice(0, 2000);

    if (!trimmedName || !trimmedMessage) {
      setFeedback({ type: 'error', message: 'يرجى كتابة الاسم والرسالة بشكل كامل.' });
      return;
    }

    setIsSubmittingContact(true);
    try {
      const { saveDocumentItem } = await import('../../services/firestoreService');
      const res = await saveDocumentItem('complaints', null, {
        reporterName: trimmedName,
        reporterPhone: contactPhone.trim() || 'غير مدخل',
        reporterEmail: contactEmail.trim() || 'غير مدخل',
        reporterRole: 'public_visitor',
        category: contactCategory,
        subject: `رسالة تواصل عامة من: ${trimmedName}`,
        description: trimmedMessage,
        status: 'open'
      });

      if (!res.success) {
        setFeedback({ type: 'error', message: res.error || 'تعذر إرسال الرسالة، يرجى المحاولة لاحقاً أو التواصل عبر واتساب.' });
        return;
      }

      setFeedback({ type: 'success', message: 'تم إرسال رسالتكم بنجاح وسيتواصل معكم فريق المقرأة قريباً.' });
      setContactName('');
      setContactPhone('');
      setContactEmail('');
      setContactMessage('');
      setHoneypotValue('');
    } catch {
      setFeedback({ type: 'error', message: 'تعذر إرسال الرسالة، يرجى المحاولة لاحقاً أو التواصل عبر واتساب.' });
    } finally {
      setIsSubmittingContact(false);
    }
  };

  return (
    <div className="w-full text-[#2C3531] font-sans text-right" dir="rtl">

      {/* 2. الإشعارات والرسائل التفاعلية */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 w-full">
        <FeedbackBanner 
          type={feedback?.type || 'info'} 
          message={feedback?.message || null} 
          onClose={() => setFeedback(null)} 
        />
      </div>

      {/* 3. محتوى الصفحات التسعة */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full space-y-6">
        {/* ======================================================== */}
        {/* 1. الصفحة الرئيسية (HOME)                                */}
        {/* ======================================================== */}
        {activeTab === 'home' && (
          <div className="space-y-12 animate-fade-in" dir="rtl">
            {/* 1. البانر الترحيبي والواجهة الرئيسية المستوحاة من الهوية البصرية والتصميم المعتمد */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#003528] via-[#046A38] to-[#02281b] text-white p-6 sm:p-10 lg:p-12 border-2 border-[#C5A059] shadow-2xl">
              {/* زخرفة هندسية إسلامية خلفية ناعمة */}
              <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
                <svg className="w-[500px] h-[500px] text-[#C5A059]" fill="currentColor" viewBox="0 0 200 200">
                  <path d="M100 0 L122 78 L200 100 L122 122 L100 200 L78 122 L0 100 L78 78 Z" opacity="0.3"></path>
                  <circle cx="100" cy="100" fill="none" r="60" stroke="currentColor" strokeWidth="2"></circle>
                  <circle cx="100" cy="100" fill="none" r="85" stroke="currentColor" strokeWidth="1"></circle>
                </svg>
              </div>

              {/* الختم الرسمي كعلامة مائية وقورة */}
              <div className="absolute left-6 bottom-4 opacity-15 pointer-events-none hidden md:block">
                <img 
                  src={brandSettings.customSealUrl || '/brand/official-seal.png'} 
                  crossOrigin="anonymous"
                  alt="الختم الرسمي" 
                  width={220}
                  height={220}
                  loading="lazy" 
                  decoding="async" 
                  className="w-56 h-56 object-contain" 
                  onError={(e) => {
                    if (e.currentTarget.src !== window.location.origin + '/brand/official-seal.png') {
                      e.currentTarget.src = '/brand/official-seal.png';
                    }
                  }}
                />
              </div>

              {/* المحتوى الترحيبي المركزي */}
              <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto space-y-4">
                {/* شارة التميز القرآنية */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-[#C5A059] border border-[#C5A059]/40 text-xs sm:text-sm font-sans flex-wrap justify-center shadow-xs">
                  <Sparkles className="w-4 h-4 text-[#C5A059]" />
                  <span className="font-serif">﴿وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا﴾</span>
                  <span className="text-white/60">•</span>
                  <span>إجازات بالسند المتصل</span>
                  {brandSettings.showGlobalAssemblyMembership && (
                    <>
                      <span className="text-white/60">•</span>
                      <span className="text-white font-extrabold bg-[#C5A059]/25 px-2.5 py-0.5 rounded-full border border-[#C5A059]/50">
                        عضو التجمع العالمي للقرآن الكريم
                      </span>
                    </>
                  )}
                </div>

                {/* العنوان الترحيبي العريض */}
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold font-serif text-white leading-tight">
                  مرحباً بكم في مقرأة <span className="text-[#C5A059]">رحاب القرآن</span> العالمية
                </h1>

                {/* المتن التعريفي الأصيل */}
                <p className="text-sm sm:text-base text-emerald-100/95 leading-relaxed font-sans max-w-2xl mx-auto">
                  منصة قرآنية متخصصة تتيح لك تعلم القرآن الكريم حفظاً وتجويداً وتدبراً عن بُعد، وعرض التلاوة لنيل الإجازة بالسند المتصل إلى رسول الله ﷺ في حلقات مباشرة بإشراف نخبة من كبار المشايخ والمعلمات المجازات.
                </p>

                {/* أزرار الإجراءات الرئيسية الواضحة */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full max-w-md pt-2">
                  <button
                    onClick={onOpenRegistration}
                    className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#C5A059] to-[#d4af37] hover:from-[#b08d47] hover:to-[#c5a059] text-slate-950 font-bold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 border border-amber-200"
                  >
                    <UserPlus className="w-4 h-4 text-slate-950" />
                    <span>التسجيل في المقرأة</span>
                    <ArrowLeft className="w-4 h-4 text-slate-950" />
                  </button>

                  <button
                    onClick={onOpenLogin}
                    className="py-3 px-5 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 border border-white/30 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <LogIn className="w-4 h-4 text-[#C5A059]" />
                    <span>تسجيل الدخول</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('programs')}
                    className="py-3 px-5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-emerald-100 font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 border border-white/20"
                  >
                    <BookOpen className="w-4 h-4 text-emerald-300" />
                    <span>الحلقات والمسارات</span>
                  </button>
                </div>

                {/* بطاقة الصورة القرآنية الترحيبية مع الحفاظ على الصورة والجمالية */}
                <div 
                  className="w-full max-w-xl mx-auto h-44 sm:h-52 rounded-2xl overflow-hidden shadow-2xl border border-white/20 relative bg-cover bg-center transition-transform hover:scale-[1.01]"
                  style={{ backgroundImage: `url('https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=1200&q=80')` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                </div>
              </div>
            </section>

            {/* 2. بطاقات الإحصائيات الأربعة (Key Statistics Banner) */}
            <section className="relative z-20 -mt-6 sm:-mt-8 px-2 sm:px-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl">
                {/* 1 */}
                <div className="flex items-center gap-3 p-3 sm:p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                  <div className="w-11 h-11 rounded-xl bg-[#046A38]/10 text-[#046A38] flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-lg sm:text-xl font-black font-mono text-[#046A38] leading-tight">+60 دولة</span>
                    <span className="block text-[11px] sm:text-xs text-slate-600 truncate">انتشار طلابي عالمي</span>
                  </div>
                </div>

                {/* 2 */}
                <div className="flex items-center gap-3 p-3 sm:p-4 rounded-2xl bg-amber-50/70 border border-amber-100">
                  <div className="w-11 h-11 rounded-xl bg-[#C5A059]/15 text-[#C5A059] flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-lg sm:text-xl font-black font-mono text-[#C5A059] leading-tight">100%</span>
                    <span className="block text-[11px] sm:text-xs text-slate-600 truncate">سند متصل للنبي ﷺ</span>
                  </div>
                </div>

                {/* 3 */}
                <div className="flex items-center gap-3 p-3 sm:p-4 rounded-2xl bg-rose-50/70 border border-rose-100">
                  <div className="w-11 h-11 rounded-xl bg-rose-600/10 text-rose-700 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-lg sm:text-xl font-black font-mono text-rose-700 leading-tight">24 ساعة</span>
                    <span className="block text-[11px] sm:text-xs text-slate-600 truncate">أوقات وحلقات مرنة</span>
                  </div>
                </div>

                {/* 4 */}
                <div className="flex items-center gap-3 p-3 sm:p-4 rounded-2xl bg-teal-50/70 border border-teal-100">
                  <div className="w-11 h-11 rounded-xl bg-teal-700/10 text-teal-800 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-lg sm:text-xl font-black font-mono text-teal-800 leading-tight">نخبة مجازة</span>
                    <span className="block text-[11px] sm:text-xs text-slate-600 truncate">شيوخ ومعلمات مسندون</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. لوحة الوصول السريع (Quick Actions Panel) */}
            <section className="space-y-4">
              <div className="flex flex-col gap-1">
                <div className="inline-flex items-center gap-1.5 text-[#C5A059] text-xs font-bold font-sans">
                  <Sparkles className="w-4 h-4 text-[#C5A059]" />
                  <span>الوصول السريع للمقرأة</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#046A38]">ابدأ مسارك القرآني فوراً</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1 */}
                <button
                  onClick={() => setActiveTab('programs')}
                  className="flex items-center justify-between p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#046A38] shadow-xs hover:shadow-md transition-all cursor-pointer group text-right"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#046A38] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-[#046A38] transition-colors">
                        تصفح الحلقات واختيار الموعد
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">اختر الوقت والشيخ المناسب لجدولك اليومي</p>
                    </div>
                  </div>
                  <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-[#046A38] group-hover:-translate-x-1 transition-transform shrink-0" />
                </button>

                {/* 2 */}
                <button
                  onClick={onOpenRegistration}
                  className="flex items-center justify-between p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#C5A059] shadow-xs hover:shadow-md transition-all cursor-pointer group text-right"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#C5A059] text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                      <UserPlus className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-[#C5A059] transition-colors">
                        إنشاء حساب طالب / طالبة
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">خطوات تسجيل ميسرة تنتهي خلال دقيقتين</p>
                    </div>
                  </div>
                  <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-[#C5A059] group-hover:-translate-x-1 transition-transform shrink-0" />
                </button>

                {/* 3 */}
                <button
                  onClick={() => setActiveTab('certified')}
                  className="flex items-center justify-between p-5 rounded-2xl bg-white border border-slate-200 hover:border-teal-700 shadow-xs hover:shadow-md transition-all cursor-pointer group text-right"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#034423] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Award className="w-6 h-6 text-[#C5A059]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-teal-800 transition-colors">
                        مسار الإجازات والضوابط
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">شروط نيل الإسناد القرآني المتصل ومعايير الإتقان</p>
                    </div>
                  </div>
                  <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-teal-800 group-hover:-translate-x-1 transition-transform shrink-0" />
                </button>
              </div>
            </section>

            {/* 4. الأقسام والمسارات القرآنية المتخصصة */}
            <section className="space-y-6" id="circles">
              <div className="text-center max-w-xl mx-auto space-y-1.5">
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-[#046A38] text-xs font-bold border border-emerald-200">
                  المسارات المتخصصة
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-serif text-[#046A38]">
                  الأقسام والمسارات القرآنية
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  حلقات مخصصة تلبي احتياجات كافة الفئات العمرية والمستويات القرآنية
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* قسم الطلاب (بنين) */}
                <div className="rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div 
                      className="w-full h-36 bg-cover bg-center relative"
                      style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAEpgwHCwq3mHY6fSzZbWp6DzFD-b3n7nQ6dbj1fkdj2XsfZxrninzV9cFY6aGKOof_BU1vvCrvQroahqzVNUyPDAcTpzNcaJslKZxxGuisj-kBqkhsdtls9KUVJ3W4O3YX6PH_L5E0Cg_wDYwU60DYwPxkZsLmHpjFaDiuY8vSD_WVOWVUeT4GRfLtDcDkWLCsFgnxPdhmMaTDKnb2jp0LnVQ5ezOLluO9fDPlglJj0mzesTfsml3mGw')` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-[#046A38]/95 to-transparent flex items-end p-4">
                        <span className="px-3 py-1 rounded-full bg-white/90 text-[#046A38] text-xs font-bold shadow-xs">
                          قسم الطلاب • بنين
                        </span>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6 space-y-3">
                      <h3 className="text-lg font-bold font-serif text-[#046A38]">حلقات الأشبال والشباب والرجال</h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                        ضبط مخارج الحروف، والتجويد العملي مع نخبة من كبار المشايخ المجازين عبر بث صوتي ومرئي تفاعلي مباشر يومياً.
                      </p>
                      <div className="flex items-center gap-3 pt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-[#046A38] font-bold">
                          <Mic className="w-3.5 h-3.5" />
                          <span>تسميع فردي مباشر</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-600">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>مستويات متدرجة</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 pt-0">
                    <button
                      onClick={onOpenRegistration}
                      className="w-full py-3 px-4 rounded-xl bg-[#046A38] hover:bg-[#03542c] text-white text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                    >
                      <span>التسجيل في قسم الطلاب</span>
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* قسم الطالبات (أخوات) */}
                <div className="rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div 
                      className="w-full h-36 bg-cover bg-center relative"
                      style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDyKVCkNb8vCYJoRyHYTwzmofg4QOv7MTp4rw1OXoq2U-wmTVnxPlp1mevXdSvhI3vE3LisSZt_6CbwUmm8rdBeoFcZL0QmK3xj73mKoa4wdtS3MLDwe6MlnIUxFPKMSb7a8foD8hl7jHxoRue5QhFobGDzVlpEUO5WuZeCM3I5JjZwcFBQb9Fm7fsVqtunwhUP2Qugo8F94WALeEVMRtP6vPXWQ8OSgNYIDcdrQ-8UkSbzfWjBtdfSKg')` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-teal-900/95 to-transparent flex items-end p-4">
                        <span className="px-3 py-1 rounded-full bg-white/90 text-teal-900 text-xs font-bold shadow-xs">
                          قسم الطالبات • أخوات
                        </span>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6 space-y-3">
                      <h3 className="text-lg font-bold font-serif text-teal-900">بيئة قرآنية خاصة ومحمية للأخوات</h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                        بيئة تعليمية وقورة وخاصة تماماً للأخوات والفتيات بإشراف معلمات ومقرئات مجازات ذوات خبرة راسخة في أوقات صباحية ومسائية مرنة.
                      </p>
                      <div className="flex items-center gap-3 pt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-teal-800 font-bold">
                          <Lock className="w-3.5 h-3.5" />
                          <span>خصوصية تامة</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-600">
                          <Headphones className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>معلمات مجازات</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 pt-0">
                    <button
                      onClick={onOpenRegistration}
                      className="w-full py-3 px-4 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                    >
                      <span>التسجيل في قسم الطالبات</span>
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* مسار الإجازات والسند المتصل */}
                <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-[#02311c] via-[#046A38] to-[#022314] text-white border-2 border-[#C5A059] shadow-md flex flex-col justify-between">
                  <div className="p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-[#C5A059] text-slate-950 font-bold text-xs shadow-xs">
                        مسار النخبة
                      </span>
                      <Award className="w-6 h-6 text-[#C5A059]" />
                    </div>

                    <h3 className="text-xl font-bold font-serif text-white">مسار الإجازات والسند المتصل</h3>
                    <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed font-sans">
                      مسار مخصص لخاتمي القرآن الكريم لضبط المتشابهات ودراسة الجزرية والشاطبية، وعرض الختمة كاملة لنيل الإجازة المسندة إلى النبي ﷺ.
                    </p>

                    <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-emerald-200">
                      <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>بالقراءات العشر</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>إجازات معتمدة</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 pt-0">
                    <button
                      onClick={() => setActiveTab('certified')}
                      className="w-full py-3 px-4 rounded-xl bg-[#C5A059] hover:bg-[#b58f47] text-slate-950 text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
                    >
                      <span>تفاصيل مسار الإجازات والضوابط</span>
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* بطاقة التفسير الميسر للقرآن الكريم (مجمع الملك فهد) مع محرك بحث سريع */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-[#C5A059]/40 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-3 max-w-xl text-right">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#046A38] text-white flex items-center justify-center shrink-0 shadow-sm">
                      <BookOpen className="w-6 h-6 text-[#C5A059]" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold font-serif text-[#046A38]">
                        التفسير الميسّر للقرآن الكريم
                      </h3>
                      <p className="text-xs text-slate-500">معتمد من مجمع الملك فهد لطباعة المصحف الشريف</p>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                    ابحث في كامل آيات القرآن الـ 6236 آية وتدبر معاني المفردات وأسباب النزول بسلاسة مع التلاوة الصوتية المتزامنة.
                  </p>

                  {/* حقل البحث السريع في التفسير */}
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (onOpenTafsir) {
                        onOpenTafsir();
                      } else {
                        const q = tafsirSearchInput.trim() ? `?q=${encodeURIComponent(tafsirSearchInput.trim())}` : '';
                        window.history.pushState({}, '', `/tafsir${q}`);
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }
                    }}
                    className="relative w-full max-w-md pt-1"
                  >
                    <input 
                      type="text"
                      value={tafsirSearchInput}
                      onChange={(e) => setTafsirSearchInput(e.target.value)}
                      placeholder="ابحث عن آية أو سورة أو كلمة..."
                      className="w-full py-2.5 pr-10 pl-4 rounded-xl bg-[#F9F6F0] text-slate-900 border border-slate-200 text-xs focus:outline-none focus:border-[#046A38]"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-4" />
                  </form>
                </div>

                <div className="w-full md:w-auto shrink-0 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      if (onOpenTafsir) {
                        onOpenTafsir();
                      } else {
                        window.history.pushState({}, '', '/tafsir');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }
                    }}
                    className="px-6 py-3.5 rounded-xl bg-[#046A38] hover:bg-[#03542c] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>تصفح التفسير الميسّر كاملاً ←</span>
                  </button>
                </div>
              </div>
            </section>

            {/* 5. مميزات منصة رحاب القرآن (Why Us Section) */}
            <section className="space-y-6">
              <div className="text-center max-w-xl mx-auto space-y-1.5">
                <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                  لماذا نحن؟
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-serif text-[#046A38]">
                  مميزات منصة رحاب القرآن
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  كل ما تحتاجه لرحلة حفظ متقنة وسلسة ومستدامة
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 text-right">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#046A38] flex items-center justify-center border border-emerald-100">
                    <Mic className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 font-serif">مشايخ ومعلمات مجازات</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans">
                    كوادر قرآنية معتمدة بأعلى أسانيد الإقراء المتصلة لتقديم تصحيح دقيق وأصيل.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 text-right">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center border border-teal-100">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 font-serif">حلقات مباشرة تفاعلية</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans">
                    مواعيد يومية ثابتة ومجموعات نموذجية بأعداد محدودة لضمان وقت كافٍ لكل طالب.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 text-right">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-100">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 font-serif">متابعة دقيقة وتقارير</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans">
                    سجل إلكتروني يحسب آيات الحفظ، مراجعة المتشابهات، ونسب الحضور أسبوعياً.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 text-right">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-[#046A38] flex items-center justify-center border border-slate-200">
                    <Laptop className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 font-serif">منصة سهلة ومتاحة دائماً</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans">
                    تجربة مستخدم سريعة وسلسة تعمل بكفاءة على الهواتف والأجهزة اللوحية والحواسيب.
                  </p>
                </div>
              </div>
            </section>

            {/* 6. رحلة البدء والخطوات الأربعة (Step-by-Step Onboarding Journey) */}
            <section className="space-y-6">
              <div className="text-center max-w-xl mx-auto space-y-1.5">
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-[#046A38] text-xs font-bold border border-emerald-200">
                  خطوات واضحة وميسرة
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-serif text-[#046A38]">
                  كيف تبدأ رحلتك معنا؟
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  ٤ خطوات فقط لتنضم لركب أهل القرآن الكريم
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Step 1 */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#046A38] text-white flex items-center justify-center font-bold text-base shrink-0 font-serif">
                    ١
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900">إنشاء الحساب</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      سجل بياناتك الأساسية عبر بوابة الطالب لتفعيل ملفك الشخصي خلال دقائق معدودة.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#046A38] text-white flex items-center justify-center font-bold text-base shrink-0 font-serif">
                    ٢
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900">تحديد المستوى والحلقة</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      تقييم تلاوة مبدئي سريع لتوجيهك للحلقة الأنسب مع تحديد الوقت الملائم ليومك.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold text-base shrink-0 font-serif">
                    ٣
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900">الحضور المباشر</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      ادخل الحلقة الافتراضية بنقرة واحدة، واستمع لتصحيح الأحكام والتلاوة الفردية.
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#C5A059] text-slate-950 flex items-center justify-center font-bold text-base shrink-0 font-serif">
                    ٤
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900">متابعة ونيل الإجازة</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      رصد آلي لتقدمك حتى ختم كتاب الله ومنحك الإجازة بالسند المتصل بعد الاختبار.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 7. لوحة الشرف الأسبوعية الرسمية المتصلة بقاعدة البيانات */}
            <section className="space-y-4" id="honor">
              <React.Suspense fallback={<div className="p-6 bg-white rounded-2xl animate-pulse h-40 border border-slate-200" />}>
                <WeeklyHonorBoard onViewAll={() => setActiveTab('programs')} />
              </React.Suspense>
            </section>

            {/* 8. المنصات والقنوات الرسمية للمقرأة */}
            <section className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold font-serif text-[#046A38]">
                    القنوات والمنصات الرسمية للمقرأة
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    تابع جداول البث المباشر والإعلانات وتوزيع الحلقات اليومية فوراً
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-[#046A38] text-xs font-bold border border-emerald-200 self-start sm:self-auto">
                  منصات موثقة ومعتمدة
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                <a
                  href={brandSettings.whatsappChannelUrl || 'https://whatsapp.com/channel/0029Vb4RehabQuran'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#F9F6F0] hover:bg-emerald-50/70 border border-slate-200 hover:border-[#25D366] transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-[#046A38] block truncate">
                      مجتمع الواتساب
                    </span>
                    <span className="text-[11px] text-slate-500 block truncate">قناة وإعلانات رسمية</span>
                  </div>
                </a>

                <a
                  href={brandSettings.telegramUrl || 'https://t.me/rehabpa'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#F9F6F0] hover:bg-sky-50/70 border border-slate-200 hover:border-sky-400 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#229ED9] text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Send className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-sky-700 block truncate">
                      قناة التيليجرام
                    </span>
                    <span className="text-[11px] text-slate-500 block truncate">تنبيهات وتلاوات</span>
                  </div>
                </a>

                <a
                  href={brandSettings.facebookUrl || 'https://www.facebook.com/profile.php?id=61594338165497'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#F9F6F0] hover:bg-blue-50/70 border border-slate-200 hover:border-blue-400 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#1877F2] text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Facebook className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-700 block truncate">
                      صفحة الفيسبوك
                    </span>
                    <span className="text-[11px] text-slate-500 block truncate">أخبار ومنشورات المقرأة</span>
                  </div>
                </a>

                <a
                  href={brandSettings.instagramUrl || 'https://www.instagram.com/rehabquran47884517?stkn=cmwzY2Jtd2Rsbnc4'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#F9F6F0] hover:bg-pink-50/70 border border-slate-200 hover:border-pink-400 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Instagram className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-pink-700 block truncate">
                      حساب الإنستغرام
                    </span>
                    <span className="text-[11px] text-slate-500 block truncate">مرئيات وفوائد</span>
                  </div>
                </a>

                {/* 5. قناة اليوتيوب */}
                <a
                  href={brandSettings.youtubeUrl || 'https://www.youtube.com/@RehabQuran-s5m'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#F9F6F0] hover:bg-red-50/70 border border-slate-200 hover:border-red-500 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#FF0000] text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Youtube className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-red-700 block truncate">
                      قناة اليوتيوب الرسمية
                    </span>
                    <span className="text-[11px] text-slate-500 block truncate">ختمات وتلاوات مرئية</span>
                  </div>
                </a>

                {/* 6. حساب التيك توك */}
                <a
                  href={brandSettings.tiktokUrl || 'https://vm.tiktok.com/ZS9UHb6rGL5uW-lZi3G/'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#F9F6F0] hover:bg-slate-100 border border-slate-200 hover:border-slate-800 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-slate-950 block truncate">
                      حساب التيك توك
                    </span>
                    <span className="text-[11px] text-slate-500 block truncate">مقاطع تلاوات قصيرة</span>
                  </div>
                </a>
              </div>
            </section>

            {/* 9. دعم المقرأة وكفالة الحلقات + بيانات التواصل المباشر الحقيقية */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* دعم المقرأة وكفالة الحلقات (مع الحفاظ على البيانات الحقيقية فقط دون حسابات بنكية تجريبية) */}
              <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-[#046A38] via-[#034423] to-[#02281b] text-white border-2 border-[#C5A059] shadow-md flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-[#C5A059] text-slate-950 text-xs font-bold shadow-xs">
                      صدقة جارية وأثر دائم
                    </span>
                    <HeartHandshake className="w-6 h-6 text-[#C5A059]" />
                  </div>
                  <h3 className="text-xl font-bold font-serif text-white">دعم المقرأة وكفالة حلقات القرآن الكريم</h3>
                  <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed font-sans">
                    سهمك يسهم في تغطية نفقات معلمي القرآن الكريم، توفير المنصات التقنية المجانية لطلاب العلم، وكفالة الحلقات القرآنية في مختلف دول العالم.
                  </p>
                </div>

                <div className="pt-2">
                  <a
                    href={`https://wa.me/967714371599?text=${encodeURIComponent('السلام عليكم ورحمة الله وبركاته، أود الاستفسار عن سبل دعم المقرأة والمساهمة في كفالة الحلقات القرآنية 📖✨')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-xl bg-[#C5A059] hover:bg-[#b58f47] text-slate-950 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 text-slate-950" />
                    <span>تواصل مع الإدارة لكفالة حلقة أو دعم المقرأة</span>
                  </a>
                </div>
              </div>

              {/* بطاقة بيانات التواصل الإدارية الحقيقية المعتمدة */}
              <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[#046A38]">
                    <HelpCircle className="w-5 h-5 text-[#C5A059]" />
                    <h3 className="font-bold text-base sm:text-lg font-serif">بيانات التواصل المباشر مع إدارة المقرأة</h3>
                  </div>

                  <div className="space-y-2 text-xs sm:text-sm text-slate-700">
                    <div className="flex items-center justify-between p-3 bg-[#F9F6F0] rounded-xl border border-slate-200">
                      <span className="flex items-center gap-2 font-bold text-slate-900">
                        <Phone className="w-4 h-4 text-[#046A38]" />
                        <span>الهاتف والواتساب:</span>
                      </span>
                      <a href="https://wa.me/967714371599" target="_blank" rel="noreferrer" className="text-[#046A38] font-mono font-bold dir-ltr hover:underline">
                        +967 714 371 599
                      </a>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[#F9F6F0] rounded-xl border border-slate-200">
                      <span className="flex items-center gap-2 font-bold text-slate-900">
                        <Mail className="w-4 h-4 text-[#046A38]" />
                        <span>البريد الإلكتروني:</span>
                      </span>
                      <a href={`mailto:${brandSettings.contactEmail || 'rehabquran383@gmail.com'}`} className="text-[#046A38] font-mono font-bold dir-ltr truncate hover:underline">
                        {brandSettings.contactEmail || 'rehabquran383@gmail.com'}
                      </a>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[#F9F6F0] rounded-xl border border-slate-200">
                      <span className="flex items-center gap-2 font-bold text-slate-900">
                        <MapPin className="w-4 h-4 text-[#046A38]" />
                        <span>المقر الرئيسي:</span>
                      </span>
                      <span className="text-slate-800 font-bold">اليمن - ومن جميع دول العالم</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('contact')}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>نموذج المراسلة والاقتراحات المباشر</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. من نحن (ABOUT US)                                     */}
        {/* ======================================================== */}
        {activeTab === 'about' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-[#C5A059] uppercase">عن الصرح القرآني</span>
                <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#046A38]">من نحن - مقرأة رحاب القرآن</h2>
              </div>
              {brandSettings.showGlobalAssemblyMembership && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F9F6F0] border border-[#C5A059]/60 text-[#046A38] text-xs font-bold shadow-2xs">
                  <span>🏛️</span>
                  <span>عضو التجمع العالمي للقرآن الكريم</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <p>
                  <strong>مقرأة رحاب القرآن الإلكترونية</strong> هي منصة قرآنية تعليمية رائدة{brandSettings.showGlobalAssemblyMembership ? '، وعضو التجمع العالمي للقرآن الكريم' : ''}، تأسست بهدف تيسير تعلم كتاب الله تعالى وتلاوته وحفظه وتدبره لجميع المسلمين حول العالم عبر أحدث تقنيات التعليم الرقمي عن بُعد.
                </p>
                <p>
                  تتميز المقرأة بالجمع بين <strong>الأصالة العلمية</strong> من خلال لجان متخصصة في الإقراء ومنح السند المتصل لكتاب الله، و<strong>المعاصرة التقنية</strong> من خلال منظومة سحابية ذكية تتابع خطط الحفظ، وترصد الحضور، وتتيح التقييم المستمر وتوثيق الإجازات بالسند المتصل المعتمدة بالختم الرسمي.
                </p>
                <div className="bg-[#F9F6F0] p-4 rounded-2xl border border-[#C5A059]/40 space-y-2">
                  <h4 className="font-bold text-[#046A38] text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>رؤيتنا ورسالتنا:</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    أن نكون المنصة القرآنية الرائدة عالمياً في تخريج حفظة متقنين لكتاب الله، مجازين بالسند المتصل إلى رسول الله ﷺ، جامعين بين حُسن التلاوة ورسوخ التدبر والعمل.
                  </p>
                </div>
              </div>

              <div className="bg-[#F9F6F0] p-6 rounded-3xl border-2 border-[#C5A059] flex flex-col items-center text-center space-y-4 shadow-xs">
                <img 
                  src={brandSettings.customSealUrl || '/brand/official-seal.png'} 
                  crossOrigin="anonymous"
                  alt="الختم الرسمي للمقرأة" 
                  width={128}
                  height={128}
                  loading="lazy" 
                  decoding="async" 
                  className="w-32 h-32 object-contain" 
                  onError={(e) => {
                    if (e.currentTarget.src !== window.location.origin + '/brand/official-seal.png') {
                      e.currentTarget.src = '/brand/official-seal.png';
                    }
                  }}
                />
                <div>
                  <h4 className="font-bold font-serif text-base text-[#046A38]">مؤسسة تعليمية قرآنية معتمدة</h4>
                  {brandSettings.showGlobalAssemblyMembership && (
                    <p className="text-xs text-slate-600 mt-1 font-bold text-[#C5A059]">عضو التجمع العالمي للقرآن الكريم</p>
                  )}
                  <p className="text-[11px] text-slate-500 mt-0.5">بإشراف نخبة من كبار المشايخ والمقرئين المجازين بالسند المتصل</p>
                </div>
                <div className="grid grid-cols-2 gap-3 w-full pt-2 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[#046A38] font-bold block">المنهج المعتمد</span>
                    <span className="text-[11px] text-slate-500">القراءات المتواترة</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[#046A38] font-bold block">نظام الحلقات</span>
                    <span className="text-[11px] text-slate-500">مباشر وفردي وتفاعلي</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. البرامج التعليمية (EDUCATIONAL PROGRAMS)                */}
        {/* ======================================================== */}
        {activeTab === 'programs' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-[#C5A059]">المناهج والمسارات المعتمدة</span>
                <h2 className="text-xl font-bold font-serif text-[#046A38]">البرامج التعليمية في المقرأة</h2>
              </div>
              <button
                onClick={onOpenRegistration}
                className="px-4 py-2 bg-[#046A38] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer border border-[#C5A059]"
              >
                التسجيل في برنامج جديد
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  title: 'برنامج الحفظ الشامل المتدرج',
                  badge: 'لجميع المستويات',
                  desc: 'خطة حفظ منهجية متدرجة تبدأ من جزء عم وصولاً للختم الكامل، مع برنامج للمراجعة الصغرى والكبرى ورصد الإتقان اليومي.',
                  features: ['تسميع يومي مباشر', 'اختبار قياس بعد كل جزء', 'متابعة فردية من المعلم']
                },
                {
                  title: 'برنامج تصحيح التلاوة وإتقان التجويد',
                  badge: 'نظري وعملي',
                  desc: 'دراسة عملية لمخارج الحروف والصفات وأحكام النون والميم والمدود مع التدريب الصوتي التفاعلي على الآيات القرآنية.',
                  features: ['مصحف معلم مدمج', 'مراجعة تسجيلات التلاوة', 'تحليل الأخطاء الشائعة']
                },
                {
                  title: 'برنامج الإجازة بالسند المتصل',
                  badge: 'للحفاظ المتقنين',
                  desc: 'عرض كامل للمصحف الشريف غيباً على شيخ مجاز بالسند المتصل إلى رسول الله ﷺ بروايات حفص أو ورش أو قالون.',
                  features: ['سند متصل معتمد', 'ختم رسمي موثق', 'إجازة قرآنية مسندة']
                }
              ].map((prog, idx) => (
                <div key={idx} className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold bg-[#F9F6F0] text-[#046A38] px-2.5 py-1 rounded-full border border-[#C5A059]/40">
                      {prog.badge}
                    </span>
                    <h3 className="font-bold font-serif text-base text-slate-900 pt-1">{prog.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{prog.desc}</p>
                    <div className="pt-2 space-y-1.5">
                      {prog.features.map((f, fi) => (
                        <div key={fi} className="flex items-center gap-2 text-xs text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#046A38]" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={onOpenRegistration}
                    className="w-full py-2 bg-[#F9F6F0] hover:bg-[#046A38] hover:text-white text-[#046A38] rounded-xl text-xs font-bold transition-all border border-[#C5A059]/40 cursor-pointer"
                  >
                    الالتحاق بهذا البرنامج
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. المعلمون (TEACHERS)                                    */}
        {/* ======================================================== */}
        {activeTab === 'teachers' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-[#C5A059]">الكادر القرآني</span>
                <h2 className="text-xl font-bold font-serif text-[#046A38]">معلمو ومعلمات المقرأة</h2>
              </div>
              <div className="text-xs text-slate-500 font-bold">
                إجمالي المعلمين المعتمدين: {teachersList.length}
              </div>
            </div>

            {isLoading ? (
              <LoadingState message="جاري استعراض كادر المعلمين..." />
            ) : teachersError ? (
              <ErrorState 
                message={teachersError} 
                onRetry={() => void loadPublicTeachers()} 
              />
            ) : teachersList.length === 0 ? (
              <EmptyState 
                title="سيتم نشر قائمة المعلمين قريباً" 
                description="تقوم إدارة المقرأة حالياً بتحديث واعتماد كادر المشايخ والمعلمات المجازين في القراءات." 
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {teachersList.map((t, idx) => (
                  <div key={t.id || idx} className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#046A38] flex items-center justify-center font-bold text-lg border border-[#C5A059]/40">
                        {t.name?.charAt(0) || 'ش'}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 font-serif">{t.name}</h4>
                        <span className="text-[11px] text-[#C5A059] font-bold block">{t.roleLabel || 'معلم معتمد'}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{t.qualification}</p>
                    <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span>الرواية: <strong>{t.riwayah || 'حفص عن عاصم'}</strong></span>
                      <span className="text-[#046A38] font-bold">● متواجد بالحلقات</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 5. المقرئون والمجازون (CERTIFIED SHEIKHS)                  */}
        {/* ======================================================== */}
        {activeTab === 'certified' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-gradient-to-r from-[#046A38] to-[#065A31] p-6 sm:p-8 rounded-3xl text-white border-2 border-[#C5A059] shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#C5A059]">الأسانيد المتصلة المعتمدة</span>
                <h2 className="text-xl sm:text-2xl font-bold font-serif">شيوخ الإقراء والمجازون بالسند</h2>
                <p className="text-xs text-emerald-100 max-w-xl">
                  تمنح المقرأة إجازاتها بعد استيفاء شروط العرض والتدقيق العلمي على يد فضيلة الشيخ المجيز وشيوخ المقرأة المعتمدين بالسند المتصل.
                </p>
              </div>
              <img 
                src={brandSettings.customSealUrl || '/brand/official-seal.png'} 
                crossOrigin="anonymous" 
                alt="الختم الرسمي" 
                width={80}
                height={80}
                loading="lazy"
                decoding="async"
                className="w-20 h-20 object-contain shrink-0" 
                onError={(e) => {
                  if (e.currentTarget.src !== window.location.origin + '/brand/official-seal.png') {
                    e.currentTarget.src = '/brand/official-seal.png';
                  }
                }}
              />
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold font-serif text-[#046A38]">ضوابط الحصول على الإجازة القرآنية:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700 leading-relaxed">
                <div className="p-4 bg-[#F9F6F0] rounded-2xl border border-[#C5A059]/40 space-y-1">
                  <strong className="text-slate-900 block font-bold">1. إتقان الحفظ الكامل:</strong>
                  <span>حفظ القرآن الكريم كاملاً غيباً بنسبة إتقان لا تقل عن 95% وفق معايير الاختبار المعتمدة.</span>
                </div>
                <div className="p-4 bg-[#F9F6F0] rounded-2xl border border-[#C5A059]/40 space-y-1">
                  <strong className="text-slate-900 block font-bold">2. دراسة المتون التجويدية:</strong>
                  <span>دراسة وفهم منظومة الجزرية أو تحفة الأطفال وضبط مخارج الحروف والصفات بدقة.</span>
                </div>
                <div className="p-4 bg-[#F9F6F0] rounded-2xl border border-[#C5A059]/40 space-y-1">
                  <strong className="text-slate-900 block font-bold">3. الختم الكامل بالتسميع:</strong>
                  <span>قراءة القرآن الكريم من الفاتحة إلى الناس على الشيخ المقرئ في جلسات متصلة وموثقة.</span>
                </div>
                <div className="p-4 bg-[#F9F6F0] rounded-2xl border border-[#C5A059]/40 space-y-1">
                  <strong className="text-slate-900 block font-bold">4. وثيقة الإجازة والختم الرسمي:</strong>
                  <span>إصدار وثيقة الإجازة القرآنية بالسند المتصل موثقة برقم تسلسلي وختم المقرأة الرسمي وتوقيع فضيلة الشيخ المجيز.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 6. الأسئلة الشائعة (FAQ)                                  */}
        {/* ======================================================== */}
        {activeTab === 'faq' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-[#C5A059]">مركز المساعدة والاستفسارات</span>
              <h2 className="text-xl font-bold font-serif text-[#046A38] mt-1">الأسئلة الشائعة حول المقرأة</h2>
              <p className="text-xs text-slate-500 mt-1">إجابات وافية على كافة التساؤلات الخاصة بالتسجيل والمناهج والحلقات.</p>
            </div>

            <div className="space-y-3">
              {faqList.map((item, index) => (
                <div key={index} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <h4 className="font-bold text-sm text-[#046A38] font-serif flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-50 text-[#046A38] flex items-center justify-center text-xs font-mono font-bold">
                      {index + 1}
                    </span>
                    <span>{item.q}</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed pr-8">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 7. تواصل معنا (CONTACT US)                                */}
        {/* ======================================================== */}
        {activeTab === 'contact' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {/* نموذج المراسلة المباشر */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <span className="text-xs font-bold text-[#C5A059]">راسلنا مباشرة</span>
                <h3 className="text-lg font-bold font-serif text-[#046A38]">نموذج التواصل السريع</h3>
              </div>

              <form onSubmit={handleContactSubmit} className="space-y-3">
                {/* حقل Honeypot مخفي بـ CSS لمكافحة الرسائل الآلية والبوتات */}
                <div 
                  className="hidden opacity-0 pointer-events-none absolute -z-10 select-none overflow-hidden h-0 w-0" 
                  aria-hidden="true" 
                  tabIndex={-1}
                >
                  <label htmlFor="website_hp">الموقع الإلكتروني (يرجى تركه فارغاً)</label>
                  <input
                    id="website_hp"
                    type="text"
                    name="website_hp"
                    value={honeypotValue}
                    onChange={(e) => setHoneypotValue(e.target.value)}
                    autoComplete="off"
                    tabIndex={-1}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الكريم:</label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="أدخل اسمك كاملاً"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#046A38] focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف / الواتساب:</label>
                    <input
                      type="text"
                      maxLength={30}
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+967..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#046A38] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني (اختياري):</label>
                    <input
                      type="email"
                      maxLength={100}
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="example@email.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#046A38] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">قسم الاستفسار:</label>
                  <select
                    value={contactCategory}
                    onChange={(e: any) => setContactCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#046A38] focus:bg-white cursor-pointer"
                  >
                    <option value="general">استفسار عام عن المقرأة</option>
                    <option value="academic">استفسار أكاديمي أو عن الإجازات</option>
                    <option value="technical">مساعدة تقنية في المنصة</option>
                    <option value="financial">المساهمات المالية ودعم المقرأة</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">رسالتك أو ملاحظتك:</label>
                    <span className="text-[10px] text-slate-400 font-mono">{contactMessage.length} / 2000</span>
                  </div>
                  <textarea
                    required
                    rows={4}
                    maxLength={2000}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="اكتب رسالتك أو استفسارك هنا..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#046A38] focus:bg-white resize-y"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingContact}
                  className="w-full py-3 bg-[#046A38] hover:bg-[#03552d] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 border border-[#C5A059]"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmittingContact ? 'جاري الإرسال...' : 'إرسال الرسالة إلى إدارة المقرأة'}</span>
                </button>
              </form>
            </div>

            {/* وسائل التواصل والمراسلة المباشرة */}
            <div className="space-y-4">
              <div className="bg-[#F9F6F0] p-6 rounded-3xl border border-[#C5A059]/40 space-y-4">
                <div className="border-b border-[#C5A059]/20 pb-3">
                  <h3 className="text-base font-bold font-serif text-[#046A38]">وسائل التواصل والمراسلة المباشرة</h3>
                  <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                    للتواصل السريع والاستفسارات المباشرة مع إدارة المقرأة ومشرفي الحلقات:
                  </p>
                </div>
                
                <div className="space-y-3 text-xs">
                  {/* 1. إدارة المقرأة والاستفسارات العامة */}
                  <div className="p-3.5 bg-white rounded-2xl border border-slate-200 flex items-center justify-between shadow-2xs hover:border-[#046A38] transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#046A38] flex items-center justify-center shrink-0">
                        <MessageCircle className="w-5 h-5 text-[#25D366]" />
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">إدارة المقرأة (واتساب عام):</span>
                        <strong className="text-slate-900 font-mono text-sm" dir="ltr">+967 714 371 599</strong>
                      </div>
                    </div>
                    <a
                      href="https://wa.me/967714371599"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-transform active:scale-95"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>مراسلة فورية</span>
                    </a>
                  </div>

                  {/* 2. مشرف قسم الطلاب (بنين) */}
                  <div className="p-3 bg-white rounded-2xl border border-slate-200 flex items-center justify-between shadow-2xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">مشرف قسم الطلاب (بنين):</span>
                      <strong className="text-slate-800 font-mono text-xs sm:text-sm" dir="ltr">+967 714 371 599</strong>
                    </div>
                    <a
                      href="https://wa.me/967714371599"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-emerald-100 text-[#046A38] rounded-xl font-bold hover:bg-emerald-200 transition-colors text-[11px] flex items-center gap-1"
                    >
                      <MessageCircle className="w-3 h-3 text-[#25D366]" />
                      <span>واتساب البنين</span>
                    </a>
                  </div>

                  {/* 3. مشرفة قسم الطالبات (أخوات) */}
                  <div className="p-3 bg-white rounded-2xl border border-slate-200 flex items-center justify-between shadow-2xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">مشرفة قسم الطالبات (أخوات):</span>
                      <strong className="text-slate-800 font-mono text-xs sm:text-sm" dir="ltr">+967 711 607 573</strong>
                    </div>
                    <a
                      href="https://wa.me/967711607573"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-rose-100 text-rose-800 rounded-xl font-bold hover:bg-rose-200 transition-colors text-[11px] flex items-center gap-1"
                    >
                      <MessageCircle className="w-3 h-3 text-[#25D366]" />
                      <span>واتساب الأخوات</span>
                    </a>
                  </div>

                  {/* بطاقة توجيهية للقنوات الرسمية المعتمدة الموحدة لمنع التشتيت والتكرار */}
                  <div className="p-4 bg-emerald-950 text-white rounded-2xl border border-[#C5A059]/40 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#C5A059] animate-pulse"></span>
                      <h4 className="font-bold text-xs text-[#f7e8c6] font-serif">القنوات والمنصات الرسمية المعتمدة</h4>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                      حرصاً على تنظيم التواصل وعدم تشتيت الزائر، جُمعت القنوات الرسمية الست (قناة الواتساب، التيليجرام، الفيسبوك، الإنستجرام، اليوتيوب، والتيك توك) في التذييل الموحد أدناه.
                    </p>
                    <a
                      href="#official-channels"
                      onClick={(e) => {
                        e.preventDefault();
                        const el = document.getElementById('official-channels');
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="inline-flex items-center justify-center gap-1.5 w-full py-2 bg-[#046A38] hover:bg-[#03542c] text-[#f7e8c6] rounded-xl font-bold text-xs border border-[#C5A059]/40 transition-colors cursor-pointer"
                    >
                      <span>الانتقال لقسم القنوات المعتمدة الموحد</span>
                      <ArrowRight className="w-3.5 h-3.5 rotate-90" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* بطاقة موقع المقرأة على خرائط جوجل */}
            <div className="md:col-span-2">
              <MakraaLocationCard variant="card" />
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 8. سياسة الخصوصية (PRIVACY POLICY)                        */}
        {/* ======================================================== */}
        {activeTab === 'privacy' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5 animate-fade-in text-xs sm:text-sm text-slate-700 leading-relaxed">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-[#C5A059]">الأمان والسرية</span>
              <h2 className="text-xl font-bold font-serif text-[#046A38]">سياسة الخصوصية وحماية البيانات</h2>
              <span className="text-[11px] text-slate-400">آخر تحديث: 2026</span>
            </div>

            <p>
              نحن في <strong>مقرأة رحاب القرآن الإلكترونية</strong> نولي خصوصية طلابنا وطالباتنا ومعلمينا أقصى درجات العناية والالتزام الشرعي والأخلاقي والنظامي.
            </p>

            <h4 className="font-bold text-slate-900 text-sm font-serif">1. البيانات التي نجمعها:</h4>
            <ul className="list-disc list-inside space-y-1 text-xs pr-2">
              <li>البيانات الشخصية الأساسية: الاسم، رقم الهاتف، البلد، الفئة العمرية.</li>
              <li>البيانات الأكاديمية: سجلات الحضور، درجات التسميع، التسجيلات الصوتية المرسلة للتقييم.</li>
            </ul>

            <h4 className="font-bold text-slate-900 text-sm font-serif">2. خصوصية قسم الطالبات (أخوات):</h4>
            <p className="text-xs">
              تتمتع حلقات الطالبات بخصوصية مشددة، حيث لا يطّلع على التسجيلات الصوتية للطالبات أو بياناتهن إلا المعلمات والمشرفات المعتمدات، ولا تُشارك أي معلومات خارج نطاق الحلقة.
            </p>

            <h4 className="font-bold text-slate-900 text-sm font-serif">3. أمان الحسابات والبيانات:</h4>
            <p className="text-xs">
              تُحفظ كافة البيانات على قواعد بيانات Firebase السحابية المشفرة وفق أعلى معايير أمان Google Cloud مع تطبيق قواعد أمان صارمة (Firestore Security Rules) تمنع الوصول غير المصرح به.
            </p>
          </div>
        )}

        {/* ======================================================== */}
        {/* 9. الشروط والأحكام (TERMS & CONDITIONS)                   */}
        {/* ======================================================== */}
        {activeTab === 'terms' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5 animate-fade-in text-xs sm:text-sm text-slate-700 leading-relaxed">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-[#C5A059]">الضوابط والتعليمات</span>
              <h2 className="text-xl font-bold font-serif text-[#046A38]">الشروط والأحكام واللوائح التنظيمية</h2>
              <span className="text-[11px] text-slate-400">الإصدار التنظيمي لعام 2026</span>
            </div>

            <p>
              يُعد التسجيل في منصة مقرأة رحاب القرآن الإلكترونية إقراراً وموافقة من الطالب أو ولي أمره على الالتزام بالضوابط التالية:
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#F9F6F0] rounded-xl border border-slate-200">
                <strong className="text-[#046A38] block mb-1">أولاً: الانضباط بالحلقات والمواعيد:</strong>
                <span>يُشترط التزام الطالب بحضور الحلقات في الأوقات المحددة، وفي حال الغياب المتكرر بدون عذر مسبق للإدارة قد يتم تعليق الحساب لإتاحة المقعد لطلاب قائمة الانتظار.</span>
              </div>

              <div className="p-3 bg-[#F9F6F0] rounded-xl border border-slate-200">
                <strong className="text-[#046A38] block mb-1">ثانياً: الآداب القرآنية:</strong>
                <span>يجب على الطالب والمعلم التحلي بالآداب الشرعية لحملة كتاب الله تعالى، والتفرغ والإنصات التام أثناء انعقاد الحلقة.</span>
              </div>

              <div className="p-3 bg-[#F9F6F0] rounded-xl border border-slate-200">
                <strong className="text-[#046A38] block mb-1">ثالثاً: منح الإجازة القرآنية بالسند المتصل:</strong>
                <span>الإجازة بالسند المتصل لا تُمنح إلا بعد استيفاء المعايير العلمية الدقيقة واجتياز العرض الكامل على يد فضيلة الشيخ المجيز، وتُعد الإجازة وثيقة شخصية للطالب لا يجوز التنازل عنها أو تزويرها.</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
