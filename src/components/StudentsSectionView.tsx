import React, { useState } from 'react';
import { 
  Users, Sparkles, MessageCircle, Clock, Award, CheckCircle2, 
  ShieldCheck, PhoneCall, Phone, ExternalLink, Calendar, BookOpen, 
  Check, Copy, GraduationCap, ChevronLeft, UserCheck, Video, PlayCircle, Instagram, Youtube
} from 'lucide-react';
import { OfficialLogo } from './OfficialLogo';
import { BankAccountsCard } from './BankAccountsCard';
import { MaleStudentRegistrationModal } from './MaleStudentRegistrationModal';
import { Halqa, UserProfile } from '../types';

interface StudentsSectionViewProps {
  user: UserProfile;
  maleHalawat: Halqa[];
  onToggleEnroll: (halqaId: string) => void;
  onJoinLiveRoom: (halqa: Halqa) => void;
  onOpenRegistration?: (type?: 'male' | 'female' | 'teacher') => void;
  onOpenMaleRegistration?: () => void;
  onOpenRegisteredStudents?: () => void;
}

export const StudentsSectionView: React.FC<StudentsSectionViewProps> = ({
  user,
  maleHalawat,
  onToggleEnroll,
  onJoinLiveRoom,
  onOpenRegistration,
  onOpenMaleRegistration,
  onOpenRegisteredStudents,
}) => {
  const WHATSAPP_NUMBER = '967714371599';
  const WHATSAPP_DISPLAY = '+967 714 371 599';
  const CALL_PHONE = '0967713801916';
  const CALL_DISPLAY = '0967713801916';
  const GOOGLE_MEET_URL = 'https://meet.google.com/fid-iqwm-zxm';

  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedMeetUrl, setCopiedMeetUrl] = useState(false);
  const [isMaleRegModalOpen, setIsMaleRegModalOpen] = useState(false);

  // Find the primary featured halqa
  const featuredHalqa = maleHalawat.find((h) => h.id === 'h-m1' || h.isMaleSection) || maleHalawat[0];

  const getWhatsAppLink = (customMessage?: string) => {
    const defaultMsg = `السلام عليكم ورحمة الله وبركاته،\nأرغب بالتسجيل في حلقة قسم الطلاب بمقرأة رحاب القرآن الإلكترونية - موعد الفجر اليومي (05:00 ص - 06:30 ص).`;
    const message = customMessage || defaultMsg;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(CALL_PHONE);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleCopyMeet = () => {
    navigator.clipboard.writeText(GOOGLE_MEET_URL);
    setCopiedMeetUrl(true);
    setTimeout(() => setCopiedMeetUrl(false), 2000);
  };

  const handleOpenRegistration = () => {
    if (onOpenMaleRegistration) {
      onOpenMaleRegistration();
    } else {
      setIsMaleRegModalOpen(true);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Official Students Section Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0c2419] via-[#103022] to-[#071710] p-5 sm:p-6 border-2 border-emerald-500/80 shadow-2xl relative overflow-hidden">
        
        {/* Soft Ambient Backgrounds */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 space-y-4">
          
          {/* Top Tag & Official Logo Badge */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <OfficialLogo size="md" variant="icon" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 rounded-full inline-block">
                    مقرأة رحاب القرآن الإلكترونية • قسم الطلاب
                  </span>
                  <span className="text-[11px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/50 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-amber-400" />
                    قسم الطلاب (بنين)
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-serif mt-1">
                  قسم الطلاب القرآني (بنين)
                </h1>
              </div>
            </div>

            {/* Official Status Badge */}
            <div className="bg-[#091a12]/90 border border-emerald-500/50 rounded-2xl px-3.5 py-2 flex items-center gap-2.5 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-extrabold flex items-center justify-center text-sm shadow-md">
                ط
              </div>
              <div className="text-right">
                <span className="text-[10px] text-emerald-300 block font-semibold">حلقة الفجر المعتمدة:</span>
                <span className="text-xs font-bold text-white block">قسم الطلاب (بنين)</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-normal max-w-2xl">
            بيئة قرآنية تعليمية متكاملة لطلاب العلم والراغبين في حفظ كتاب الله تعالى وضبط مخارج الحروف وتعلّم أحكام التجويد، بحلقات فجرية منتظمة ومتابعة فردية مباشرة وصولاً إلى الإتقان والإجازة بالسند المتصل.
          </p>

          {/* Quick Registration & WhatsApp Contact Strip */}
          <div className="pt-2 border-t border-emerald-800/60 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>التواصل والتسجيل المعتمد:</span>
              <span className="font-semibold text-emerald-300">واتساب: {WHATSAPP_DISPLAY} | اتصال: {CALL_DISPLAY}</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* WhatsApp direct */}
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/60"
              >
                <MessageCircle className="w-4 h-4" />
                <span>واتساب: {WHATSAPP_DISPLAY}</span>
              </a>

              {/* Direct call button */}
              <a
                href={`tel:${CALL_PHONE}`}
                className="py-2 px-3.5 rounded-xl bg-[#081f14] hover:bg-[#0e2c1c] border border-emerald-600/70 text-emerald-200 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>اتصال: {CALL_DISPLAY}</span>
              </a>

              {/* Instagram link */}
              <a
                href="https://www.instagram.com/rehabquran47884517?stkn=cmwzY2Jtd2Rsbnc4"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 rounded-xl bg-gradient-to-r from-purple-950/60 to-pink-950/60 hover:from-purple-900/80 hover:to-pink-900/80 border border-pink-700/60 text-pink-200 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                title="حساب إنستجرام الرسمي للمقرأة"
              >
                <Instagram className="w-4 h-4 text-pink-400" />
                <span>إنستجرام</span>
              </a>

              {/* YouTube channel */}
              <a
                href="https://www.youtube.com/@RehabQuran-s5m"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-700/60 text-red-200 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                title="قناة اليوتيوب الرسمية للمقرأة"
              >
                <Youtube className="w-4 h-4 text-red-400" />
                <span>اليوتيوب</span>
              </a>

              {/* TikTok link */}
              <a
                href="https://vm.tiktok.com/ZS9UHb6rGL5uW-lZi3G/"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-teal-500/50 text-teal-200 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                title="حساب تيك توك الرسمي للمقرأة"
              >
                <span className="text-xs">🎵</span>
                <span>تيك توك</span>
              </a>

              {/* Dedicated Registration Form Button */}
              <button
                type="button"
                onClick={handleOpenRegistration}
                className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                title="تعبئة استمارة التسجيل المستقلة الخاصة بالطلاب"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>استمارة تسجيل الطلاب المستقلة</span>
              </button>

              {/* Student Registry Button */}
              {onOpenRegisteredStudents && (
                <button
                  type="button"
                  onClick={onOpenRegisteredStudents}
                  className="py-2 px-3 rounded-xl bg-[#091811] hover:bg-emerald-900/40 border border-emerald-700/60 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="عرض سجل الطلاب المسجلين رسمياً"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>سجل الطلاب</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Featured Main Halqa Card */}
      {featuredHalqa && (
        <div className="rounded-2xl bg-gradient-to-br from-[#0e271c] via-[#123626] to-[#0a1f16] border-2 border-amber-500/70 p-5 shadow-xl space-y-4 relative overflow-hidden">
          
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-500/50 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              حلقة قسم الطلاب المعتمدة (بنين)
            </span>

            <span className="text-xs text-emerald-300 bg-emerald-950/90 px-3 py-1 rounded-full border border-emerald-700/50 font-semibold">
              المقاعد المتاحة: {featuredHalqa.capacity - featuredHalqa.enrolledCount} مقعد
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-white font-serif">
              {featuredHalqa.title}
            </h2>
            <p className="text-xs text-emerald-100/90 leading-relaxed">
              {featuredHalqa.description}
            </p>
          </div>

          {/* Timing, Days, and Meet Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="p-3 rounded-xl bg-[#081b12] border border-emerald-800/80 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>الموعد اليومي للحلقة</span>
              </div>
              <p className="text-xs font-bold text-white">
                من الساعة 05:00 ص إلى 06:30 ص
              </p>
              <span className="text-[10px] text-slate-400 block">فترة الفجر بتوقيت مكة المكرمة</span>
            </div>

            <div className="p-3 rounded-xl bg-[#081b12] border border-emerald-800/80 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-bold">
                <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>أيام الانعقاد</span>
              </div>
              <p className="text-xs font-bold text-emerald-200">
                جميع أيام الأسبوع ما عدا الجمعة
              </p>
              <span className="text-[10px] text-slate-400 block">السبت • الأحد • الإثنين • الثلاثاء • الأربعاء • الخميس</span>
            </div>

            <div className="p-3 rounded-xl bg-[#081b12] border border-emerald-800/80 space-y-1">
              <div className="flex items-center gap-1.5 text-sky-300 text-xs font-bold">
                <Video className="w-4 h-4 text-sky-400 shrink-0" />
                <span>رابط الحضور المباشر</span>
              </div>
              <p className="text-xs font-bold text-sky-200">
                Google Meet مباشر
              </p>
              <span className="text-[10px] text-slate-400 block truncate" title={GOOGLE_MEET_URL}>
                {GOOGLE_MEET_URL}
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 border-t border-emerald-800/60 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-300 font-medium">القسم المعتمد:</span>
              <span className="text-xs font-bold text-white bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-800">
                قسم الطلاب (بنين)
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Prominent Official WhatsApp Group Join Button */}
              <a
                href={featuredHalqa?.whatsappGroupUrl || "https://chat.whatsapp.com/GjZ8rehabQuranMale"}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/80 border border-emerald-400/40 transition-all transform hover:scale-[1.02] cursor-pointer"
                title="الانضمام الفوري لمجموعة الواتساب المعتمدة لقسم الطلاب"
              >
                <MessageCircle className="w-4 h-4 fill-white text-emerald-900" />
                <span>الانضمام لمجموعة الواتساب المعتمدة</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

              {/* Google Meet Button */}
              <a
                href={GOOGLE_MEET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                title="الانضمام المباشر للقاعة عبر Google Meet"
              >
                <Video className="w-4 h-4" />
                <span>Google Meet مباشر</span>
                <ExternalLink className="w-3 h-3 opacity-80" />
              </a>

              {/* Copy Meet Link Button */}
              <button
                type="button"
                onClick={handleCopyMeet}
                className="p-2.5 rounded-xl bg-[#091e14] hover:bg-[#103322] border border-emerald-700/60 text-slate-300 hover:text-white text-xs cursor-pointer transition-colors"
                title="نسخ رابط Google Meet"
              >
                {copiedMeetUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>

              {/* Independent Registration Button */}
              <button
                type="button"
                onClick={handleOpenRegistration}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>نموذج التسجيل</span>
              </button>

              {/* In-app Virtual Room Button */}
              <button
                type="button"
                onClick={() => onJoinLiveRoom(featuredHalqa)}
                className="px-3.5 py-2.5 rounded-xl bg-[#082215] hover:bg-emerald-900/60 border border-emerald-500/50 text-emerald-200 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <PlayCircle className="w-4 h-4 text-amber-400" />
                <span>القاعة التفاعلية</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Highlights / Features Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#091a13] border border-emerald-800/80 space-y-1">
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>حفظ ومراجعة وتثبيت</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            مناهج تدريجية تناسب المبتدئين والحفّاظ مع متابعة يومية للورد القرآني صباحاً.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#091a13] border border-emerald-800/80 space-y-1">
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
            <Award className="w-4 h-4 text-amber-400" />
            <span>إجازة بالسند المتصل</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            جلسات إقراء وتسميع فردي للخاتمين لنيل الإجازة برواية حفص عن عاصم بالسند.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#091a13] border border-emerald-800/80 space-y-1">
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>حلقة فجرية يومية منتظمة</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            من الساعة 5:00 ص إلى 6:30 ص لجميع أيام الأسبوع عدا الجمعة عبر Google Meet.
          </p>
        </div>
      </div>

      {/* Male Halawat Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>الحلقات المتاحة بقسم الطلاب ({maleHalawat.length} حلقات)</span>
          </h3>
          <span className="text-xs text-slate-400">فصول افتراضية ومباشرة</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {maleHalawat.map((halqa) => {
            const isEnrolled = user.enrolledHalqaIds.includes(halqa.id);
            const isFeatured = halqa.id === 'h-m1';

            return (
              <div
                key={halqa.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                  isFeatured
                    ? 'bg-[#0b2418] border-amber-500/70 shadow-md'
                    : 'bg-[#0a1e15] border-emerald-800/80 hover:border-emerald-600'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-white leading-snug">
                      {halqa.title}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 font-medium ${
                      isFeatured
                        ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                        : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    }`}>
                      {halqa.scheduleTime}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-2">
                    {halqa.description}
                  </p>

                  <div className="text-xs text-emerald-300/90 font-medium flex items-center gap-1.5 mb-2">
                    <span>المعلم والمقرئ:</span>
                    <strong className="text-white font-bold">{halqa.sheikhName}</strong>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {halqa.days.map((d) => (
                      <span key={d} className="text-[10px] bg-[#06150e] text-slate-400 px-1.5 py-0.5 rounded">
                        {d}
                      </span>
                    ))}
                  </div>

                  {/* Prominent WhatsApp Group Button for each Halqa */}
                  <div className="mt-3">
                    <a
                      href={halqa.whatsappGroupUrl || "https://chat.whatsapp.com/GjZ8rehabQuranMale"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#0d3420] to-[#12452a] hover:from-emerald-700 hover:to-teal-700 border border-emerald-500/50 text-emerald-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer group"
                      title={halqa.whatsappGroupTitle || "الانضمام لمجموعة الواتساب الخاصة بالحلقة"}
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                      <span>الانضمام لمجموعة واتساب الحلقة</span>
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-900/60 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleEnroll(halqa.id)}
                    className={`flex-1 py-1.5 px-3 rounded-xl font-bold text-xs cursor-pointer transition-colors ${
                      isEnrolled
                        ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-700'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {isEnrolled ? '✓ مسجل بالحلقة' : '+ التحاق بالحلقة'}
                  </button>

                  {halqa.meetUrl && (
                    <a
                      href={halqa.meetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-2.5 rounded-xl bg-[#081811] hover:bg-amber-950/40 border border-amber-500/50 text-amber-300 font-bold text-xs flex items-center gap-1 transition-all"
                      title="Google Meet"
                    >
                      <Video className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden sm:inline">Meet</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => onJoinLiveRoom(halqa)}
                    className="py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer flex items-center gap-1 transition-colors"
                  >
                    <span>دخول الحلقة</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Official Bank Accounts Card */}
      <BankAccountsCard />

      {/* Independent Male Student Registration Modal */}
      <MaleStudentRegistrationModal
        isOpen={isMaleRegModalOpen}
        onClose={() => setIsMaleRegModalOpen(false)}
        onJoinMeet={() => featuredHalqa && onJoinLiveRoom(featuredHalqa)}
      />
    </div>
  );
};
