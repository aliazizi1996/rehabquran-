import React, { useState, useEffect, useRef } from 'react';
import { 
  Award, Sparkles, CheckCircle2, Search, Plus, Trash2, 
  Printer, Share2, ShieldCheck, Download, Calendar, 
  FileText, ExternalLink, X, BookOpen, Star, Sliders
} from 'lucide-react';
import { StudentCertificate, UserProfile } from '../types';
import { 
  getStudentCertificates, 
  issueCertificate, 
  deleteCertificate 
} from '../data/evaluationStore';
import { getRegisteredStudents, RegisteredStudent } from '../data/registrationStore';
import { OfficialLogo, OfficialStamp } from './OfficialLogo';
import { getBrandLogoSettings, BrandLogoCustomization } from '../utils/brandLogoStore';
import { toAbsoluteUrl, waitForImagesToLoad, preloadImages } from '../utils/imagePreloader';
import { exportCertificateDirectPdf } from '../utils/directPdfExporter';

interface CertificatesViewProps {
  user?: UserProfile;
  initialPreloadStudent?: {
    name: string;
    section: 'male' | 'female';
    teacher: string;
  } | null;
  preloadStudentName?: string;
  preloadSection?: 'male' | 'female';
  preloadTeacherName?: string;
  onNavigateToRecitationLog?: () => void;
  issuedLogoUrl?: string;
  issuedSealUrl?: string;
}

export const CertificatesView: React.FC<CertificatesViewProps> = ({
  user,
  initialPreloadStudent,
  preloadStudentName,
  preloadSection,
  preloadTeacherName,
  onNavigateToRecitationLog,
  issuedLogoUrl,
  issuedSealUrl,
}) => {
  const [certificates, setCertificates] = useState<StudentCertificate[]>(() => getStudentCertificates());
  const [registeredStudents, setRegisteredStudents] = useState<RegisteredStudent[]>(() => getRegisteredStudents());
  
  // Selected certificate for viewing / printing
  const [selectedCert, setSelectedCert] = useState<StudentCertificate | null>(null);

  // Modal for issuing certificate
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [brandSettings, setBrandSettings] = useState<BrandLogoCustomization>(getBrandLogoSettings());

  useEffect(() => {
    const handleUpdate = (e: any) => {
      setBrandSettings(e.detail || getBrandLogoSettings());
    };
    window.addEventListener('brand_logo_updated', handleUpdate);
    return () => window.removeEventListener('brand_logo_updated', handleUpdate);
  }, []);

  const dynamicLogoUrl = issuedLogoUrl || brandSettings.customLogoUrl || '/brand/official-logo.png';
  const dynamicSealUrl = issuedSealUrl || brandSettings.customSealUrl || '/brand/official-seal.png';

  // Pre-filled or current form values
  const defaultTeacher = user?.name || 'مشرف قسم الطلاب';
  const [studentName, setStudentName] = useState('');
  const [studentSection, setStudentSection] = useState<'male' | 'female'>('male');
  const [selectedRegisteredId, setSelectedRegisteredId] = useState('');
  const [certTitle, setCertTitle] = useState('شهادة إتقان وتثبيت جزء من القرآن الكريم');
  const [achievementType, setAchievementType] = useState<StudentCertificate['achievementType']>('juz_completion');
  const [surahOrJuzDetail, setSurahOrJuzDetail] = useState('الجزء الأول (سورة الفاتحة والبقرة)');
  const [grade, setGrade] = useState<'ممتاز' | 'جيد جداً' | 'جيد'>('ممتاز');
  const [score, setScore] = useState<number>(98);
  const [evaluatorTeacher, setEvaluatorTeacher] = useState<string>(defaultTeacher);
  const [customDescription, setCustomDescription] = useState('');
  const [successNotif, setSuccessNotif] = useState<string | null>(null);

  // Filters
  const [filterSection, setFilterSection] = useState<'all' | 'male' | 'female'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Handle preloading when passed from recitation log
  useEffect(() => {
    if (initialPreloadStudent) {
      setStudentName(initialPreloadStudent.name || '');
      setStudentSection(initialPreloadStudent.section || 'male');
      setEvaluatorTeacher(initialPreloadStudent.teacher || defaultTeacher);
      setIsIssueModalOpen(true);
    } else if (preloadStudentName) {
      setStudentName(preloadStudentName);
      if (preloadSection) setStudentSection(preloadSection);
      if (preloadTeacherName) setEvaluatorTeacher(preloadTeacherName);
      setIsIssueModalOpen(true);
    }
  }, [initialPreloadStudent, preloadStudentName, preloadSection, preloadTeacherName]);

  useEffect(() => {
    const handleCertsUpdate = () => {
      setCertificates(getStudentCertificates());
    };
    const handleStudentsUpdate = () => {
      setRegisteredStudents(getRegisteredStudents());
    };
    const handleBrandUpdate = (e: any) => {
      setBrandSettings(e.detail || getBrandLogoSettings());
    };

    window.addEventListener('rehab_certificates_updated', handleCertsUpdate);
    window.addEventListener('rehab_students_updated', handleStudentsUpdate);
    window.addEventListener('brand_logo_updated', handleBrandUpdate);
    return () => {
      window.removeEventListener('rehab_certificates_updated', handleCertsUpdate);
      window.removeEventListener('rehab_students_updated', handleStudentsUpdate);
      window.removeEventListener('brand_logo_updated', handleBrandUpdate);
    };
  }, []);

  const handleSelectRegistered = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedRegisteredId(id);
    if (id) {
      const std = registeredStudents.find((s) => s && s.id === id);
      if (std) {
        setStudentName(std.name || '');
        setStudentSection(std.section || 'male');
      }
    }
  };

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = studentName.trim() || 'طالب متميز';
    const desc = customDescription.trim() || 
      `تمنح إدارة مقرأة رحاب القرآن الإلكترونية هذه الشهادة المباركة تقديراً لاجتياز اختبار إتقان وتثبيت ${surahOrJuzDetail} برواية حفص عن عاصم بالسند المتصل وبتقدير ${grade}.`;

    const newCert = issueCertificate({
      studentId: selectedRegisteredId || `std-${Date.now()}`,
      studentName: finalName,
      studentSection,
      title: certTitle,
      achievementType,
      description: desc,
      surahOrJuzDetail,
      grade,
      score: Number(score) || 95,
      evaluatorTeacher,
    });

    setSuccessNotif(`تم إصدار الشهادة بنجاح للطالب (${finalName}) برقم ${newCert.certificateNumber}.`);
    setTimeout(() => setSuccessNotif(null), 4000);
    setIsIssueModalOpen(false);
    setSelectedCert(newCert); // open preview immediately
  };

  const handleDelete = (id: string, name: string) => {
    deleteCertificate(id);
    setSuccessNotif(`تم حذف شهادة الطالب (${name}).`);
    setTimeout(() => setSuccessNotif(null), 3000);
  };

  const [isPrinting, setIsPrinting] = useState(false);
  const [isExportingDirectPdf, setIsExportingDirectPdf] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      await preloadImages([
        toAbsoluteUrl(brandSettings.customLogoUrl || '/brand/official-logo.png'),
        toAbsoluteUrl(brandSettings.customSealUrl || '/brand/official-seal.png')
      ]);
      await waitForImagesToLoad(document);
      await new Promise(r => setTimeout(r, 250));
      window.print();
    } catch (e) {
      console.error('Print error:', e);
      window.print();
    } finally {
      setTimeout(() => setIsPrinting(false), 1200);
    }
  };

  const handleDirectPdfDownload = async () => {
    if (!selectedCert) return;
    const certEl = document.getElementById('printableCertificate');
    if (!certEl) return;
    setIsExportingDirectPdf(true);
    setExportStatus('جاري تهيئة الشهادة...');
    try {
      await preloadImages([
        toAbsoluteUrl(brandSettings.customLogoUrl || '/brand/official-logo.png'),
        toAbsoluteUrl(brandSettings.customSealUrl || '/brand/official-seal.png')
      ]);
      await exportCertificateDirectPdf(certEl, {
        studentName: selectedCert.studentName,
        certificateNumber: selectedCert.certificateNumber,
        onProgress: (status) => setExportStatus(status)
      });
      setExportStatus('تم تنزيل ملف PDF بنجاح ✓');
      setTimeout(() => setExportStatus(null), 3000);
    } catch (e) {
      console.error('Direct PDF export error:', e);
      setExportStatus('تعذر التصدير المباشر، جاري فتح الطباعة...');
      setTimeout(() => {
        setExportStatus(null);
        handlePrint();
      }, 1000);
    } finally {
      setIsExportingDirectPdf(false);
    }
  };

  const handleShareWhatsApp = (cert: StudentCertificate) => {
    const msg = `*مقرأة رحاب القرآن الإلكترونية - شهادة إنجاز وتميز قرآني* 📜
━━━━━━━━━━━━━━━━━━━━
🎓 *الشهادة:* ${cert.title}
👤 *اسم الطالب:* ${cert.studentName}
🏆 *التقدير:* ${cert.grade} (الدرجة: ${cert.score}/100)
📖 *المقرر المتقن:* ${cert.surahOrJuzDetail}
📅 *تاريخ الإصدار:* ${cert.issueDate}
🔖 *رقم الشهادة الرسمي:* ${cert.certificateNumber}
✍️ *المعلم المشرف:* ${cert.evaluatorTeacher}
━━━━━━━━━━━━━━━━━━━━
تهانينا للطالب هذا الإنجاز المبارك في خدمة كتاب الله تعالى!`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const filteredCerts = certificates.filter((c) => {
    const matchesSection = filterSection === 'all' || c.studentSection === filterSection;
    const matchesSearch = 
      c.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.surahOrJuzDetail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.evaluatorTeacher.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSection && matchesSearch;
  });

  return (
    <div className="space-y-4 pb-20">
      {/* Top Section Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-[#12281c] via-[#103322] to-[#0a1e15] p-5 sm:p-6 border-2 border-amber-500/70 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/50 px-3 py-0.5 rounded-full inline-flex items-center gap-1 shadow-sm">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  قسم الشهادات والإجازات القرآنية
                </span>
                <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/50 px-3 py-0.5 rounded-full">
                  معتمدة ومختومة رسمياً
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-serif mt-1">
                سجل شهادات الطلاب وأوسمة الإتقان
              </h1>
              <p className="text-xs text-emerald-100/90 leading-relaxed font-normal mt-0.5 max-w-2xl">
                إصدار شهادات الإتقان والتثبيت بالسند المتصل برواية حفص عن عاصم، موقّعة من المشرفين والمعلمين المعتمدين مع إمكانية المعاينة والطباعة الفورية.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">


              <button
                type="button"
                onClick={() => setIsIssueModalOpen(true)}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-950/60 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إصدار شهادة جديدة للطالب</span>
              </button>

              {onNavigateToRecitationLog && (
                <button
                  type="button"
                  onClick={onNavigateToRecitationLog}
                  className="py-2.5 px-3.5 rounded-xl bg-[#081810] hover:bg-[#0c2419] text-emerald-300 border border-emerald-700/80 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>سجل المتابعة اليومية</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successNotif && (
        <div className="p-3.5 rounded-2xl bg-emerald-900/90 border border-emerald-500 text-white text-xs font-semibold flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successNotif}</span>
          </div>
          <button 
            type="button"
            onClick={() => setSuccessNotif(null)}
            className="text-slate-300 hover:text-white text-xs px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search */}
      <div className="p-4 rounded-2xl bg-[#0a1e15] border border-emerald-900/60 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            placeholder="ابحث باسم الطالب، نوع الشهادة، أو المعلم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-3 py-2 rounded-xl bg-[#06150e] border border-emerald-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value as any)}
            className="py-2 px-3 rounded-xl bg-[#06150e] border border-emerald-800 text-xs text-emerald-300 focus:outline-none"
          >
            <option value="all">جميع الشهادات (بنين وبنات)</option>
            <option value="male">قسم الطلاب (بنين)</option>
            <option value="female">قسم الطالبات (أخوات)</option>
          </select>
        </div>
      </div>

      {/* Certificates Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCerts.length === 0 ? (
          <div className="col-span-full p-8 text-center rounded-2xl bg-[#0a1e15] border border-emerald-900/60 text-slate-400 space-y-2">
            <Award className="w-8 h-8 mx-auto text-amber-400/40" />
            <p className="text-xs font-semibold text-white">لا توجد شهادات مسجلة مطابقة للبحث</p>
            <p className="text-[11px]">اضغط على زر (إصدار شهادة جديدة) لمنح طالب شهادة تقديرية معتمدة.</p>
          </div>
        ) : (
          filteredCerts.map((cert) => {
            const isMale = cert.studentSection === 'male';

            return (
              <div
                key={cert.id}
                className="rounded-3xl bg-gradient-to-b from-[#0e271a] via-[#0b1f15] to-[#07170f] border-2 border-[#C5A059]/40 hover:border-[#C5A059] transition-all p-5 shadow-xl flex flex-col justify-between space-y-4 relative overflow-hidden group"
              >
                {/* Decorative background glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#C5A059]/5 rounded-full blur-2xl pointer-events-none"></div>

                <div className="space-y-3 relative z-10">
                  {/* Top Header Badge & Serial */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-[#C5A059]/20 border border-[#C5A059]/50 flex items-center justify-center text-[#dfbe75] shadow-inner">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${
                          isMale
                            ? 'bg-[#046A38]/30 text-emerald-300 border-[#046A38]/60'
                            : 'bg-[#C5A059]/25 text-[#dfbe75] border-[#C5A059]/50'
                        }`}>
                          {isMale ? 'قسم الطلاب (بنين)' : 'قسم الطالبات (بنات)'}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                          {cert.certificateNumber}
                        </span>
                      </div>
                    </div>

                    <div className="text-left shrink-0">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#046A38] border border-[#C5A059]/60 text-[#dfbe75] inline-flex items-center gap-1 shadow-xs">
                        <Sparkles className="w-3 h-3 text-[#C5A059]" />
                        <span>{cert.grade}</span>
                      </span>
                    </div>
                  </div>

                  {/* Certificate Title & Student Name */}
                  <div>
                    <h3 className="text-sm font-bold text-white font-amiri leading-snug">
                      {cert.title}
                    </h3>
                    <div className="mt-1.5 p-2 rounded-xl bg-[#06150e] border border-emerald-900/80 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-kufi">اسم الطالب:</span>
                      <span className="text-xs font-bold text-[#dfbe75] font-amiri">
                        {cert.studentName}
                      </span>
                    </div>
                  </div>

                  {/* Detail & Evaluator */}
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                      <span>المقرر المتقن:</span>
                      <span className="font-semibold text-white">{cert.surahOrJuzDetail}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                      <span>المعلم المشرف:</span>
                      <span className="font-semibold text-emerald-300">{cert.evaluatorTeacher}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-emerald-950">
                      <span>تاريخ الإصدار:</span>
                      <span>{cert.issueDate}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-emerald-900/60 flex items-center justify-between gap-2 relative z-10">
                  <div className="flex items-center gap-1.5 flex-1">
                    <button
                      type="button"
                      onClick={() => setSelectedCert(cert)}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#C5A059] hover:bg-[#dfbe75] text-[#2C3531] font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm font-kufi"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>عرض الشهادة الرسمية</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleShareWhatsApp(cert)}
                      className="py-2 px-2.5 rounded-xl bg-[#06150e] hover:bg-[#0d271a] text-emerald-300 border border-emerald-800 text-xs flex items-center justify-center transition-colors cursor-pointer"
                      title="مشاركة عبر الواتساب"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(cert.id, cert.studentName)}
                    className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
                    title="حذف الشهادة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FULL OFFICIAL CERTIFICATE PREVIEW MODAL */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-5 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#06160e] border-2 sm:border-4 border-amber-500/80 rounded-2xl sm:rounded-3xl p-3 sm:p-6 text-white shadow-2xl my-auto space-y-4 sm:space-y-6">
            {/* Modal Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-amber-500/30">
              <div>
                <span className="w-full sm:w-auto text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  معاينة الشهادة المعتمدة للطباعة والمشاركة
                </span>
                {exportStatus && (
                  <span className="text-[11px] text-amber-300 animate-pulse font-medium block mt-0.5">
                    {exportStatus}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* زر التصدير المباشر كـ PDF عبر jsPDF + html2canvas */}
                <button
                  type="button"
                  onClick={handleDirectPdfDownload}
                  disabled={isExportingDirectPdf}
                  className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition disabled:opacity-50 border border-emerald-400/40"
                  title="تنزيل ملف PDF حقيقي ومباشر لجهازك دون نافذة الطباعة"
                >
                  <Download className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isExportingDirectPdf ? (exportStatus || 'جاري التوليد...') : 'تنزيل PDF مباشر (jsPDF)'}</span>
                </button>

                {/* زر الطباعة العادية */}
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={isPrinting || isExportingDirectPdf}
                  className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition disabled:opacity-50 ring-1 ring-amber-300/40"
                  title="طباعة الشهادة من نافذة المتصفح"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-950" />
                  <span>{isPrinting ? 'جاري التجهيز...' : 'طباعة المتصفح'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleShareWhatsApp(selectedCert)}
                  className="py-1.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>واتساب</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCert(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Certificate Frame */}
            <div 
              id="printableCertificate"
              className="certificate-print-root p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-[#F9F6F0] border-4 border-[#C5A059] relative overflow-hidden shadow-2xl text-center space-y-4 sm:space-y-5 text-[#2C3531] w-full max-w-full"
            >
              {/* Double Inner Emerald Border Frame */}
              <div className="absolute inset-2 sm:inset-3 border-2 border-[#046A38] rounded-2xl pointer-events-none opacity-85"></div>
              <div className="absolute inset-3.5 sm:inset-4 border border-[#C5A059] rounded-xl pointer-events-none opacity-60"></div>

              {/* Islamic Arabesque Corner Crests in all 4 corners */}
              <div className="absolute top-3 sm:top-4 right-3 sm:right-4 w-7 h-7 sm:w-9 sm:h-9 pointer-events-none">
                <svg viewBox="0 0 40 40" className="w-full h-full text-[#C5A059]">
                  <path d="M0,0 L35,0 C35,15 25,35 0,35 L0,25 C15,25 25,15 25,0 L0,0 Z" fill="currentColor" opacity="0.85" />
                  <circle cx="12" cy="12" r="3" fill="#046A38" />
                </svg>
              </div>
              <div className="absolute top-3 sm:top-4 left-3 sm:left-4 w-7 h-7 sm:w-9 sm:h-9 pointer-events-none">
                <svg viewBox="0 0 40 40" className="w-full h-full text-[#C5A059] -scale-x-100">
                  <path d="M0,0 L35,0 C35,15 25,35 0,35 L0,25 C15,25 25,15 25,0 L0,0 Z" fill="currentColor" opacity="0.85" />
                  <circle cx="12" cy="12" r="3" fill="#046A38" />
                </svg>
              </div>
              <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 w-7 h-7 sm:w-9 sm:h-9 pointer-events-none">
                <svg viewBox="0 0 40 40" className="w-full h-full text-[#C5A059] -scale-y-100">
                  <path d="M0,0 L35,0 C35,15 25,35 0,35 L0,25 C15,25 25,15 25,0 L0,0 Z" fill="currentColor" opacity="0.85" />
                  <circle cx="12" cy="12" r="3" fill="#046A38" />
                </svg>
              </div>
              <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 w-7 h-7 sm:w-9 sm:h-9 pointer-events-none">
                <svg viewBox="0 0 40 40" className="w-full h-full text-[#C5A059] -scale-x-100 -scale-y-100">
                  <path d="M0,0 L35,0 C35,15 25,35 0,35 L0,25 C15,25 25,15 25,0 L0,0 Z" fill="currentColor" opacity="0.85" />
                  <circle cx="12" cy="12" r="3" fill="#046A38" />
                </svg>
              </div>

              {/* Watermark in background */}
              <div 
                style={{ opacity: brandSettings.certWatermarkOpacity ?? 0.06 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
              >
                <img
                  src={dynamicLogoUrl}
                  crossOrigin="anonymous"
                  alt="العلامة المائية المعتمدة"
                  className="w-56 sm:w-80 max-h-[260px] sm:max-h-[320px] object-contain select-none"
                  onError={(e) => {
                    if (e.currentTarget.src !== window.location.origin + '/brand/official-logo.png') {
                      e.currentTarget.src = '/brand/official-logo.png';
                    }
                  }}
                />
              </div>

              {/* Certificate Top Header */}
              <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pt-1 px-2 border-b border-[#C5A059]/30 pb-3">
                {/* Right: Official Logo Emblem */}
                <div className="flex items-center gap-3">
                  <div className="w-14 sm:w-20 flex items-center justify-center shrink-0">
                    <img
                      src={dynamicLogoUrl}
                      crossOrigin="anonymous"
                      alt={brandSettings.titleText || 'مقرأة رحاب القرآن الإلكترونية'}
                      className="w-12 sm:w-16 h-auto object-contain select-none filter drop-shadow-md"
                      onError={(e) => {
                        if (e.currentTarget.src !== window.location.origin + '/brand/official-logo.png') {
                          e.currentTarget.src = '/brand/official-logo.png';
                        }
                      }}
                    />
                  </div>
                  <div className="text-right">
                    <h4 className="font-bold text-sm sm:text-base text-[#046A38] font-amiri leading-tight">
                      {brandSettings.titleText || 'مقرأة رحاب القرآن الإلكترونية'}
                    </h4>
                    <p className="text-[10px] sm:text-xs text-[#987834] font-kufi font-medium">
                      {brandSettings.subText || 'ـ لتعليم القرآن الكريم عن بُعد ـ'}
                    </p>
                  </div>
                </div>

                {/* Center/Left: Ornate Cartouche "شهادة إنجاز" */}
                <div className="flex flex-col items-center sm:items-end">
                  <div className="relative px-5 sm:px-7 py-1.5 sm:py-2 rounded-2xl bg-[#046A38] text-white border-2 border-[#C5A059] shadow-md shadow-emerald-950/20 flex items-center justify-center">
                    <span className="font-amiri text-lg sm:text-2xl font-bold tracking-wide text-[#f7e8c6]">
                      {brandSettings.certHeaderBadge || 'شهادة إنجاز'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#046A38] font-bold mt-1.5 bg-[#046A38]/10 px-2.5 py-0.5 rounded-full border border-[#046A38]/30">
                    رقم الاعتماد: {selectedCert.certificateNumber}
                  </span>
                </div>
              </div>

              {/* Certificate Body */}
              <div className="relative z-10 space-y-2.5 sm:space-y-3 py-1 max-w-xl mx-auto text-[#2C3531]">
                <p className="text-xs sm:text-sm font-kufi text-[#046A38] font-bold">
                  {brandSettings.certIntroText || '❖ تَشْهَدُ مَقْرَأَةُ رِحَابِ القُرْآنِ الإِلِكْتُرُونِيَّةِ بِأَنَّ: ❖'}
                </p>

                {/* Student Name */}
                <div className="py-2 px-4 sm:px-8 rounded-2xl bg-white/90 border-2 border-dashed border-[#C5A059] inline-block shadow-xs max-w-full overflow-hidden">
                  <span className="text-xs text-slate-500 font-kufi ml-2">اسم الطالب/ة:</span>
                  <span className="text-lg sm:text-2xl font-amiri font-bold text-[#046A38] break-words">
                    {selectedCert.studentName}
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-kufi text-[#2C3531] leading-relaxed">
                  {brandSettings.certCompletionPhrase || 'قَدْ أَتَمَّ بِمَنِّ اللَّهِ تَعَالَى وَتَوْفِيقِهِ مُتَطَلَّبَاتِ إِتْقَانِ وَتَثْبِيتِ:'}
                </p>

                <div className="p-2.5 sm:p-3 rounded-2xl bg-[#046A38]/5 border border-[#046A38]/20">
                  <p className="font-amiri font-bold text-base sm:text-lg text-[#046A38]">
                    « {selectedCert.title} »
                  </p>
                  <p className="font-kufi text-xs text-[#2C3531] font-semibold mt-1">
                    المقرر المتقن: {selectedCert.surahOrJuzDetail}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-slate-600 mt-0.5 font-kufi">
                    {brandSettings.certNarrationText || 'بِرِوَايَةِ حَفْصٍ عَنْ عَاصِمٍ بِالسَّنَدِ الْمُتَّصِلِ'}
                  </p>
                </div>

                {/* Score & Evaluation */}
                <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-4 sm:px-5 py-1.5 rounded-full bg-[#046A38] text-white text-xs sm:text-sm font-kufi shadow-xs">
                  <span className="text-[#f7e8c6] font-bold">التقدير: {selectedCert.grade}</span>
                  <span className="opacity-40 hidden sm:inline">|</span>
                  <span className="font-mono text-[#f7e8c6]">الدرجة: {selectedCert.score} / 100</span>
                </div>

                <p className="text-[10px] sm:text-[11px] text-slate-500 font-kufi">
                  بتاريخ: {selectedCert.issueDate}
                </p>
              </div>

              {/* Signatures & Official Stamp */}
              <div className="relative z-10 pt-4 border-t-2 border-[#C5A059]/40 grid grid-cols-3 gap-1 sm:gap-2 items-center text-xs">
                {/* 1. Administration (Right) */}
                <div className="text-right space-y-1">
                  <span className="text-[10px] sm:text-[11px] font-bold text-[#046A38] block font-kufi">
                    {brandSettings.certAdminSignerTitle || 'إدارة المقرأة:'}
                  </span>
                  <p className="font-bold text-[#2C3531] text-xs sm:text-sm font-amiri truncate">
                    {brandSettings.certAdminSignerName || 'د. علي عزيزي'}
                  </p>
                  <div className="w-14 sm:w-20 h-0.5 bg-[#C5A059] mr-auto mt-1 opacity-70"></div>
                  <span className="text-[8px] sm:text-[9px] text-slate-500 block font-kufi">المشرف العام المعتمد</span>
                </div>

                {/* 2. Official Academy Stamp (Center) */}
                <div className="flex flex-col items-center justify-center">
                  <img
                    src={dynamicSealUrl}
                    crossOrigin="anonymous"
                    alt="الختم الرسمي لمقرأة رحاب القرآن"
                    className="w-14 h-14 sm:w-20 sm:h-20 object-contain drop-shadow-md select-none pointer-events-none"
                    onError={(e) => {
                      if (e.currentTarget.src !== window.location.origin + '/brand/official-seal.png') {
                        e.currentTarget.src = '/brand/official-seal.png';
                      }
                    }}
                  />
                  <span className="text-[8px] sm:text-[9px] font-bold text-[#046A38] mt-0.5 font-kufi">
                    ختم الاعتماد الرسمي
                  </span>
                </div>

                {/* 3. Teacher / Evaluator (Left) */}
                <div className="text-left space-y-1">
                  <span className="text-[10px] sm:text-[11px] font-bold text-[#046A38] block font-kufi">
                    {brandSettings.certTeacherSignerTitle ? `${brandSettings.certTeacherSignerTitle}:` : 'معلم/ة الحلقة:'}
                  </span>
                  <p className="font-bold text-[#2C3531] text-xs sm:text-sm font-amiri truncate">
                    {selectedCert.evaluatorTeacher}
                  </p>
                  <div className="w-14 sm:w-20 h-0.5 bg-[#C5A059] ml-auto mt-1 opacity-70"></div>
                  <span className="text-[8px] sm:text-[9px] text-slate-500 block font-kufi">المعلم المجيز</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ISSUE NEW CERTIFICATE MODAL */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-[#0a1e15] border-2 border-amber-500/80 rounded-3xl p-5 sm:p-6 text-white shadow-2xl my-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-800">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white font-serif">
                  إصدار شهادة إنجاز وتميز قرآني للطالب
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsIssueModalOpen(false)}
                className="text-xs text-slate-400 hover:text-white bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-800 cursor-pointer"
              >
                إغلاق
              </button>
            </div>

            <form onSubmit={handleIssueSubmit} className="space-y-3.5">
              {/* Pick registered or enter name */}
              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1">
                  اختر الطالب من قائمة المسجلين (إن وجد):
                </label>
                <select
                  value={selectedRegisteredId}
                  onChange={handleSelectRegistered}
                  className="w-full p-2.5 rounded-xl bg-[#06150e] border border-emerald-800 text-xs text-white focus:outline-none"
                >
                  <option value="">-- أو اكتب اسم الطالب يدوياً --</option>
                  {registeredStudents.filter((s) => Boolean(s && s.id)).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s?.section === 'male' ? 'قسم الطلاب' : 'قسم الطالبات'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">
                    اسم الطالب الثلاثي: <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="مثال: محمد أحمد اليماني"
                    className="w-full p-2.5 rounded-xl bg-[#06150e] border border-emerald-800 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">
                    القسم:
                  </label>
                  <select
                    value={studentSection}
                    onChange={(e) => setStudentSection(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-[#06150e] border border-emerald-800 text-xs text-white focus:outline-none"
                  >
                    <option value="male">قسم الطلاب (بنين)</option>
                    <option value="female">قسم الطالبات (بنات)</option>
                  </select>
                </div>
              </div>

              {/* Title & Achievement Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">
                    نوع الإنجاز:
                  </label>
                  <select
                    value={achievementType}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setAchievementType(val);
                      if (val === 'juz_completion') {
                        setCertTitle('شهادة إتقان وتثبيت جزء من القرآن الكريم');
                        setSurahOrJuzDetail('الجزء الأول من القرآن الكريم');
                      } else if (val === 'surah_completion') {
                        setCertTitle('شهادة تميز في حفظ سورة كاملة');
                        setSurahOrJuzDetail('سورة البقرة كاملة');
                      } else if (val === 'khatm_sanad') {
                        setCertTitle('إجازة ختم القرآن الكريم بالسند المتصل');
                        setSurahOrJuzDetail('القرآن الكريم كاملاً غيباً');
                      } else if (val === 'tajweed_mastery') {
                        setCertTitle('شهادة تفوق وإتقان في علم التجويد ومخارج الحروف');
                        setSurahOrJuzDetail('منظومة تحفة الأطفال والجزرية');
                      } else if (val === 'attendance_excellence') {
                        setCertTitle('وسام المواظبة والحضور المتميز بالحلقات');
                        setSurahOrJuzDetail('حضور منتظم دون انقطاع');
                      }
                    }}
                    className="w-full p-2.5 rounded-xl bg-[#06150e] border border-emerald-800 text-xs text-white focus:outline-none"
                  >
                    <option value="juz_completion">إتمام حفظ جزء</option>
                    <option value="surah_completion">إتمام حفظ سورة</option>
                    <option value="khatm_sanad">ختمة بالسند المتصل</option>
                    <option value="tajweed_mastery">إتقان أحكام التجويد</option>
                    <option value="attendance_excellence">وسام الحضور المتميز</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">
                    المقرر المتقن:
                  </label>
                  <input
                    type="text"
                    required
                    value={surahOrJuzDetail}
                    onChange={(e) => setSurahOrJuzDetail(e.target.value)}
                    placeholder="مثال: سورة البقرة / جزء عم"
                    className="w-full p-2.5 rounded-xl bg-[#06150e] border border-emerald-800 text-xs text-white focus:outline-none font-bold"
                  />
                </div>
              </div>

              {/* Grade & Score */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">
                    التقدير:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['ممتاز', 'جيد جداً', 'جيد'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => {
                          setGrade(g);
                          if (g === 'ممتاز') setScore(98);
                          if (g === 'جيد جداً') setScore(88);
                          if (g === 'جيد') setScore(78);
                        }}
                        className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          grade === g
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                            : 'bg-[#06150e] text-slate-300 border border-emerald-900'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">
                    الدرجة من 100:
                  </label>
                  <input
                    type="number"
                    min={60}
                    max={100}
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[#06150e] border border-emerald-800 text-xs text-white focus:outline-none font-mono font-bold"
                  />
                </div>
              </div>

              {/* Evaluator Teacher */}
              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1">
                  المعلم المشرف الموقّع للشهادة:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEvaluatorTeacher('مشرف قسم الطلاب')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      evaluatorTeacher === 'مشرف قسم الطلاب'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-[#06150e] text-slate-400 border border-emerald-900'
                    }`}
                  >
                    مشرف قسم الطلاب (بنين)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvaluatorTeacher('مشرفة قسم الطالبات')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      evaluatorTeacher === 'مشرفة قسم الطالبات'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-[#06150e] text-slate-400 border border-emerald-900'
                    }`}
                  >
                    مشرفة قسم الطالبات (أخوات)
                  </button>
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-2 border-t border-emerald-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="py-2 px-3.5 rounded-xl bg-[#06150e] text-slate-400 hover:text-white border border-emerald-900 text-xs font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-950/60 cursor-pointer transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>اعتماد وإصدار الشهادة</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
