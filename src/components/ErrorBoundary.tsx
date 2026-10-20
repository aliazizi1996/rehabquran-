import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, Home, RotateCcw, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });

    const isChunkError =
      error?.name === 'TypeError' &&
      (error?.message?.includes('Failed to fetch dynamically imported module') ||
        error?.message?.includes('dynamically imported'));

    if (isChunkError && typeof window !== 'undefined') {
      const reloadKey = 'eb_chunk_reload_' + window.location.pathname;
      const lastReload = sessionStorage.getItem(reloadKey);
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem(reloadKey, now.toString());
        window.location.reload();
      }
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = window.location.pathname;
  };

  private handleResetCache = () => {
    try {
      // Clear local storage keys related to app session and caches
      const keysToRemove = [
        'rehab_auth_session_active',
        'rehab_auth_account',
        'rehab_quran_academy_db_v2',
        'rehab_quran_daily_recitations_prod_v1',
        'rehab_quran_student_certificates_prod_v1',
        'rehab_quran_attendance_prod_v1',
        'rehab_quran_in_app_notifications'
      ];
      keysToRemove.forEach((k) => {
        try {
          localStorage.removeItem(k);
        } catch {
          // ignore
        }
      });
    } catch (e) {
      console.error('Failed to clear cache', e);
    }
    window.location.href = window.location.pathname;
  };

  private toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="min-h-screen bg-gradient-to-b from-slate-900 via-[#062419] to-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 select-none font-sans"
        >
          <div className="max-w-md w-full bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/80 backdrop-blur-md text-center space-y-5">
            {/* Header Icon */}
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-amber-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            {/* Title & Branding */}
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-amber-400 tracking-wider">مقرأة رحاب القرآن الإلكترونية</p>
              <h1 className="text-xl sm:text-2xl font-black text-white">حدث خطأ غير متوقع أثناء العرض</h1>
              <p className="text-xs text-slate-300 leading-relaxed">
                تم رصد المشكلة بنجاح ومنع توقف الشاشة. يرجى اختيار أحد الخيارات التالية للمتابعة:
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                إعادة تحميل الصفحة الآن
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Home className="w-4 h-4" />
                العودة إلى الواجهة الرئيسية
              </button>

              <button
                onClick={this.handleResetCache}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                إصلاح الذاكرة المؤقتة وإعادة التشغيل النظيف
              </button>
            </div>

            {/* Technical Details Accordion */}
            {this.state.error && (
              <div className="pt-2 border-t border-slate-800 text-right">
                <button
                  onClick={this.toggleDetails}
                  className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer py-1"
                >
                  <span>تفاصيل الخطأ التقني</span>
                  {this.state.showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {this.state.showDetails && (
                  <div className="mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-rose-300 overflow-x-auto text-left ltr max-h-48 scrollbar-thin">
                    <p className="font-bold">{this.state.error.name}: {this.state.error.message}</p>
                    {this.state.error.stack && (
                      <pre className="text-[10px] text-slate-400 mt-2 whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
