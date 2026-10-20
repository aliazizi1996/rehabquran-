import React, { useState } from 'react';
import { 
  X, Video, Plus, Copy, Check, ExternalLink, 
  Sparkles, RefreshCw, AlertCircle, ShieldCheck, CheckCircle2 
} from 'lucide-react';
import { 
  signInWithGoogleMeet, 
  createGoogleMeetingSpace, 
  hasGoogleMeetToken, 
  GoogleMeetSpace 
} from '../services/googleMeetService';

interface GoogleMeetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMeetingUrl?: (url: string) => void;
  halqaTitle?: string;
}

export const GoogleMeetManagerModal: React.FC<GoogleMeetManagerModalProps> = ({
  isOpen,
  onClose,
  onSelectMeetingUrl,
  halqaTitle
}) => {
  const [isAuthenticatedWithGoogle, setIsAuthenticatedWithGoogle] = useState(hasGoogleMeetToken());
  const [googleUserEmail, setGoogleUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdSpace, setCreatedSpace] = useState<GoogleMeetSpace | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showConfirmCreateDialog, setShowConfirmCreateDialog] = useState(false);
  const [meetingTopic, setMeetingTopic] = useState(halqaTitle || 'حلقة قرآنية تفاعلية');

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await signInWithGoogleMeet();
      setIsAuthenticatedWithGoogle(true);
      setGoogleUserEmail(res.user.email);
    } catch (err: any) {
      setErrorMsg(err?.message || 'فشل تسجيل الدخول بحساب Google.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmCreateSpace = async () => {
    setShowConfirmCreateDialog(false);
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const space = await createGoogleMeetingSpace({ accessType: 'OPEN' });
      setCreatedSpace(space);
      if (onSelectMeetingUrl && space.meetingUri) {
        onSelectMeetingUrl(space.meetingUri);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'تعذر إنشاء قاعة Google Meet.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!createdSpace?.meetingUri) return;
    navigator.clipboard.writeText(createdSpace.meetingUri);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 font-sans text-right" dir="rtl">
      <div className="bg-white rounded-3xl border-2 border-[#C5A059] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col animate-scale-up">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#046A38] to-[#065A31] p-5 text-white flex items-center justify-between border-b border-[#C5A059]/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Video className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-base font-serif">قاعات Google Meet المباشرة</h3>
              <p className="text-xs text-emerald-100">ربط وإدارة جلسات التسميع والحلقات القرآنية</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/15 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!isAuthenticatedWithGoogle ? (
            <div className="space-y-4 text-center py-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                <Video className="w-7 h-7 text-[#046A38]" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-900 font-serif">تسجيل الدخول لربط Google Meet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  يتيح لك الربط إنشاء قاعات واجتماعات Google Meet رسمية معتمدة لحلقات المقرأة بنقرة واحدة ومشاركتها مع الطلاب.
                </p>
              </div>

              {/* Official Google Sign-in Button */}
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-3 px-5 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  <span>{isLoading ? 'جاري الاتصال بـ Google...' : 'تسجيل الدخول عبر Google للتحكم بـ Meet'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-[#F9F6F0] rounded-2xl border border-[#C5A059]/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#046A38]" />
                  <span className="text-xs font-bold text-[#046A38]">متصل بخدمة Google Meet بنجاح</span>
                </div>
                {googleUserEmail && (
                  <span className="text-[11px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                    {googleUserEmail}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">موضوع أو عنوان الحلقة المقترحة:</label>
                <input 
                  type="text"
                  value={meetingTopic}
                  onChange={(e) => setMeetingTopic(e.target.value)}
                  placeholder="مثال: حلقة الفجر لتصحيح التلاوة"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#046A38] focus:bg-white"
                />
              </div>

              {!createdSpace ? (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowConfirmCreateDialog(true)}
                    disabled={isLoading}
                    className="w-full py-3 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 border border-[#C5A059] active:scale-95"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-[#C5A059]" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-[#C5A059]" />
                    )}
                    <span>إنشاء قاعة Google Meet جديدة للحلقة الآن</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50/80 rounded-2xl border-2 border-emerald-300 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#046A38] flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>تم إنشاء قاعة Google Meet بنجاح!</span>
                    </span>
                    <span className="text-[10px] bg-white text-emerald-800 font-mono px-2 py-0.5 rounded border border-emerald-200">
                      كود: {createdSpace.meetingCode}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-emerald-200 font-mono text-xs text-slate-800 flex items-center justify-between gap-2 overflow-hidden" dir="ltr">
                    <span className="truncate">{createdSpace.meetingUri}</span>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1 font-sans"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'تم النسخ' : 'نسخ'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href={createdSpace.meetingUri}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 bg-[#046A38] hover:bg-[#03542c] text-white text-xs font-bold rounded-xl text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>دخول القاعة الآن</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectMeetingUrl && createdSpace.meetingUri) {
                          onSelectMeetingUrl(createdSpace.meetingUri);
                        }
                        onClose();
                      }}
                      className="py-2.5 bg-white border border-[#C5A059] hover:bg-[#C5A059]/10 text-[#046A38] text-xs font-bold rounded-xl text-center cursor-pointer transition-colors"
                    >
                      اعتماد الرابط للحلقة
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">مقرأة رحاب القرآن الإلكترونية • تكامل Google Meet الرسمي</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>

      {/* Confirmation Dialog per Workspace Integration guidelines */}
      {showConfirmCreateDialog && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border-2 border-[#C5A059] text-right" dir="rtl">
            <div className="flex items-center gap-3 text-[#046A38]">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Video className="w-5 h-5 text-[#046A38]" />
              </div>
              <h4 className="font-bold text-sm font-serif">تأكيد إنشاء مساحة Google Meet</h4>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              هل ترغب في إنشاء مساحة اجتماعات (Google Meet Space) جديدة لحلقة <strong>«{meetingTopic}»</strong> عبر حسابك في Google؟
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmCreateDialog(false)}
                className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmCreateSpace}
                className="px-4 py-2 bg-[#046A38] hover:bg-[#03542c] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                تأكيد الإنشاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
