/**
 * StudentTeacherChatView - نظام المحادثة الفورية بين الطالب والشيخ المعيّن
 * مقرأة رحاب القرآن الإلكترونية
 * تحديث فوري عبر Cloud Firestore مع إظهار وقت الرسالة وحالة القراءة ✓✓
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  MessageSquare, 
  Check, 
  CheckCheck, 
  Clock, 
  User, 
  RefreshCw, 
  ShieldCheck, 
  Sparkles, 
  GraduationCap,
  AlertCircle
} from 'lucide-react';
import { 
  ChatMessage, 
  subscribeToConversation, 
  sendChatMessage, 
  markMessagesAsRead,
  StudentHalqaAssignment 
} from '../../services/chatService';
import { AuthAccount } from '../../types';

interface StudentTeacherChatViewProps {
  currentAccount: AuthAccount;
  assignment: StudentHalqaAssignment;
  onRefreshAssignment?: () => void;
  variant?: 'full' | 'compact';
}

export const StudentTeacherChatView: React.FC<StudentTeacherChatViewProps> = ({
  currentAccount,
  assignment,
  onRefreshAssignment,
  variant = 'full'
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const teacherId = assignment.teacherId || 'teacher-default';
  const teacherName = assignment.teacherName || 'الشيخ المعلم';
  const halqaTitle = assignment.halqaTitle || 'حلقة القرآن الكريم';

  // 1. Subscribe to real-time conversation via Firestore
  useEffect(() => {
    if (!currentAccount.id || !teacherId) return;

    const unsubscribe = subscribeToConversation(
      currentAccount.id,
      teacherId,
      (liveMessages) => {
        setMessages(liveMessages);
        // Mark any unread messages from the teacher as read
        markMessagesAsRead(liveMessages, currentAccount.id);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentAccount.id, teacherId]);

  // 2. Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 3. Send message handler
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isSending) return;

    setIsSending(true);
    setSendError(null);

    try {
      const res = await sendChatMessage({
        senderId: currentAccount.id,
        senderName: currentAccount.name,
        senderRole: 'student',
        recipientId: teacherId,
        recipientName: teacherName,
        recipientRole: 'teacher',
        text,
        halqaId: assignment.halqaId,
        halqaTitle: assignment.halqaTitle,
      });

      if (res.success) {
        setInputText('');
        if (inputRef.current) {
          inputRef.current.focus();
        }
      } else {
        setSendError(res.error || 'تعذر إرسال الرسالة، يرجى المحاولة ثانية');
      }
    } catch (err: any) {
      setSendError('حدث خطأ أثناء الإرسال');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickSend = (text: string) => {
    setInputText(text);
  };

  const formatMessageTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return '';
    }
  };

  const unreadCount = messages.filter(
    (m) => m.recipientId === currentAccount.id && !m.read
  ).length;

  return (
    <div className={`bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden ${
      variant === 'compact' ? 'h-[500px]' : 'h-[620px]'
    }`}>
      {/* 1. Chat Header */}
      <div className="bg-[#046A38] text-white p-4 sm:px-6 flex items-center justify-between gap-3 border-b-2 border-[#C5A059]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
            <GraduationCap className="w-6 h-6 text-[#C5A059]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold font-serif text-sm sm:text-base text-white">
                {teacherName}
              </h3>
              <span className="text-[10px] bg-[#C5A059]/90 text-white font-bold px-2 py-0.5 rounded-full shadow-2xs">
                الشيخ المعيّن
              </span>
            </div>
            <p className="text-[11px] text-emerald-100 truncate max-w-xs sm:max-w-md">
              {halqaTitle} • موعد الحلقة: {assignment.halqaSchedule}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <span className="bg-amber-400 text-slate-950 text-xs font-bold px-2.5 py-0.5 rounded-full font-mono shadow-xs animate-pulse">
              {unreadCount} غير مقروءة
            </span>
          )}
          {onRefreshAssignment && (
            <button
              onClick={onRefreshAssignment}
              title="تحديث البيانات"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Chat Info Strip */}
      <div className="bg-[#F9F6F0] px-4 py-2 border-b border-[#C5A059]/30 text-[11px] text-slate-600 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-emerald-800 font-medium truncate">
          <ShieldCheck className="w-3.5 h-3.5 text-[#046A38] shrink-0" />
          <span>محادثة رسمية آمنة ومحفوظة في قاعدة بيانات المقرأة</span>
        </span>
        <span className="text-[10px] text-slate-500 shrink-0 font-mono">
          {messages.length} رسالة
        </span>
      </div>

      {/* 3. Messages List Area (Scrollable) */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3 bg-gradient-to-b from-[#F9F6F0]/40 to-white">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-[#046A38]/10 text-[#046A38] flex items-center justify-center border border-[#046A38]/20">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm font-serif">
                لا توجد رسائل سابقة مع الشيخ
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                يمكنك بدء المحادثة الآن لطرح استفسارات التجويد، متابعة ورد التسميع، أو الاستئذان عن موعد الحلقة.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-md pt-2">
              <button
                type="button"
                onClick={() => handleQuickSend('السلام عليكم ورحمة الله وبركاته فضيلة الشيخ، كيف حالكم؟')}
                className="text-[11px] bg-white hover:bg-emerald-50 text-slate-700 hover:text-[#046A38] px-3 py-1.5 rounded-xl border border-slate-200 transition-all cursor-pointer shadow-2xs"
              >
                السلام عليكم ورحمة الله وبركاته
              </button>
              <button
                type="button"
                onClick={() => handleQuickSend('فضيلة الشيخ، هل تم مراجعة واجب التسميع الأخير؟')}
                className="text-[11px] bg-white hover:bg-emerald-50 text-slate-700 hover:text-[#046A38] px-3 py-1.5 rounded-xl border border-slate-200 transition-all cursor-pointer shadow-2xs"
              >
                استفسار عن واجب التسميع
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentAccount.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 sm:px-4 sm:py-3 shadow-xs space-y-1 relative text-right ${
                    isMe
                      ? 'bg-[#046A38] text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                  }`}
                >
                  {/* Sender label for other party */}
                  {!isMe && (
                    <span className="text-[10px] font-bold text-[#046A38] block font-serif">
                      {msg.senderName} ({msg.senderRole === 'teacher' ? 'الشيخ' : 'المشرف'})
                    </span>
                  )}

                  {/* Message body */}
                  <p className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap break-words">
                    {msg.text}
                  </p>

                  {/* Footer: Time & Read status checkmarks */}
                  <div
                    className={`flex items-center gap-1.5 text-[10px] pt-1 ${
                      isMe ? 'text-emerald-200 justify-end' : 'text-slate-400 justify-start'
                    }`}
                  >
                    <span className="font-mono">{formatMessageTime(msg.createdAt)}</span>

                    {/* Status checkmarks (only on sent messages) */}
                    {isMe && (
                      <span title={msg.read ? 'تمت قراءة الرسالة من قِبل الشيخ' : 'تم الإرسال'}>
                        {msg.read ? (
                          <CheckCheck className="w-3.5 h-3.5 text-[#C5A059]" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-emerald-200" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 4. Quick Suggested Messages */}
      <div className="bg-[#F9F6F0]/60 px-4 py-2 border-t border-slate-200/60 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
        <span className="text-[11px] text-slate-500 shrink-0 font-bold">عبارات سريعة:</span>
        <button
          type="button"
          onClick={() => handleQuickSend('السلام عليكم ورحمة الله وبركاته فضيلة الشيخ.')}
          className="shrink-0 text-[11px] bg-white hover:bg-emerald-50 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-all cursor-pointer"
        >
          السلام عليكم
        </button>
        <button
          type="button"
          onClick={() => handleQuickSend('أنهيت حفظ الورد المخصص لليوم بفضل الله تعالى.')}
          className="shrink-0 text-[11px] bg-white hover:bg-emerald-50 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-all cursor-pointer"
        >
          أنهيت الورد اليوم
        </button>
        <button
          type="button"
          onClick={() => handleQuickSend('جزاكم الله خيراً ونفع بكم فضيلة الشيخ.')}
          className="shrink-0 text-[11px] bg-white hover:bg-emerald-50 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-all cursor-pointer"
        >
          جزاكم الله خيراً
        </button>
      </div>

      {/* 5. Error Banner if any */}
      {sendError && (
        <div className="bg-rose-50 px-4 py-2 border-t border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{sendError}</span>
        </div>
      )}

      {/* 6. Message Input Footer (Mobile-friendly) */}
      <form onSubmit={handleSendMessage} className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-end gap-2">
        <textarea
          ref={inputRef}
          rows={1}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`اكتب رسالتك لفضيلة الشيخ ${teacherName}... (اضغط Enter للإرسال)`}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#046A38] focus:bg-white resize-none max-h-28 transition-colors"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="p-2.5 sm:px-5 sm:py-3 bg-[#046A38] hover:bg-[#03542c] disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-sm border border-[#C5A059]"
        >
          {isSending ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">إرسال</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
