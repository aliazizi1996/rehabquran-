import React, { useState } from 'react';
import { 
  Sparkles, MessageCircle, Heart, Users, Clock, Award, 
  CheckCircle2, ShieldCheck, PhoneCall, ExternalLink, Calendar,
  BookOpen, ChevronLeft, Check, Copy, Video, PlayCircle, UserCheck
} from 'lucide-react';
import { OfficialLogo } from './OfficialLogo';
import { BankAccountsCard } from './BankAccountsCard';
import { Halqa, UserProfile } from '../types';

interface FemaleSectionViewProps {
  user: UserProfile;
  femaleHalawat: Halqa[];
  onToggleEnroll: (halqaId: string) => void;
  onJoinLiveRoom: (halqa: Halqa) => void;
  onOpenRegistration?: (type?: 'male' | 'female') => void;
  onOpenRegisteredStudents?: () => void;
}

export const FemaleSectionView: React.FC<FemaleSectionViewProps> = ({
  user,
  femaleHalawat,
  onToggleEnroll,
  onJoinLiveRoom,
  onOpenRegistration,
  onOpenRegisteredStudents,
}) => {
  const WHATSAPP_NUMBER = '967711607573';
  const WHATSAPP_DISPLAY = '+967 711 607 573';
  const SUPERVISOR_NAME = 'مشرفة قسم الطالبات';
  const GOOGLE_MEET_URL = 'https://meet.google.com/zdz-zcmn-ium';

  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedMeetLink, setCopiedMeetLink] = useState(false);

  // Generate WhatsApp Direct Link
  const getWhatsAppLink = (customMessage?: string) => {
    const defaultMsg = `السلام عليكم ورحمة الله وبركاته،\nأرغب بالاستفسار والتسجيل في حلقات قسم الطالبات بمقرأة رحاب القرآن الإلكترونية.`;
    const message = customMessage || defaultMsg;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(WHATSAPP_DISPLAY);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2500);
  };

  const handleCopyMeetLink = () => {
    navigator.clipboard.writeText(GOOGLE_MEET_URL);
    setCopiedMeetLink(true);
    setTimeout(() => setCopiedMeetLink(false), 2500);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Official Female Section Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-[#1b2b22] via-[#143023] to-[#0c1f16] p-5 sm:p-6 border-2 border-emerald-600/70 shadow-xl relative overflow-hidden">
        
        {/* Soft Decorative Ambient Background */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 space-y-4">
          
          {/* Top Tag & Official Logo Badge */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <OfficialLogo size="md" />
              <div>
                <span className="text-[11px] font-bold text-amber-300 bg-amber-950/70 border border-amber-500/40 px-2.5 py-0.5 rounded-full inline-block">
                  مقرأة رحاب القرآن الإلكترونية • قسم الطالبات
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-0.5">
                  قسم الطالبات القرآني
                </h1>
              </div>
            </div>

            {/* Supervisor Badge */}
            <div className="bg-[#091a12]/90 border border-emerald-500/50 rounded-2xl px-3 py-2 flex items-center gap-2 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-emerald-500 text-slate-950 font-extrabold flex items-center justify-center text-xs">
                ل
              </div>
              <div className="text-right">
                <span className="text-[10px] text-emerald-300 block font-semibold">المشرفة العامة على القسم:</span>
                <span className="text-xs font-bold text-white block">{SUPERVISOR_NAME}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-normal max-w-2xl">
            بيئة قرآنية إيمانية خاصة بالأخوات تعنى بضبط الحفظ، وتصحيح التلاوة، وتعلّم أحكام التجويد ومخارج الحروف في أجواء من الخصوصية والوقار تحت إشراف نخبة من المعلمات الفاضلات.
          </p>

          {/* WhatsApp Direct Action Bar */}
          <div className="pt-2 border-t border-emerald-800/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-200">
              <div className="w-8 h-8 rounded-xl bg-emerald-900/60 border border-emerald-700/60 flex items-center justify-center text-emerald-300 shrink-0">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">قناة التواصل والتسجيل الرسمية:</span>
                <span className="font-semibold text-emerald-300 text-sm tracking-wide inline-block">
                  واتساب قسم الطالبات المباشر
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Registration Form Button */}
              {onOpenRegistration && (
                <button
                  type="button"
                  onClick={() => onOpenRegistration('female')}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                  <span>نموذج تسجيل طالبة</span>
                </button>
              )}

              {/* View Registered Students Button */}
              {onOpenRegisteredStudents && (
                <button
                  type="button"
                  onClick={onOpenRegisteredStudents}
                  className="px-3 py-2 rounded-xl bg-[#091811] hover:bg-amber-950/40 border border-amber-500/50 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  title="عرض سجل الطالبات المسجلات رسمياً"
                >
                  <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>سجل الطالبات المسجلات</span>
                </button>
              )}

              {/* Direct WhatsApp Message Button */}
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-slate-950 text-emerald-400" />
                <span>مراسلة إدارة القسم عبر الواتساب</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 
        ========================================================================
        SCHEDULE & GOOGLE MEET DIRECT ACCESS BANNER (توقيت 4:00 عصراً إلى 6:00 مساءً)
        ========================================================================
      */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0d2a1d] via-[#123625] to-[#0a2016] p-4 sm:p-5 border-2 border-amber-500/70 shadow-xl relative overflow-hidden">
        {/* Soft Glow */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
              <Video className="w-6 h-6 text-amber-300" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-white font-serif">
                  جدول حلقة قسم الطالبات (بث مباشر عبر Google Meet)
                </h3>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                  قسم الطالبات (أخوات)
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-bold animate-pulse">
                  مباشر يومياً
                </span>
              </div>

              {/* Exact time & days from request */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-200 pt-0.5">
                <span className="flex items-center gap-1.5 bg-[#06170f] px-2.5 py-1 rounded-lg border border-amber-500/30 font-semibold text-amber-300">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>الموعد اليومي: من الساعة 4:00 عصراً إلى 6:00 مساءً</span>
                </span>

                <span className="flex items-center gap-1.5 bg-[#06170f] px-2.5 py-1 rounded-lg border border-emerald-700/40 font-semibold text-emerald-300">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>الأيام: جميع أيام الأسبوع ما عدا يوم الجمعة</span>
                </span>
              </div>

              <p className="text-[11px] text-slate-400 pt-0.5">
                يمكن للطالبات الانضمام مباشرة بالصوت عبر الرابط المعتمد لقاعة Google Meet للتسميع وتصحيح التلاوة.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            {/* Direct Official WhatsApp Group Join Link */}
            <a
              href="https://chat.whatsapp.com/L7KhrehabQuranFemale"
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/80 border border-emerald-400/40 transition-all cursor-pointer select-none"
              title="الانضمام الفوري لمجموعة الواتساب المعتمدة لقسم الطالبات"
            >
              <MessageCircle className="w-4 h-4 fill-white text-emerald-900" />
              <span>الانضمام لقروب الواتساب المعتمد</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>

            {/* Direct Google Meet Join Link */}
            <a
              href={GOOGLE_MEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 md:flex-initial py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-950/70 transition-all cursor-pointer select-none"
              title="الانضمام إلى قاعة Google Meet الآن"
            >
              <Video className="w-4 h-4 text-slate-950" />
              <span>الانضمام عبر Google Meet</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>

            {/* Copy Link Button */}
            <button
              type="button"
              onClick={handleCopyMeetLink}
              className="py-2.5 px-3 rounded-xl bg-[#06160e] hover:bg-[#0d261a] border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="نسخ رابط Google Meet"
            >
              {copiedMeetLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">نسخ الرابط</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Key Features for Female Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#0e2118] border border-emerald-900/60 flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-900/40 border border-emerald-800 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white mb-0.5">خصوصية تامة 100%</h4>
            <p className="text-[11px] text-slate-300 leading-snug">
              غرف صوتية مغلقة خاصة بالأخوات بإشراف كادر تعليمي نسائي معتمد.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0e2118] border border-emerald-900/60 flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-950/40 border border-amber-800 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white mb-0.5">أوقات صباحية ومسائية</h4>
            <p className="text-[11px] text-slate-300 leading-snug">
              جداول مرنة تراعي ظروف الطالبات وربات البيوت والموظفات.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0e2118] border border-emerald-900/60 flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-950/40 border border-teal-800 flex items-center justify-center text-teal-400 shrink-0 mt-0.5">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white mb-0.5">إجازات وشهادات إتقان</h4>
            <p className="text-[11px] text-slate-300 leading-snug">
              شهادات معتمدة وتأهيل للإجازات بالسند المتصل برواية حفص عن عاصم.
            </p>
          </div>
        </div>
      </div>

      {/* Female Study Circles Directory */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-amber-400" />
            حلقات قسم الطالبات المتاحة للتسجيل
          </h3>
          <span className="text-xs text-emerald-400 font-medium">
            حلقات الأخوات والبنات
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {femaleHalawat.map((halqa) => {
            const isEnrolled = user.enrolledHalqaIds.includes(halqa.id);
            const whatsappCustomMsg = `السلام عليكم ورحمة الله وبركاته،\nأرغب بالتسجيل في (${halqa.title}) بمقرأة رحاب القرآن الإلكترونية.\nالاسم:\nالمستوى:`;

            return (
              <div
                key={halqa.id}
                className="rounded-2xl p-4 bg-[#0e231a] border border-emerald-800/60 shadow-sm hover:border-emerald-600/70 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Category */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                      قسم الطالبات (أخوات)
                    </span>
                    <span className="text-[11px] text-amber-300 font-semibold flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      حلقة معتمدة
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="font-bold text-base text-white mb-1.5 leading-snug">
                    {halqa.title}
                  </h4>

                  {/* Description */}
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    {halqa.description}
                  </p>

                  {/* Time & Schedule info */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 mb-3">
                    <div className="flex items-center gap-1.5 bg-[#091710] px-2.5 py-1.5 rounded-lg border border-emerald-950">
                      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{halqa.scheduleTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#091710] px-2.5 py-1.5 rounded-lg border border-emerald-950">
                      <Award className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{halqa.targetJuzOrSurah}</span>
                    </div>
                  </div>

                  {/* Capacity */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span>المقاعد الشاغرة</span>
                      <span className="font-semibold text-emerald-300">
                        {halqa.enrolledCount} / {halqa.capacity} طالبة
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-emerald-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                        style={{ width: `${Math.min(100, (halqa.enrolledCount / halqa.capacity) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Direct Registration Actions via WhatsApp & Google Meet */}
                <div className="pt-2 border-t border-emerald-900/50 flex flex-col gap-2">
                  {/* Prominent WhatsApp Group Join Button for this Halqa */}
                  <a
                    href={halqa.whatsappGroupUrl || "https://chat.whatsapp.com/L7KhrehabQuranFemale"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md border border-emerald-400/40 transition-all cursor-pointer group"
                    title={halqa.whatsappGroupTitle || "الانضمام لمجموعة الواتساب المعتمدة لهذه الحلقة"}
                  >
                    <MessageCircle className="w-4 h-4 fill-white text-emerald-950 group-hover:scale-110 transition-transform" />
                    <span>الانضمام لمجموعة واتساب الحلقة المعتمدة</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </a>

                  {/* Google Meet Direct Join Button */}
                  <a
                    href={halqa.meetUrl || GOOGLE_MEET_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 rounded-xl bg-[#091f14] hover:bg-[#103322] border border-amber-500/60 text-amber-300 hover:text-amber-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                  >
                    <Video className="w-4 h-4 text-amber-400" />
                    <span>الانضمام المباشر عبر Google Meet</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>

                  <a
                    href={getWhatsAppLink(whatsappCustomMsg)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 rounded-xl bg-[#071d13] hover:bg-[#0c2e1f] border border-emerald-700/60 text-emerald-200 hover:text-white text-xs font-medium flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    <span>استفسار خاص مع المعلمة المشرفة</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleEnroll(halqa.id)}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        isEnrolled
                          ? 'bg-emerald-900/60 text-emerald-200 border border-emerald-700/60'
                          : 'bg-[#0a1811] text-slate-300 border border-emerald-900 hover:border-emerald-700'
                      }`}
                    >
                      {isEnrolled ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          أنتِ مسجلة في القائمة
                        </>
                      ) : (
                        <span>حفظ في قائمتي</span>
                      )}
                    </button>

                    {halqa.isLiveNow && (
                      <button
                        onClick={() => onJoinLiveRoom(halqa)}
                        className="py-1.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer"
                      >
                        دخول الحلقة
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Official WhatsApp Floating / Bottom Card */}
      <div className="p-4 rounded-2xl bg-[#091710] border border-emerald-800/60 text-center space-y-2">
        <p className="text-xs text-slate-300 font-medium">
          هل لديكِ أي استفسار خاص بحلقات الأخوات والتوقيت المناسب؟
        </p>
        <p className="text-xs text-emerald-300">
          تتواجد <strong className="text-white font-bold">{SUPERVISOR_NAME}</strong> للرد على استفسارات الطالبات وتحديد المستوى عبر الواتساب على مدار اليوم.
        </p>
        <div className="pt-1">
          <a
            href={getWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>تواصل مباشرة عبر واتساب قسم الطالبات</span>
          </a>
        </div>
      </div>

      {/* Official Academy Bank Accounts Card */}
      <BankAccountsCard />
    </div>
  );
};
