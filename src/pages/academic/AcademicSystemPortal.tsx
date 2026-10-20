/**
 * البوابة الشاملة للنظام الأكاديمي لتعليم القرآن الكريم
 * مقرأة رحاب القرآن الإلكترونية
 * تجمع الواجهات الخمس المطلوبة:
 * 1. خطة الحفظ (Memorization Plan)
 * 2. خطة المراجعة (Revision Plan)
 * 3. جلسة التسميع (Live Recitation Session)
 * 4. تقييم الجلسة (Session Evaluation)
 * 5. التقرير الأكاديمي (Academic Report)
 * + إعدادات الإدارة الأكاديمية (Academic Settings)
 */

import React, { useState } from 'react';
import { 
  BookOpen, RefreshCw, Mic, Award, BarChart3, Settings, 
  ArrowRight, Shield, Sparkles, CheckCircle2, ChevronLeft, LogOut, Headphones 
} from 'lucide-react';
import { AuthAccount } from '../../types';
import { OfficialLogo } from '../../components/OfficialLogo';
import { MemorizationPlanManager } from '../../components/academic/MemorizationPlanManager';
import { RevisionPlanManager } from '../../components/academic/RevisionPlanManager';
import { LiveRecitationSession } from '../../components/academic/LiveRecitationSession';
import { SessionEvaluationModal } from '../../components/academic/SessionEvaluationModal';
import { AcademicReportView } from '../../components/academic/AcademicReportView';
import { AcademicSettingsManager } from '../../components/academic/AcademicSettingsManager';
import { AcademicPlanGoal, AcademicRecitationSession } from '../../services/academicService';

export type AcademicTab = 
  | 'memorization_plan'
  | 'revision_plan'
  | 'recitation_session'
  | 'session_evaluation'
  | 'academic_report'
  | 'academic_settings';

interface AcademicSystemPortalProps {
  currentAccount: AuthAccount;
  initialTab?: AcademicTab;
  onBackToDashboard?: () => void;
  onLogout?: () => void;
  onOpenQuranAudio?: () => void;
}

export const AcademicSystemPortal: React.FC<AcademicSystemPortalProps> = ({
  currentAccount,
  initialTab = 'memorization_plan',
  onBackToDashboard,
  onLogout,
  onOpenQuranAudio
}) => {
  const [activeTab, setActiveTab] = useState<AcademicTab>(initialTab);
  const [activePlanForRecitation, setActivePlanForRecitation] = useState<AcademicPlanGoal | null>(null);
  const [selectedEvaluationSession, setSelectedEvaluationSession] = useState<AcademicRecitationSession | null>(null);

  const isTeacherOrAdmin = 
    currentAccount.role === 'teacher' || 
    currentAccount.role === 'system_admin' || 
    currentAccount.role === 'supervisor';

  const handleStartRecitationFromPlan = (plan: AcademicPlanGoal) => {
    setActivePlanForRecitation(plan);
    setActiveTab('recitation_session');
  };

  const handleSessionSaved = (session: AcademicRecitationSession) => {
    setSelectedEvaluationSession(session);
    setActiveTab('academic_report');
  };

  return (
    <div className="min-h-screen bg-[#F9F6F0] text-[#2C3531] font-sans text-right flex flex-col" dir="rtl">
      {/* 1. Top Brand Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-[#C5A059]/40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <OfficialLogo size="md" showText={false} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold font-serif text-[#046A38]">
                  النظام الأكاديمي لتعليم القرآن الكريم
                </h1>
                <span className="text-[11px] font-bold bg-[#C5A059]/20 text-[#046A38] px-2.5 py-0.5 rounded-full border border-[#C5A059]/40">
                  الهوية الرسمية 2026
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans">
                المقرأة الإلكترونية • بالسند المتصل إلى رسول الله ﷺ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="px-3.5 py-1.5 bg-[#F9F6F0] hover:bg-emerald-50 text-[#046A38] rounded-xl text-xs font-bold border border-[#C5A059]/40 cursor-pointer transition-all flex items-center gap-1.5"
                title="العودة إلى اللوحة السابقة"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>العودة للوحة الرئيسية</span>
              </button>
            )}

            {onOpenQuranAudio && (
              <button
                onClick={onOpenQuranAudio}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-[#F9F6F0] hover:bg-emerald-50 text-[#046A38] rounded-xl text-xs font-bold border border-[#C5A059]/40 cursor-pointer"
                title="المصحف المعلم والمجود"
              >
                <Headphones className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>المصحف المعلم</span>
              </button>
            )}

            {onLogout && (
              <button
                onClick={onLogout}
                className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-xs font-bold text-slate-600 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                title="تسجيل الخروج"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">خروج</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Navigation Tabs (The 5 Core Interfaces + Settings) */}
        <div className="bg-[#046A38] text-white px-4 border-t border-[#C5A059]/40 overflow-x-auto scrollbar-none">
          <div className="max-w-7xl mx-auto flex items-center gap-1 py-1.5 min-w-max">
            {[
              { id: 'memorization_plan', label: 'خطة الحفظ', icon: BookOpen },
              { id: 'revision_plan', label: 'خطة المراجعة', icon: RefreshCw },
              { id: 'recitation_session', label: 'جلسة التسميع', icon: Mic },
              { id: 'academic_report', label: 'التقرير الأكاديمي', icon: BarChart3 },
              ...(isTeacherOrAdmin ? [{ id: 'academic_settings', label: 'إعدادات الإدارة', icon: Settings }] : [])
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as AcademicTab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-[#C5A059] text-slate-950 shadow-md font-black' 
                      : 'hover:bg-white/10 text-emerald-100 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* 3. Main Content Area */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 flex-1">
        {activeTab === 'memorization_plan' && (
          <MemorizationPlanManager
            currentAccount={currentAccount}
            onOpenRecitationSession={handleStartRecitationFromPlan}
          />
        )}

        {activeTab === 'revision_plan' && (
          <RevisionPlanManager
            currentAccount={currentAccount}
            onOpenRecitationSession={handleStartRecitationFromPlan}
          />
        )}

        {activeTab === 'recitation_session' && (
          <LiveRecitationSession
            currentAccount={currentAccount}
            initialPlan={activePlanForRecitation}
            onSessionSaved={handleSessionSaved}
            onClose={() => setActiveTab('memorization_plan')}
          />
        )}

        {activeTab === 'academic_report' && (
          <AcademicReportView
            currentAccount={currentAccount}
          />
        )}

        {activeTab === 'academic_settings' && isTeacherOrAdmin && (
          <AcademicSettingsManager
            currentAccount={currentAccount}
          />
        )}

        {/* Evaluation Modal Display when requested */}
        {selectedEvaluationSession && (
          <SessionEvaluationModal
            session={selectedEvaluationSession}
            onClose={() => setSelectedEvaluationSession(null)}
          />
        )}
      </main>

      {/* 4. Footer */}
      <footer className="bg-[#051c11] text-emerald-100 border-t-2 border-[#C5A059] py-6 px-4 text-xs font-sans mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <OfficialLogo size="xs" showText={false} />
            <div>
              <span className="font-bold font-serif text-white block">مقرأة رحاب القرآن الإلكترونية</span>
              <span className="text-[10px] text-emerald-200/80">النظام الأكاديمي القرآني المعتمد بالسند المتصل</span>
            </div>
          </div>

          <div className="text-center sm:text-left text-[11px] text-emerald-200/80">
            جميع الحقوق محفوظة © 2026 مقرأة رحاب القرآن الإلكترونية
          </div>
        </div>
      </footer>
    </div>
  );
};
