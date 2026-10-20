/**
 * صفحة «حلقتي» الموحدة والمتكاملة للطالب
 * 1. اسم الحلقة والشيخ المعيّن
 * 2. الجدول الأسبوعي التفصيلي
 * 3. رابط Google Meet (يُفعّل قبل 10 دقائق)
 * 4. رابط مجموعة WhatsApp المعتمد
 */

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Clock, Calendar, Video, ExternalLink, 
  MessageSquare, CheckCircle2, ShieldCheck, Copy, Check,
  AlertCircle, Sparkles, User, Users, RefreshCw, Award, Volume2
} from 'lucide-react';
import { StudentHalqaAssignment, HalqaAnnouncement } from '../../services/chatService';
import { calculateNextHalqaTime, HalqaNextTimeInfo } from '../../utils/halqaCountdown';
import { WebRtcLiveHalqaBroadcast } from '../live/WebRtcLiveHalqaBroadcast';
import { detectHalqaClassification } from '../../data/halqaClassifications';

interface StudentHalqaViewProps {
  assignment: StudentHalqaAssignment;
  announcements?: HalqaAnnouncement[];
  onOpenChat?: () => void;
  studentId?: string;
  studentName?: string;
  studentSection?: 'male' | 'female' | 'both';
}

export const StudentHalqaView: React.FC<StudentHalqaViewProps> = ({
  assignment,
  announcements = [],
  onOpenChat,
  studentId = 'std-current',
  studentName = 'طالب المقرأة',
  studentSection = 'male',
}) => {
  const [isLiveWebRtcOpen, setIsLiveWebRtcOpen] = useState(false);
  const [countdown, setCountdown] = useState<HalqaNextTimeInfo>(() => 
    calculateNextHalqaTime(assignment.halqaSchedule)
  );
  const [copiedWhatsapp, setCopiedWhatsapp] = useState(false);
  const [copiedMeet, setCopiedMeet] = useState(false);

  // تحديث العداد كل ثانية
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(calculateNextHalqaTime(assignment.halqaSchedule));
    }, 1000);
    return () => clearInterval(timer);
  }, [assignment.halqaSchedule]);

  const hasWhatsapp = Boolean(
    assignment.whatsappGroupUrl &&
    assignment.whatsappGroupUrl.trim().length > 0 &&
    (assignment.whatsappGroupUrl.startsWith('http') || assignment.whatsappGroupUrl.includes('whatsapp.com'))
  );

  const meetUrl = assignment.googleMeetUrl || 'https://meet.google.com/new';

  const handleCopyWhatsapp = () => {
    if (assignment.whatsappGroupUrl) {
      navigator.clipboard.writeText(assignment.whatsappGroupUrl);
      setCopiedWhatsapp(true);
      setTimeout(() => setCopiedWhatsapp(false), 2000);
    }
  };

  const handleCopyMeet = () => {
    navigator.clipboard.writeText(meetUrl);
    setCopiedMeet(true);
    setTimeout(() => setCopiedMeet(false), 2000);
  };

  // Schedule Days Array
  const isFemale = assignment.halqaId?.includes('f') || assignment.teacherName?.includes('أم');
  const scheduleDays = isFemale ? [
    { day: 'الأحد', time: '4:00 م - 5:30 م', active: true, title: 'حفظ وتثبيت' },
    { day: 'الإثنين', time: 'راحة ومراجعة ذاتية', active: false, title: 'مراجعة فردية' },
    { day: 'الثلاثاء', time: '4:00 م - 5:30 م', active: true, title: 'عرض وتسميع' },
    { day: 'الأربعاء', time: 'راحة ومراجعة ذاتية', active: false, title: 'مراجعة فردية' },
    { day: 'الخميس', time: '4:00 م - 5:30 م', active: true, title: 'مراجعة أسبوعية' },
    { day: 'الجمعة', time: 'إجازة أسبوعية', active: false, title: 'ورد التلاوة' },
    { day: 'السبت', time: 'راحة ومراجعة ذاتية', active: false, title: 'مراجعة فردية' },
  ] : [
    { day: 'السبت', time: '5:30 ص - 7:00 ص', active: true, title: 'حفظ الورد الجديد' },
    { day: 'الأحد', time: 'راحة ومراجعة ذاتية', active: false, title: 'مراجعة فردية' },
    { day: 'الإثنين', time: '5:30 ص - 7:00 ص', active: true, title: 'عرض وإتقان وتجويد' },
    { day: 'الثلاثاء', time: 'راحة ومراجعة ذاتية', active: false, title: 'مراجعة فردية' },
    { day: 'الأربعاء', time: '5:30 ص - 7:00 ص', active: true, title: 'مراجعة وتثبيت الأجزاء' },
    { day: 'الخميس', time: 'راحة ومراجعة ذاتية', active: false, title: 'مراجعة فردية' },
    { day: 'الجمعة', time: 'إجازة أسبوعية', active: false, title: 'سورة الكهف والورد' },
  ];

  const classification = detectHalqaClassification({
    title: assignment.halqaTitle,
    halqaType: assignment.halqaType,
    classification: (assignment as any).classification,
  });

  return (
    <div className="space-y-6 animate-fade-in text-right" dir="rtl">
      
      {/* 1. ترويسة الحلقة والشيخ المعين */}
      <div className="bg-gradient-to-r from-[#046A38] via-[#05572e] to-[#046A38] rounded-3xl p-6 sm:p-8 text-white border-2 border-[#C5A059] shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* شارة التصنيف المعتمد (حفظ / مراجعة / إجازة / تصحيح تلاوة / أشبال أطفال) */}
            <span className={`text-[11px] font-bold px-3 py-0.5 rounded-full border ${classification.badgeClasses} flex items-center gap-1 shadow-2xs`}>
              {classification.id === 'hifz' && <BookOpen className="w-3.5 h-3.5 text-emerald-700" />}
              {classification.id === 'morajaah' && <RefreshCw className="w-3.5 h-3.5 text-sky-700" />}
              {classification.id === 'ijazah' && <Award className="w-3.5 h-3.5 text-amber-700" />}
              {classification.id === 'tashih' && <Volume2 className="w-3.5 h-3.5 text-teal-700" />}
              {classification.id === 'ashbal' && <Sparkles className="w-3.5 h-3.5 text-purple-700" />}
              <span>{classification.label}</span>
            </span>

            <span className="text-[11px] font-bold bg-[#C5A059] text-white px-3 py-0.5 rounded-full shadow-2xs">
              {assignment.halqaType || classification.defaultHalqaType}
            </span>
            <span className="text-xs text-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>طالب مقيد ومنتظم</span>
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold font-serif text-white">
            {assignment.halqaTitle || 'حلقة القرآن الكريم والإتقان'}
          </h2>

          <div className="flex flex-wrap items-center gap-4 text-xs text-emerald-100">
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/20">
              <User className="w-4 h-4 text-[#C5A059]" />
              <span>فضيلة الشيخ: <strong className="text-white">{assignment.teacherName}</strong></span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/20 font-mono" dir="ltr">
              <Clock className="w-4 h-4 text-[#C5A059]" />
              <span>{assignment.halqaSchedule || '5:30 ص - 7:00 ص'}</span>
            </div>
          </div>
        </div>

        {onOpenChat && (
          <button
            onClick={onOpenChat}
            className="px-5 py-2.5 bg-white text-[#046A38] hover:bg-[#F9F6F0] rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer border border-[#C5A059]"
          >
            <MessageSquare className="w-4 h-4 text-[#046A38]" />
            <span>محادثة الشيخ المباشرة</span>
          </button>
        )}
      </div>

      {/* 2. بطاقة البث القرآني المباشر الداخلي عبر WebRTC (المعتمد والأعلى خصوصية) */}
      <div className="p-6 sm:p-7 rounded-3xl border-2 border-[#C5A059] bg-gradient-to-br from-[#046A38] via-[#05572e] to-[#023e20] text-white shadow-xl relative overflow-hidden">
        {/* زخرفة خلفية */}
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-[#C5A059]/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white font-bold text-xs shadow-xs animate-pulse">
                <span className="w-2 h-2 rounded-full bg-white"></span>
                <span>بث مباشر داخلي (WebRTC)</span>
              </span>
              <span className="text-[11px] font-bold text-amber-200 bg-white/10 px-3 py-0.5 rounded-full border border-white/20">
                مشفر بتقنية P2P وخاص تماماً
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold font-serif text-white">
              قاعة التسميع والبث المباشر مع فضيلة الشيخ
            </h3>

            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
              تواصل صوتي ومرئي نقي ومباشر داخل المقرأة، يتيح لك الاستماع لتوجيهات الشيخ، ومتابعة آيات المصحف الشريف المتزامن، ورفع اليد لطلب التسميع ونيل الإجازة بالسند المتصل.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-emerald-200">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
                <span>خصوصية تامة</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4 text-[#C5A059]" />
                <span>مصحف متزامن حي</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-[#C5A059]" />
                <span>تقييم تجويدي لحظي</span>
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsLiveWebRtcOpen(true)}
            className="w-full md:w-auto px-7 py-3.5 bg-gradient-to-r from-[#C5A059] to-[#d4af37] hover:from-[#b08d47] hover:to-[#c5a059] text-slate-900 rounded-2xl text-sm font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2.5 shrink-0 cursor-pointer border border-amber-200"
          >
            <Video className="w-5 h-5 text-slate-900" />
            <span>دخول قاعة البث المباشر الآن ↗</span>
          </button>
        </div>
      </div>

      {/* 3. بطاقة Google Meet مع شرط التفعيل (يُفعّل قبل 10 دقائق) */}
      <div className={`p-6 sm:p-7 rounded-3xl border-2 transition-all shadow-sm ${
        countdown.isWithin10Minutes 
          ? 'bg-gradient-to-br from-emerald-50 via-white to-teal-50 border-emerald-500 shadow-md ring-4 ring-emerald-500/10'
          : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                countdown.isWithin10Minutes ? 'bg-[#046A38] text-white animate-pulse' : 'bg-slate-100 text-slate-500'
              }`}>
                <Video className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base sm:text-lg font-serif text-slate-900">
                    رابط الجلسة المباشرة (Google Meet)
                  </h3>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    countdown.isWithin10Minutes
                      ? 'bg-emerald-600 text-white animate-bounce'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    {countdown.isWithin10Minutes ? 'متاح الآن للدخول ⚡' : 'يُفعّل قبل 10 دقائق'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  {countdown.isWithin10Minutes 
                    ? 'حان موعد الحلقة! فضيلة الشيخ بانتظاركم داخل الجلسة المباشرة للتسميع.'
                    : `موعد الحلقة القادمة: ${countdown.formattedTarget}. يتم تفعيل زر الدخول تلقائياً قبل بدء الحلقة بـ 10 دقائق.`
                  }
                </p>
              </div>
            </div>

            {/* Live Countdown Display */}
            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs text-slate-500">الوقت المتبقي حتى الجلسة:</span>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F9F6F0] rounded-xl border border-[#C5A059]/40 font-mono text-xs font-bold text-[#046A38]">
                {countdown.days > 0 && <span>{countdown.days} يوم :</span>}
                <span>{countdown.hours.toString().padStart(2, '0')} س :</span>
                <span>{countdown.minutes.toString().padStart(2, '0')} د :</span>
                <span>{countdown.seconds.toString().padStart(2, '0')} ث</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {countdown.isWithin10Minutes ? (
              <a
                href={meetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3 bg-[#046A38] hover:bg-[#03542c] text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-[#C5A059] animate-pulse"
              >
                <Video className="w-4 h-4 text-[#C5A059]" />
                <span>الانضمام إلى حلقة Google Meet الآن ↗</span>
              </a>
            ) : (
              <button
                disabled
                className="w-full sm:w-auto px-6 py-3 bg-slate-100 text-slate-400 rounded-2xl text-xs font-bold cursor-not-allowed border border-slate-200 flex items-center justify-center gap-2"
                title="سيتم تفعيل الرابط تلقائياً قبل الحلقة بـ 10 دقائق"
              >
                <Clock className="w-4 h-4 text-slate-400" />
                <span>يُفعّل قبل 10 دقائق من الموعد</span>
              </button>
            )}

            <button
              onClick={handleCopyMeet}
              className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-colors cursor-pointer"
              title="نسخ رابط Google Meet"
            >
              {copiedMeet ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* 3. بطاقة رابط مجموعة WhatsApp المعتمد */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-sm">
              <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-base font-serif text-slate-900">
                مجموعة الحلقة المعتمدة على WhatsApp
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                تواصل مباشر مع الشيخ وزملائك في الحلقة لتلقي إعلانات ومواعيد الحلقات اليومية.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasWhatsapp ? (
              <>
                <a
                  href={assignment.whatsappGroupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-[#25D366] hover:bg-[#1fb355] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <span>الانضمام لمجموعة WhatsApp ↗</span>
                </a>
                <button
                  onClick={handleCopyWhatsapp}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                  title="نسخ الرابط"
                >
                  {copiedWhatsapp ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </>
            ) : (
              <div className="text-xs text-slate-500 bg-[#F9F6F0] px-4 py-2 rounded-xl border border-slate-200">
                سيتم تزويدك بالرابط المباشر من الشيخ قريباً
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. الجدول الأسبوعي للحلقة */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#C5A059]" />
            <h3 className="font-bold text-base font-serif text-slate-900">الجدول الأسبوعي المعتمد للحلقة</h3>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
            3 جلسات أسبوعياً (4.5 ساعة تعليمية)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 pt-2">
          {scheduleDays.map((item, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border text-center space-y-1.5 transition-all ${
                item.active
                  ? 'bg-emerald-50/70 border-emerald-300 text-[#046A38] shadow-2xs font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <span className="text-xs block font-bold">{item.day}</span>
              <span className={`text-[11px] block ${item.active ? 'text-[#046A38]' : 'text-slate-500'}`}>
                {item.title}
              </span>
              <span className="text-[10px] font-mono block opacity-80" dir="ltr">
                {item.time}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. إعلانات وتوجيهات الشيخ */}
      {announcements.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-base font-serif text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#C5A059]" />
            <span>إعلانات وتوجيهات فضيلة الشيخ</span>
          </h3>

          <div className="space-y-3">
            {announcements.map((ann) => (
              <div key={ann.id} className="p-4 bg-[#F9F6F0] rounded-2xl border border-[#C5A059]/40 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="text-sm font-serif text-[#046A38]">{ann.title}</strong>
                  <span className="text-[11px] text-slate-400">{ann.createdAt}</span>
                </div>
                <p className="text-slate-700 leading-relaxed">{ann.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. نافذة البث المباشر WebRtcLiveHalqaBroadcast بكامل الشاشة */}
      {isLiveWebRtcOpen && (
        <WebRtcLiveHalqaBroadcast
          roomId={assignment.halqaId || 'halqa-live-room'}
          halqaTitle={assignment.halqaTitle || 'حلقة القرآن الكريم والإتقان'}
          halqaId={assignment.halqaId}
          userRole="student"
          userId={studentId}
          userName={studentName}
          section={studentSection}
          teacherName={assignment.teacherName}
          riwayah={assignment.halqaType || 'حفص عن عاصم'}
          onClose={() => setIsLiveWebRtcOpen(false)}
        />
      )}

    </div>
  );
};
