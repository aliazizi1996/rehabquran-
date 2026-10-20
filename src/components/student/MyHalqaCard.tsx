/**
 * MyHalqaCard - قسم «حلقتي» في لوحة الطالب
 * مقرأة رحاب القرآن الإلكترونية
 * يعرض اسم الشيخ أو المعلم المعيّن، واسم الحلقة، وموعدها، ورابط مجموعة واتساب المعتمد من المشرف
 */

import React from 'react';
import { 
  Users, 
  Clock, 
  MessageSquare, 
  ExternalLink, 
  Sparkles, 
  AlertCircle, 
  Calendar, 
  CheckCircle2, 
  BookOpen, 
  RefreshCw, 
  Award, 
  Volume2 
} from 'lucide-react';
import { StudentHalqaAssignment } from '../../services/chatService';
import { detectHalqaClassification } from '../../data/halqaClassifications';

interface MyHalqaCardProps {
  assignment: StudentHalqaAssignment;
  onOpenChat: () => void;
  onOpenSchedule?: () => void;
}

export const MyHalqaCard: React.FC<MyHalqaCardProps> = ({
  assignment,
  onOpenChat,
  onOpenSchedule
}) => {
  const hasWhatsappGroup = Boolean(
    assignment.whatsappGroupUrl && 
    assignment.whatsappGroupUrl.trim().length > 0 &&
    (assignment.whatsappGroupUrl.startsWith('http://') || 
     assignment.whatsappGroupUrl.startsWith('https://') ||
     assignment.whatsappGroupUrl.includes('chat.whatsapp.com'))
  );

  const classification = detectHalqaClassification({
    title: assignment.halqaTitle,
    halqaType: assignment.halqaType,
    classification: (assignment as any).classification,
  });

  return (
    <div className="bg-white rounded-3xl border-2 border-[#C5A059]/40 shadow-sm overflow-hidden animate-fade-in">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#046A38] via-[#05572e] to-[#046A38] p-5 sm:p-6 text-white relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              {/* شارة التصنيف المعتمد */}
              <span className={`text-[11px] font-bold px-3 py-0.5 rounded-full border ${classification.badgeClasses} flex items-center gap-1 shadow-2xs`}>
                {classification.id === 'hifz' && <BookOpen className="w-3.5 h-3.5 text-emerald-700" />}
                {classification.id === 'morajaah' && <RefreshCw className="w-3.5 h-3.5 text-sky-700" />}
                {classification.id === 'ijazah' && <Award className="w-3.5 h-3.5 text-amber-700" />}
                {classification.id === 'tashih' && <Volume2 className="w-3.5 h-3.5 text-teal-700" />}
                {classification.id === 'ashbal' && <Sparkles className="w-3.5 h-3.5 text-purple-700" />}
                <span>{classification.label}</span>
              </span>

              <span className="text-[11px] font-bold bg-[#C5A059] text-white px-3 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                {assignment.halqaType || classification.defaultHalqaType}
              </span>
              <span className="text-xs text-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>طالب منتظم</span>
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-serif text-white">
              قسم «حلقتي» والشيخ المعيّن
            </h3>
            <p className="text-xs text-emerald-100/90 leading-relaxed max-w-xl">
              حلقات التحفيظ والتسميع المعتمدة في مقرأة رحاب القرآن الإلكترونية.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenChat}
            className="px-4 py-2.5 bg-white text-[#046A38] hover:bg-emerald-50 rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2 shrink-0 border border-[#C5A059]"
          >
            <MessageSquare className="w-4 h-4 text-[#046A38]" />
            <span>محادثة الشيخ المباشرة</span>
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="p-5 sm:p-6 space-y-5">
        {/* 1. رابط الحلقة المباشرة (Google Meet) */}
        <div className="pt-1">
          {assignment.googleMeetUrl && assignment.googleMeetUrl.trim().length > 0 ? (
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#046A38] text-white flex items-center justify-center shrink-0 shadow-sm relative">
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white animate-pulse"></span>
                  <ExternalLink className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs sm:text-sm text-emerald-950 font-serif">
                      حلقة البث المباشر (Google Meet)
                    </h4>
                    <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                      مباشر الآن
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed mt-0.5">
                    فضيلة الشيخ أتاح رابط Google Meet للحلقة. انقر للدخول إلى جلسة التسميع المباشرة.
                  </p>
                </div>
              </div>

              <a
                href={assignment.googleMeetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer border border-[#C5A059]"
              >
                <span>الانضمام إلى حلقة Google Meet ↗</span>
              </a>
            </div>
          ) : (
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-200/80 text-slate-500 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 text-xs block">
                    جلسة البث المباشر (Google Meet):
                  </span>
                  <span className="text-[11px] text-slate-500">
                    بانتظار نشر فضيلة الشيخ لرابط الجلسة المباشرة قبل موعد الحلقة ({assignment.halqaSchedule || 'الموعد المحدد'}).
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. الشيخ والمعلم المعيّن */}
          <div className="p-4 bg-[#F9F6F0] rounded-2xl border border-[#C5A059]/30 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 block">الشيخ المعيّن للطالب</span>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#046A38] text-white flex items-center justify-center font-serif font-bold text-sm shrink-0">
                {assignment.teacherName?.charAt(0) || 'ش'}
              </div>
              <div className="overflow-hidden">
                <h4 className="font-bold text-sm text-[#046A38] font-serif truncate">
                  {assignment.teacherName || 'الشيخ عبد الرحمن'}
                </h4>
                <span className="text-[11px] text-slate-500 block truncate">
                  مجاز بالقراءات ومسؤول تسميع حلقتك
                </span>
              </div>
            </div>
          </div>

          {/* 2. اسم الحلقة القرآنية */}
          <div className="p-4 bg-[#F9F6F0] rounded-2xl border border-[#C5A059]/30 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 block">اسم الحلقة القرآنية</span>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C5A059] text-white flex items-center justify-center font-bold shrink-0">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="overflow-hidden">
                <h4 className="font-bold text-sm text-slate-900 font-serif truncate">
                  {assignment.halqaTitle || 'حلقة قسم الطلاب (الفجر)'}
                </h4>
                <span className="text-[11px] text-emerald-800 font-medium block truncate">
                  رواية حفص عن عاصم بالسند المتصل
                </span>
              </div>
            </div>
          </div>

          {/* 3. موعد وتوقيت الحلقة */}
          <div className="p-4 bg-[#F9F6F0] rounded-2xl border border-[#C5A059]/30 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 block">موعد الحلقة والتسميع</span>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#046A38] flex items-center justify-center font-bold shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 font-mono truncate" dir="ltr">
                  {assignment.halqaSchedule || '5:30 ص - 7:00 ص'}
                </h4>
                <span className="text-[11px] text-slate-500 block truncate">
                  توقيت يومي منتظم مع الشيخ
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. خيار «مجموعة الحلقة على واتساب» - التزام صارم بعدم عرض رابط وهمي */}
        <div className="pt-2">
          {hasWhatsappGroup ? (
            <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-sm">
                  {/* WhatsApp SVG Icon */}
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-emerald-950">
                    مجموعة الحلقة المعتمدة على واتساب
                  </h4>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    انضم لمجموعة حلقتك على واتساب لتلقي إعلانات ومواعيد التسميع اليومية مباشرة من فضيلة الشيخ.
                  </p>
                </div>
              </div>

              <a
                href={assignment.whatsappGroupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                <span>الانضمام إلى مجموعة الحلقة ↗</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200/80 text-slate-500 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-800 text-xs">
                    مجموعة واتساب الخاصة بالحلقة:
                  </h5>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    لم يقم المشرف بإضافة رابط مجموعة الواتساب لهذه الحلقة بعد. يمكنك التواصل مباشرة مع الشيخ عبر المحادثة الداخلية.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenChat}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 self-start sm:self-center"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#046A38]" />
                <span>مراسلة الشيخ داخلياً</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
