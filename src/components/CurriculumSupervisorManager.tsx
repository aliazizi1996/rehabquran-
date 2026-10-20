import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, Plus, Edit3, Trash2, ArrowUp, ArrowDown, 
  CheckCircle2, AlertCircle, Save, Settings, Video, Volume2, 
  FileText, HelpCircle, Upload, Shield, RefreshCw, Eye, Lock,
  ChevronDown, ChevronUp, BookOpen, Sparkles, Check, X
} from 'lucide-react';
import { TajweedChapter, TajweedLesson, TajweedLessonQuiz } from '../types';
import { 
  getActiveCurriculum, 
  saveActiveCurriculum, 
  moveLessonInChapter, 
  getCurriculumSettings, 
  saveCurriculumSettings 
} from '../data/learningStore';
import { uploadCurriculumMedia } from '../lib/firebaseStorage';
import { getTeacherComprehensionStats } from '../data/quizStore';
import { TajweedPdfSettingsManager } from './admin/TajweedPdfSettingsManager';

export const CurriculumSupervisorManager: React.FC = () => {
  const [curriculum, setCurriculum] = useState<TajweedChapter[]>(() => getActiveCurriculum());
  const [settings, setSettings] = useState(() => getCurriculumSettings());
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [supervisorTab, setSupervisorTab] = useState<'curriculum' | 'pdf_settings'>('curriculum');

  // Expanded chapters state
  const [expandedChapterIds, setExpandedChapterIds] = useState<Record<string, boolean>>({
    'chap-1-intro': true,
    'chap-2-noon-tanween': true,
  });

  // Add / Edit Modal state
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [targetChapterId, setTargetChapterId] = useState<string>('chap-1-intro');
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  // Lesson Form state
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [lessonTextContent, setLessonTextContent] = useState('');
  const [lessonDuration, setLessonDuration] = useState(15);
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonAudioUrl, setLessonAudioUrl] = useState('');
  const [lessonPdfUrl, setLessonPdfUrl] = useState('');
  const [lessonPdfTitle, setLessonPdfTitle] = useState('');
  const [lessonSpeaker, setLessonSpeaker] = useState('فضيلة الشيخ د. أيمن رشدي سويد');
  const [lessonPoeticVerse, setLessonPoeticVerse] = useState('');
  const [lessonCustomScore, setLessonCustomScore] = useState<number | undefined>(undefined);
  const [lessonKeyPoints, setLessonKeyPoints] = useState<string[]>(['']);
  const [lessonQuiz, setLessonQuiz] = useState<TajweedLessonQuiz[]>([
    {
      id: 'q-custom-1',
      question: '',
      options: ['', '', '', ''],
      correctIndex: 0,
      explanation: ''
    }
  ]);

  // Upload Progress States
  const [videoUploadProgress, setVideoUploadProgress] = useState<number | null>(null);
  const [audioUploadProgress, setAudioUploadProgress] = useState<number | null>(null);
  const [pdfUploadProgress, setPdfUploadProgress] = useState<number | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage((curr) => (curr === msg ? null : curr)), 3500);
  };

  const toggleChapterExpand = (chapId: string) => {
    setExpandedChapterIds((prev) => ({
      ...prev,
      [chapId]: !prev[chapId]
    }));
  };

  // Save Settings
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await saveCurriculumSettings(settings);
      showToast('تم حفظ إعدادات نسبة النجاح والمنهج بنجاح في قاعدة البيانات.');
    } catch (e) {
      showToast('حدث خطأ أثناء حفظ الإعدادات.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Move Lesson Up / Down
  const handleMoveLesson = (chapterId: string, lessonId: string, direction: 'up' | 'down') => {
    const updated = moveLessonInChapter(chapterId, lessonId, direction);
    setCurriculum([...updated]);
    showToast(`تم تغيير ترتيب الدرس إلى ${direction === 'up' ? 'الأعلى' : 'الأسفل'}`);
  };

  // Open Create Modal
  const handleOpenCreateModal = (chapterId: string) => {
    setTargetChapterId(chapterId);
    setEditingLessonId(null);
    setLessonTitle('');
    setLessonDescription('');
    setLessonTextContent('');
    setLessonDuration(15);
    setLessonVideoUrl('');
    setLessonAudioUrl('');
    setLessonPdfUrl('');
    setLessonPdfTitle('');
    setLessonSpeaker('فضيلة الشيخ د. أيمن رشدي سويد');
    setLessonPoeticVerse('');
    setLessonCustomScore(undefined);
    setLessonKeyPoints(['']);
    setLessonQuiz([
      {
        id: `q-${Date.now()}-1`,
        question: '',
        options: ['', '', '', ''],
        correctIndex: 0,
        explanation: ''
      }
    ]);
    setModalMode('create');
  };

  // Open Edit Modal
  const handleOpenEditModal = (lesson: TajweedLesson, chapterId: string) => {
    setTargetChapterId(chapterId);
    setEditingLessonId(lesson.id);
    setLessonTitle(lesson.title);
    setLessonDescription(lesson.description);
    setLessonTextContent(lesson.textContent || '');
    setLessonDuration(lesson.durationMinutes || 15);
    setLessonVideoUrl(lesson.videoUrl || '');
    setLessonAudioUrl(lesson.audioUrl || '');
    setLessonPdfUrl(lesson.pdfUrl || '');
    setLessonPdfTitle(lesson.pdfTitle || '');
    setLessonSpeaker(lesson.videoSpeaker || 'فضيلة الشيخ د. أيمن رشدي سويد');
    setLessonPoeticVerse(lesson.poeticVerse || '');
    setLessonCustomScore(lesson.minPassingScore);
    setLessonKeyPoints(lesson.keyPoints?.length ? [...lesson.keyPoints] : ['']);
    setLessonQuiz(lesson.quiz?.length ? JSON.parse(JSON.stringify(lesson.quiz)) : []);
    setModalMode('edit');
  };

  // File Upload Handlers (Direct to Firebase Storage)
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'video' | 'audio' | 'pdf'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'video') {
      setVideoUploadProgress(1);
      const res = await uploadCurriculumMedia(file, 'videos', (p) => setVideoUploadProgress(p));
      setLessonVideoUrl(res.url);
      setVideoUploadProgress(null);
      showToast(`تم رفع الفيديو (${file.name}) إلى Storage وحفظ الرابط بنجاح!`);
    } else if (type === 'audio') {
      setAudioUploadProgress(1);
      const res = await uploadCurriculumMedia(file, 'audios', (p) => setAudioUploadProgress(p));
      setLessonAudioUrl(res.url);
      setAudioUploadProgress(null);
      showToast(`تم رفع المقطع الصوتي (${file.name}) إلى Storage وحفظ الرابط بنجاح!`);
    } else if (type === 'pdf') {
      setPdfUploadProgress(1);
      const res = await uploadCurriculumMedia(file, 'pdfs', (p) => setPdfUploadProgress(p));
      setLessonPdfUrl(res.url);
      if (!lessonPdfTitle) setLessonPdfTitle(file.name);
      setPdfUploadProgress(null);
      showToast(`تم رفع ملف PDF (${file.name}) إلى Storage وحفظ الرابط بنجاح!`);
    }
  };

  // Save Lesson (Create or Update)
  const handleSaveLesson = async () => {
    if (!lessonTitle.trim()) {
      alert('يرجى كتابة عنوان الدرس أولاً.');
      return;
    }

    const filteredKeyPoints = lessonKeyPoints.filter((kp) => kp.trim().length > 0);
    const validQuiz = lessonQuiz.filter((q) => q.question.trim().length > 0);

    const updatedCurriculum = [...curriculum];
    const chapIndex = updatedCurriculum.findIndex((c) => c.id === targetChapterId);
    if (chapIndex === -1) return;

    const chapter = { ...updatedCurriculum[chapIndex] };
    const lessons = [...chapter.lessons];

    if (modalMode === 'create') {
      const newLessonId = `les-${targetChapterId.replace('chap-', '')}-${Date.now().toString().slice(-4)}`;
      const newLesson: TajweedLesson = {
        id: newLessonId,
        chapterId: targetChapterId,
        order: lessons.length + 1,
        title: lessonTitle.trim(),
        durationMinutes: Number(lessonDuration) || 15,
        description: lessonDescription.trim() || lessonTitle.trim(),
        textContent: lessonTextContent.trim() || lessonDescription.trim(),
        videoUrl: lessonVideoUrl.trim() || 'https://www.youtube-nocookie.com/embed/H6WTnSZ6G-0',
        videoSpeaker: lessonSpeaker.trim(),
        audioUrl: lessonAudioUrl.trim(),
        pdfUrl: lessonPdfUrl.trim(),
        pdfTitle: lessonPdfTitle.trim() || `ملخص درس: ${lessonTitle.trim()}`,
        poeticVerse: lessonPoeticVerse.trim(),
        keyPoints: filteredKeyPoints.length ? filteredKeyPoints : ['تطبيق أحكام التجويد بدقة وإتقان.'],
        quiz: validQuiz.length ? validQuiz : [
          {
            id: `q-${Date.now()}-default`,
            question: `ما هو المحور الأساسي لدرس (${lessonTitle})؟`,
            options: ['الاستيعاب والتطبيق العملي', 'القراءة السريعة', 'التخفيف دون ضوابط', 'الحفظ فقط'],
            correctIndex: 0,
            explanation: 'التطبيق العملي والاستيعاب التام لقواعد التجويد هو الغاية الأساسية.'
          }
        ],
        minPassingScore: lessonCustomScore ? Number(lessonCustomScore) : undefined,
        practicalRequirement: {
          title: `تطبيق عملي لدرس ${lessonTitle}`,
          instruction: 'استمع للتسجيل وسجل تلاوتك لتطبيق القواعد المتعلمة في هذا الدرس.',
          versesToRecite: [
            {
              text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
              surah: 'الفاتحة - آية 1',
              ruleToApply: 'التطبيق الصحيح لمخارج الحروف وصفاتها وأحكامها'
            }
          ]
        }
      };

      lessons.push(newLesson);
      chapter.lessons = lessons;
      updatedCurriculum[chapIndex] = chapter;
      await saveActiveCurriculum(updatedCurriculum);
      setCurriculum(updatedCurriculum);
      showToast(`تمت إضافة درس (${newLesson.title}) بنجاح!`);
    } else if (modalMode === 'edit' && editingLessonId) {
      const lesIndex = lessons.findIndex((l) => l.id === editingLessonId);
      if (lesIndex !== -1) {
        lessons[lesIndex] = {
          ...lessons[lesIndex],
          title: lessonTitle.trim(),
          durationMinutes: Number(lessonDuration) || 15,
          description: lessonDescription.trim(),
          textContent: lessonTextContent.trim(),
          videoUrl: lessonVideoUrl.trim(),
          videoSpeaker: lessonSpeaker.trim(),
          audioUrl: lessonAudioUrl.trim(),
          pdfUrl: lessonPdfUrl.trim(),
          pdfTitle: lessonPdfTitle.trim(),
          poeticVerse: lessonPoeticVerse.trim(),
          keyPoints: filteredKeyPoints,
          quiz: validQuiz,
          minPassingScore: lessonCustomScore ? Number(lessonCustomScore) : undefined,
        };

        chapter.lessons = lessons;
        updatedCurriculum[chapIndex] = chapter;
        await saveActiveCurriculum(updatedCurriculum);
        setCurriculum(updatedCurriculum);
        showToast(`تم تحديث بيانات الدرس (${lessonTitle}) بنجاح!`);
      }
    }

    setModalMode(null);
  };

  // Delete Lesson
  const handleDeleteLesson = async (chapterId: string, lessonId: string, lessonTitle: string) => {
    if (!confirm(`هل أنت متأكد من حذف الدرس: "${lessonTitle}" من المنهج؟`)) return;

    const updated = [...curriculum];
    const chapIndex = updated.findIndex((c) => c.id === chapterId);
    if (chapIndex === -1) return;

    const chap = { ...updated[chapIndex] };
    chap.lessons = chap.lessons.filter((l) => l.id !== lessonId);
    // Re-index orders
    chap.lessons.forEach((l, idx) => {
      l.order = idx + 1;
    });

    updated[chapIndex] = chap;
    await saveActiveCurriculum(updated);
    setCurriculum(updated);
    showToast(`تم حذف درس (${lessonTitle}) بنجاح.`);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-emerald-900 border-2 border-emerald-400 text-emerald-100 shadow-2xl font-bold text-xs sm:text-sm animate-bounce flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#044223] via-[#06552e] to-[#044223] border border-emerald-500/40 shadow-xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
                <GraduationCap className="w-6 h-6" />
              </span>
              <div>
                <h2 className="text-lg sm:text-xl font-black font-amiri tracking-wide text-amber-200">
                  إدارة المنهج التعليمي المتدرج ونظام الاختبارات
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100 font-medium">
                  مقرأة رحاب القرآن • ترتيب الأبواب والدروس، تحديد نسب الاجتياز، وإدارة وسائط Storage
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-600 text-xs font-bold text-amber-300">
              إجمالي الدروس: {curriculum.reduce((acc, c) => acc + c.lessons.length, 0)} درس
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-600 text-xs font-bold text-emerald-300">
              7 أبواب متدرجة
            </span>
          </div>
        </div>
      </div>

      {/* Supervisor Sub-Tabs: Curriculum vs PDF Document Settings */}
      <div className="flex items-center gap-3 p-1.5 bg-[#0a1810] border border-emerald-800/80 rounded-2xl">
        <button
          type="button"
          onClick={() => setSupervisorTab('curriculum')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            supervisorTab === 'curriculum'
              ? 'bg-[#046A38] text-white shadow-md border border-[#C5A059]'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-[#C5A059]" />
          <span>إدارة المنهج والدروس التجويدية</span>
        </button>

        <button
          type="button"
          onClick={() => setSupervisorTab('pdf_settings')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            supervisorTab === 'pdf_settings'
              ? 'bg-[#046A38] text-white shadow-md border border-[#C5A059]'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <FileText className="w-4 h-4 text-[#C5A059]" />
          <span>إعدادات وثائق PDF وملخصات التجويد الرسمية (Firebase)</span>
        </button>
      </div>

      {supervisorTab === 'pdf_settings' ? (
        <TajweedPdfSettingsManager />
      ) : (
        <>
          {/* 1. ADMINISTRATION SETTINGS: PASSING SCORE & LOCKING */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-700" />
                <h3 className="font-black text-base text-slate-900">
                  ضوابط الإدارة لنسبة النجاح وفتح الدروس المتتالية
                </h3>
              </div>
          <button
            onClick={handleSaveSettings}
            disabled={isSavingSettings}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSavingSettings ? 'جاري الحفظ...' : 'حفظ الضوابط'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Minimum Passing Score */}
          <div className="p-4 rounded-2xl bg-[#F9F6F0] border border-amber-200/80 space-y-2">
            <label className="block text-xs font-extrabold text-slate-800">
              نسبة النجاح المطلوبة لفتح الدرس التالي:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="50"
                max="100"
                value={settings.minPassingScorePercent}
                onChange={(e) => setSettings({ ...settings, minPassingScorePercent: Number(e.target.value) })}
                className="w-24 px-3 py-2 text-center text-lg font-black text-emerald-800 bg-white rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-base font-black text-slate-700">%</span>
            </div>
            {/* Presets */}
            <div className="flex items-center gap-1.5 pt-1">
              {[70, 75, 80, 85, 90].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSettings({ ...settings, minPassingScorePercent: preset })}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    settings.minPassingScorePercent === preset
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-emerald-50 border border-slate-200'
                  }`}
                >
                  {preset}%
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              لن يتمكن الطالب من الانتقال للدرس التالي إلا بتحقيق هذه النسبة في الاختبار الذاتي.
            </p>
          </div>

          {/* Sequential Gating Toggle */}
          <div className="p-4 rounded-2xl bg-[#F9F6F0] border border-emerald-200/80 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-800">إلزامية التدرج وقفل التالي:</span>
                <input
                  type="checkbox"
                  checked={settings.lockNextUntilPassed}
                  onChange={(e) => setSettings({ ...settings, lockNextUntilPassed: e.target.checked })}
                  className="w-5 h-5 accent-emerald-700 rounded cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                عند التفعيل، يقفل الدرس التالي تلقائياً حتى يجتاز الطالب اختبار الدرس السابق بالدرجة المحددة.
              </p>
            </div>
            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
              settings.lockNextUntilPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
            }`}>
              <Lock className="w-3 h-3" />
              <span>{settings.lockNextUntilPassed ? 'نظام القفل المتسلسل نشط' : 'التصفح المفتوح لجميع الدروس'}</span>
            </span>
          </div>

          {/* Retake Quizzes */}
          <div className="p-4 rounded-2xl bg-[#F9F6F0] border border-sky-200/80 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-800">السماح بإعادة المحاولات:</span>
                <input
                  type="checkbox"
                  checked={settings.allowRetakes}
                  onChange={(e) => setSettings({ ...settings, allowRetakes: e.target.checked })}
                  className="w-5 h-5 accent-sky-700 rounded cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                يسمح للطالب بإعادة الاختبار لتحسين نسبته ودرجته مع تسجيل عدد المحاولات تلقائياً.
              </p>
            </div>
            <span className="text-[11px] text-sky-800 font-bold bg-sky-100 px-2 py-0.5 rounded-full w-fit">
              حفظ آلي للمحاولات والتواريخ
            </span>
          </div>
        </div>
      </div>

      {/* 2. SEQUENTIAL CURRICULUM CHAPTERS & LESSONS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-black text-slate-900 font-amiri flex items-center gap-2">
            <span>منهج التجويد المتدرج (7 أبواب متتابعة)</span>
          </h3>
          <span className="text-xs text-slate-500">
            اضغط على الدرس لتعديله أو استخدم الأسهم لإعادة ترتيبه
          </span>
        </div>

        {curriculum.map((chapter, chapIdx) => {
          const isExpanded = expandedChapterIds[chapter.id] !== false;

          return (
            <div 
              key={chapter.id}
              className="rounded-3xl bg-white border border-slate-200 shadow-xs overflow-hidden transition-all"
            >
              {/* Chapter Header */}
              <div 
                onClick={() => toggleChapterExpand(chapter.id)}
                className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-white to-amber-50/40 border-b border-slate-100 flex items-center justify-between cursor-pointer select-none hover:bg-emerald-100/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black text-sm">
                    {chapIdx + 1}
                  </span>
                  <div>
                    <h4 className="text-base sm:text-lg font-black text-slate-900 font-amiri">
                      {chapter.title}
                    </h4>
                    <p className="text-xs text-slate-600 line-clamp-1">
                      {chapter.subtitle} • {chapter.lessons.length} دروس
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenCreateModal(chapter.id);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة درس في هذا الباب</span>
                  </button>

                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Lessons List in Chapter */}
              {isExpanded && (
                <div className="divide-y divide-slate-100">
                  {chapter.lessons.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      لا توجد دروس في هذا الباب حالياً. انقر على &quot;إضافة درس&quot; للبدء.
                    </div>
                  ) : (
                    chapter.lessons.map((lesson, lesIdx) => (
                      <div 
                        key={lesson.id}
                        className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                      >
                        <div className="flex items-start gap-3.5">
                          <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                            {lesIdx + 1}
                          </span>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="font-bold text-sm sm:text-base text-slate-900">
                                {lesson.title}
                              </h5>
                              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                {lesson.durationMinutes} دقيقة
                              </span>
                              {lesson.minPassingScore && (
                                <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                  نجاح خاص: {lesson.minPassingScore}%
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-1">
                              {lesson.description}
                            </p>

                            {/* Tags: Media availability */}
                            <div className="flex items-center gap-2 pt-1 text-[11px] font-medium text-slate-600 flex-wrap">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${
                                lesson.videoUrl ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                              }`}>
                                <Video className="w-3 h-3" />
                                <span>{lesson.videoUrl ? 'فيديو متاح' : 'بلا فيديو'}</span>
                              </span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${
                                lesson.audioUrl ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-400'
                              }`}>
                                <Volume2 className="w-3 h-3" />
                                <span>{lesson.audioUrl ? 'تسجيل صوتي' : 'بلا صوت'}</span>
                              </span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${
                                lesson.pdfUrl ? 'bg-sky-50 text-sky-700' : 'bg-slate-100 text-slate-400'
                              }`}>
                                <FileText className="w-3 h-3" />
                                <span>{lesson.pdfUrl ? 'ملخص PDF' : 'ملخص تلقائي'}</span>
                              </span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700">
                                <HelpCircle className="w-3 h-3" />
                                <span>{lesson.quiz.length} أسئلة اختبار</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons: Reorder, Edit, Delete */}
                        <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
                          {/* Move Up */}
                          <button
                            type="button"
                            disabled={lesIdx === 0}
                            onClick={() => handleMoveLesson(chapter.id, lesson.id, 'up')}
                            className={`p-2 rounded-xl border transition-all ${
                              lesIdx === 0 
                                ? 'opacity-30 cursor-not-allowed border-slate-200' 
                                : 'border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer'
                            }`}
                            title="تقديم الدرس للأعلى"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>

                          {/* Move Down */}
                          <button
                            type="button"
                            disabled={lesIdx === chapter.lessons.length - 1}
                            onClick={() => handleMoveLesson(chapter.id, lesson.id, 'down')}
                            className={`p-2 rounded-xl border transition-all ${
                              lesIdx === chapter.lessons.length - 1
                                ? 'opacity-30 cursor-not-allowed border-slate-200'
                                : 'border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer'
                            }`}
                            title="تأخير الدرس للأسفل"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>

                          {/* Edit Lesson */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(lesson, chapter.id)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
                            <span>تعديل</span>
                          </button>

                          {/* Delete Lesson */}
                          <button
                            type="button"
                            onClick={() => handleDeleteLesson(chapter.id, lesson.id, lesson.title)}
                            className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-all cursor-pointer"
                            title="حذف الدرس"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      </>
      )}

      {/* 3. MODAL: ADD / EDIT LESSON WITH STORAGE UPLOADS */}
      {modalMode && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-800 to-emerald-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black font-amiri text-amber-200">
                  {modalMode === 'create' ? 'إضافة درس جديد إلى المنهج' : 'تعديل بيانات ومحتوى الدرس'}
                </h3>
                <p className="text-xs text-emerald-100">
                  خزّن الفيديو والصوت وPDF عبر روابط خفيفة أو ارفعها إلى Storage بدون حفظ أحجام في قاعدة البيانات
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              
              {/* Title & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">عنوان الدرس:</label>
                  <input
                    type="text"
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    placeholder="مثال: أحكام النون الساكنة والتنوين - الإظهار الحلقي"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">مدة الدرس (بالدقائق):</label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={lessonDuration}
                    onChange={(e) => setLessonDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Description & Text Explanation */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">الملخص الموجز للدرس:</label>
                <input
                  type="text"
                  value={lessonDescription}
                  onChange={(e) => setLessonDescription(e.target.value)}
                  placeholder="وصف مختصر يظهر في فهرس الدروس وقائمة المحتويات"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">📖 الشرح النصي المفصل والتأصيلي (يقرأه الطالب في تبويب الشرح):</label>
                <textarea
                  rows={4}
                  value={lessonTextContent}
                  onChange={(e) => setLessonTextContent(e.target.value)}
                  placeholder="اكتب القواعد والتعريفات والأمثلة القرآنية والشواهد بالتفصيل..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed font-sans"
                />
              </div>

              {/* Poetic Verse & Speaker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">بيت شعري (تحفة الأطفال / الجزرية):</label>
                  <input
                    type="text"
                    value={lessonPoeticVerse}
                    onChange={(e) => setLessonPoeticVerse(e.target.value)}
                    placeholder="مثال: لِلنُّونِ إِنْ تَسْكُنْ وَلِلتَّنْوِينِ ... أَرْبَعُ أَحْكَامٍ فَخُذْ تَبْيِينِي"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-serif text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">المحاضر / الشيخ المقرئ:</label>
                  <input
                    type="text"
                    value={lessonSpeaker}
                    onChange={(e) => setLessonSpeaker(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* MEDIA SECTION: VIDEO, AUDIO, PDF WITH DIRECT STORAGE UPLOAD */}
              <div className="p-4 rounded-2xl bg-[#F9F6F0] border border-emerald-200/80 space-y-4">
                <h4 className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>وسائط الدرس الخفيفة (تخزين في Storage مع حفظ الرابط فقط في Firestore):</span>
                </h4>

                {/* 1. Video URL + Upload */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>🎥 رابط الفيديو (YouTube Embed أو مسار MP4):</span>
                    <label className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer">
                      <Upload className="w-3 h-3" />
                      <span>{videoUploadProgress !== null ? `جاري الرفع ${videoUploadProgress}%...` : 'رفع ملف فيديو إلى Storage'}</span>
                      <input 
                        type="file" 
                        accept="video/*" 
                        className="hidden" 
                        onChange={(e) => handleFileUpload(e, 'video')} 
                        disabled={videoUploadProgress !== null}
                      />
                    </label>
                  </label>
                  <input
                    type="text"
                    value={lessonVideoUrl}
                    onChange={(e) => setLessonVideoUrl(e.target.value)}
                    placeholder="https://www.youtube-nocookie.com/embed/..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                {/* 2. Audio URL + Upload */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>🔊 رابط المقطع الصوتي التعليمي (MP3):</span>
                    <label className="text-[11px] font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer">
                      <Upload className="w-3 h-3" />
                      <span>{audioUploadProgress !== null ? `جاري الرفع ${audioUploadProgress}%...` : 'رفع تسجيل صوتي إلى Storage'}</span>
                      <input 
                        type="file" 
                        accept="audio/*" 
                        className="hidden" 
                        onChange={(e) => handleFileUpload(e, 'audio')} 
                        disabled={audioUploadProgress !== null}
                      />
                    </label>
                  </label>
                  <input
                    type="text"
                    value={lessonAudioUrl}
                    onChange={(e) => setLessonAudioUrl(e.target.value)}
                    placeholder="https://everyayah.com/data/..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                {/* 3. PDF URL + Upload */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>📄 رابط ملف التلخيص PDF:</span>
                    <label className="text-[11px] font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1 cursor-pointer">
                      <Upload className="w-3 h-3" />
                      <span>{pdfUploadProgress !== null ? `جاري الرفع ${pdfUploadProgress}%...` : 'رفع ملف PDF إلى Storage'}</span>
                      <input 
                        type="file" 
                        accept="application/pdf" 
                        className="hidden" 
                        onChange={(e) => handleFileUpload(e, 'pdf')} 
                        disabled={pdfUploadProgress !== null}
                      />
                    </label>
                  </label>
                  <input
                    type="text"
                    value={lessonPdfUrl}
                    onChange={(e) => setLessonPdfUrl(e.target.value)}
                    placeholder="https://archive.org/.../summary.pdf"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* 4. QUIZ QUESTIONS BUILDER */}
              <div className="p-4 rounded-2xl bg-white border border-slate-300 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-emerald-700" />
                    <span>✏️ أسئلة الاختبار الذاتي ({lessonQuiz.length} أسئلة):</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setLessonQuiz([
                        ...lessonQuiz,
                        {
                          id: `q-${Date.now()}-${lessonQuiz.length + 1}`,
                          question: '',
                          options: ['', '', '', ''],
                          correctIndex: 0,
                          explanation: ''
                        }
                      ]);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>إضافة سؤال</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {lessonQuiz.map((q, qIdx) => (
                    <div key={q.id || qIdx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-emerald-800">
                          السؤال {qIdx + 1}:
                        </span>
                        {lessonQuiz.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setLessonQuiz(lessonQuiz.filter((_, idx) => idx !== qIdx))}
                            className="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer"
                          >
                            حذف السؤال
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        value={q.question}
                        onChange={(e) => {
                          const updated = [...lessonQuiz];
                          updated[qIdx].question = e.target.value;
                          setLessonQuiz(updated);
                        }}
                        placeholder="نص السؤال (مثال: ما هو حكم النون الساكنة في قوله تعالى...)"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                      />

                      {/* Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-1.5">
                            <input
                              type="radio"
                              name={`correct_${qIdx}`}
                              checked={q.correctIndex === optIdx}
                              onChange={() => {
                                const updated = [...lessonQuiz];
                                updated[qIdx].correctIndex = optIdx;
                                setLessonQuiz(updated);
                              }}
                              className="accent-emerald-700 cursor-pointer"
                              title="حدد هذا الخيار كإجابة صحيحة"
                            />
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const updated = [...lessonQuiz];
                                updated[qIdx].options[optIdx] = e.target.value;
                                setLessonQuiz(updated);
                              }}
                              placeholder={`الخيار ${optIdx + 1}`}
                              className={`w-full px-2.5 py-1 text-xs rounded-lg border ${
                                q.correctIndex === optIdx 
                                  ? 'border-emerald-500 bg-emerald-50/50 font-bold' 
                                  : 'border-slate-300 bg-white'
                              }`}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Explanation */}
                      <input
                        type="text"
                        value={q.explanation}
                        onChange={(e) => {
                          const updated = [...lessonQuiz];
                          updated[qIdx].explanation = e.target.value;
                          setLessonQuiz(updated);
                        }}
                        placeholder="التعليل العلمي للإجابة الصحيحة يظهر للطالب بعد التسليم..."
                        className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-xs text-slate-600 bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-800 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleSaveLesson}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold shadow-md cursor-pointer transition-all"
              >
                {modalMode === 'create' ? 'حفظ وإضافة الدرس للمنهج' : 'تحديث بيانات الدرس'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
