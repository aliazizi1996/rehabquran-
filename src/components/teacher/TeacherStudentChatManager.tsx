/**
 * TeacherStudentChatManager - إدارة محادثات الطلاب لفضيلة المعلم / الشيخ
 * مقرأة رحاب القرآن الإلكترونية
 * تحديث فوري عبر Cloud Firestore مع إمكانية التبديل بين طلاب الحلقة
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  MessageSquare, 
  Check, 
  CheckCheck, 
  Users, 
  User, 
  Search, 
  RefreshCw, 
  BookOpen, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { 
  ChatMessage, 
  subscribeToConversation, 
  sendChatMessage, 
  markMessagesAsRead 
} from '../../services/chatService';
import { AuthAccount } from '../../types';

interface StudentInfo {
  id: string;
  name: string;
  halqaTitle?: string;
  memorization?: string;
  section?: 'male' | 'female';
}

interface TeacherStudentChatManagerProps {
  currentAccount: AuthAccount;
  students: StudentInfo[];
}

export const TeacherStudentChatManager: React.FC<TeacherStudentChatManagerProps> = ({
  currentAccount,
  students
}) => {
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(students[0] || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Set default student if none selected
  useEffect(() => {
    if (!selectedStudent && students.length > 0) {
      setSelectedStudent(students[0]);
    }
  }, [students, selectedStudent]);

  // Subscribe to real-time conversation with the selected student
  useEffect(() => {
    if (!currentAccount.id || !selectedStudent?.id) return;

    const unsubscribe = subscribeToConversation(
      currentAccount.id,
      selectedStudent.id,
      (liveMessages) => {
        setMessages(liveMessages);
        // Mark any messages sent by the student as read by this teacher
        markMessagesAsRead(liveMessages, currentAccount.id);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentAccount.id, selectedStudent?.id]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || !selectedStudent || isSending) return;

    setIsSending(true);
    try {
      await sendChatMessage({
        senderId: currentAccount.id,
        senderName: currentAccount.name,
        senderRole: 'teacher',
        recipientId: selectedStudent.id,
        recipientName: selectedStudent.name,
        recipientRole: 'student',
        text,
        halqaTitle: selectedStudent.halqaTitle || currentAccount.assignedHalqaTitle,
      });

      setInputText('');
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } catch (err) {
      console.error('Failed to send message from teacher:', err);
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

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.halqaTitle && s.halqaTitle.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row h-[660px]">
      {/* 1. Students List Sidebar */}
      <div className="w-full md:w-72 bg-slate-50 border-b md:border-b-0 md:border-l border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold font-serif text-[#046A38] text-sm flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>طلاب الحلقة ({students.length})</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">محادثات مباشرة</span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث عن طالب..."
              className="w-full bg-white border border-slate-200 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#046A38]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredStudents.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              لا يوجد طلاب مطابقون
            </div>
          ) : (
            filteredStudents.map((std) => {
              const isSelected = selectedStudent?.id === std.id;
              return (
                <button
                  key={std.id}
                  onClick={() => setSelectedStudent(std)}
                  className={`w-full text-right p-3 transition-colors cursor-pointer flex items-center gap-3 ${
                    isSelected ? 'bg-emerald-100/60 border-r-4 border-[#046A38]' : 'hover:bg-white'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold font-serif text-xs shrink-0 ${
                    isSelected ? 'bg-[#046A38] text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {std.name.charAt(0)}
                  </div>
                  <div className="overflow-hidden flex-1">
                    <span className="block font-bold text-xs text-slate-900 truncate">{std.name}</span>
                    <span className="block text-[10px] text-slate-500 truncate">{std.halqaTitle || 'حلقة الفجر'}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Active Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedStudent ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-[#F9F6F0] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#046A38] text-white flex items-center justify-center font-serif font-bold text-sm shrink-0">
                  {selectedStudent.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm font-serif">
                    الطالب: {selectedStudent.name}
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    {selectedStudent.halqaTitle || 'حلقة القرآن الكريم'} • الحفظ: {selectedStudent.memorization || 'منتظم'}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3 bg-gradient-to-b from-[#F9F6F0]/40 to-white">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-xs text-slate-500">
                  <MessageSquare className="w-8 h-8 text-slate-300" />
                  <p>لا توجد رسائل سابقة مع الطالب {selectedStudent.name}.</p>
                  <p className="text-[11px] text-slate-400">يمكنك إرسال توجيه قرآني أو ملاحظة تلاوة مباشرة للطالب.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isTeacher = msg.senderId === currentAccount.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isTeacher ? 'items-end' : 'items-start'} animate-fade-in`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 sm:px-4 sm:py-2.5 shadow-xs space-y-1 relative text-right ${
                          isTeacher
                            ? 'bg-[#046A38] text-white rounded-br-xs'
                            : 'bg-slate-100 text-slate-800 rounded-bl-xs'
                        }`}
                      >
                        {!isTeacher && (
                          <span className="text-[10px] font-bold text-[#046A38] block font-serif">
                            {msg.senderName} (طالب)
                          </span>
                        )}
                        <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {msg.text}
                        </p>
                        <div
                          className={`flex items-center gap-1.5 text-[10px] pt-0.5 ${
                            isTeacher ? 'text-emerald-200 justify-end' : 'text-slate-400 justify-start'
                          }`}
                        >
                          <span className="font-mono">{formatMessageTime(msg.createdAt)}</span>
                          {isTeacher && (
                            <span title={msg.read ? 'تمت القراءة من الطالب' : 'تم الإرسال'}>
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

            {/* Quick Greeting Pills for Sheikh */}
            <div className="bg-[#F9F6F0]/60 px-4 py-2 border-t border-slate-200/60 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
              <span className="text-[11px] text-slate-500 shrink-0 font-bold">عبارات سريعة:</span>
              <button
                type="button"
                onClick={() => setInputText('وعليكم السلام ورحمة الله وبركاته يا بني، بارك الله فيك.')}
                className="shrink-0 text-[11px] bg-white hover:bg-emerald-50 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 cursor-pointer"
              >
                وعليكم السلام
              </button>
              <button
                type="button"
                onClick={() => setInputText('أحسنت في تلاوة اليوم، استمر على هذا الإتقان ومراعاة المدود.')}
                className="shrink-0 text-[11px] bg-white hover:bg-emerald-50 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 cursor-pointer"
              >
                ثناء على التلاوة
              </button>
              <button
                type="button"
                onClick={() => setInputText('يرجى مراجعة الآيات المقررة جيداً قبل موعد حلقة الغد.')}
                className="shrink-0 text-[11px] bg-white hover:bg-emerald-50 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 cursor-pointer"
              >
                تذكير بالحفظ
              </button>
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-end gap-2">
              <textarea
                ref={inputRef}
                rows={1}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`اكتب رسالتك وتوجيهك للطالب ${selectedStudent.name}...`}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#046A38] focus:bg-white resize-none max-h-28 transition-colors"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="p-2.5 sm:px-5 sm:py-3 bg-[#046A38] hover:bg-[#03542c] disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm border border-[#C5A059]"
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
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
            اختر طالباً من القائمة لبدء المحادثة
          </div>
        )}
      </div>
    </div>
  );
};
