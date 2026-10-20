import React, { useState, useEffect } from "react";
import { 
  BookMarked, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Mic, 
  Clock, 
  Award, 
  Play, 
  Pause, 
  FileText, 
  Plus, 
  Calendar, 
  Send, 
  ChevronDown, 
  RotateCcw,
  Check,
  X
} from "lucide-react";
import { 
  ScientificMatn, 
  MatnRecitationSubmission, 
  MatnWeeklyExam, 
  MasteryLevel 
} from "../../types/mutun";
import { 
  fetchScientificMutun, 
  getTeacherMatnSubmissions, 
  reviewMatnSubmissionByTeacher, 
  createWeeklyExam 
} from "../../services/mutunService";

interface TeacherMutunManagerProps {
  teacherId: string;
  teacherName: string;
  assignedHalqaIds: string[];
  assignedHalqaTitle?: string;
  studentsList: { id: string; name: string; halqaId?: string }[];
}

export const TeacherMutunManager: React.FC<TeacherMutunManagerProps> = ({
  teacherId,
  teacherName,
  assignedHalqaIds,
  assignedHalqaTitle = "حلقات الإقراء والتحفيظ",
  studentsList
}) => {
  const [mutun, setMutun] = useState<ScientificMatn[]>([]);
  const [submissions, setSubmissions] = useState<MatnRecitationSubmission[]>([]);
  const [activeTab, setActiveTab] = useState<"submissions" | "students" | "exams">("submissions");
  const [isLoading, setIsLoading] = useState(true);

  // حالة مراجعة تسميع محدد
  const [selectedSub, setSelectedSub] = useState<MatnRecitationSubmission | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [masteryScore, setMasteryScore] = useState(90);
  const [masteryLevel, setMasteryLevel] = useState<MasteryLevel>("excellent");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // حالة إنشاء اختبار أسبوعي جديد
  const [showExamModal, setShowExamModal] = useState(false);
  const [examTitle, setExamTitle] = useState("الاختبار الأسبوعي في تحفة الأطفال");
  const [examMatnId, setExamMatnId] = useState("tuhfat-al-atfal");
  const [examDuration, setExamDuration] = useState(30);
  const [examPassingScore, setExamPassingScore] = useState(80);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const [mutunList, subs] = await Promise.all([
          fetchScientificMutun(),
          getTeacherMatnSubmissions(teacherId, assignedHalqaIds[0])
        ]);
        if (!isMounted) return;
        setMutun(mutunList);
        setSubmissions(subs);
      } catch (err) {
        console.warn("[TeacherMutunManager] Load error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [teacherId, assignedHalqaIds]);

  // تنفيذ مراجعة التسميع
  const handleReviewSubmission = async (isApproved: boolean) => {
    if (!selectedSub) return;
    setIsSubmittingReview(true);
    try {
      const matn = mutun.find(m => m.id === selectedSub.matnId) || mutun[0];
      const nextGroupNum = selectedSub.groupNumber + 1;
      const nextGroup = matn?.groups.find(g => g.groupNumber === nextGroupNum);

      await reviewMatnSubmissionByTeacher(
        selectedSub.id,
        selectedSub.studentId,
        selectedSub.matnId,
        selectedSub.groupId,
        nextGroup ? nextGroup.id : selectedSub.groupId,
        nextGroup ? nextGroup.groupNumber : selectedSub.groupNumber,
        isApproved,
        feedbackText,
        masteryScore,
        masteryLevel,
        teacherName
      );

      // تحديث القائمة محلياً
      setSubmissions(prev => prev.map(s => 
        s.id === selectedSub.id 
          ? { ...s, status: isApproved ? "approved" : "needs_revision", teacherFeedback: feedbackText } 
          : s
      ));
      setSelectedSub(null);
      setFeedbackText("");
      alert(isApproved ? "تم اعتماد التسميع وفتح المجموعة التالية للطالب!" : "تم طلب إعادة المراجعة والتكرار من الطالب.");
    } catch (err) {
      alert("حدث خطأ أثناء حفظ الاعتماد. يرجى إعادة المحاولة.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // إنشاء الاختبار الأسبوعي
  const handleCreateExam = async () => {
    try {
      const chosenMatn = mutun.find(m => m.id === examMatnId) || mutun[0];
      await createWeeklyExam({
        title: examTitle,
        matnId: chosenMatn.id,
        matnTitle: chosenMatn.title,
        teacherId,
        teacherName,
        halqaId: assignedHalqaIds[0] || "halqa-general",
        halqaName: assignedHalqaTitle,
        fromGroup: 1,
        toGroup: 3,
        verseRange: "الأبيات (1 - 15)",
        scheduledAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        durationMinutes: examDuration,
        passingScore: examPassingScore,
        maxAttempts: 2,
        isActive: true,
        questions: [
          {
            id: "eq-1",
            type: "multiple_choice",
            prompt: "ما هو حكم النون الساكنة في قوله تعالى: (مِن وَالٍ)؟",
            options: ["إدغام بغنة", "إظهار حلقي", "إقلاب", "إخفاء حقيقي"],
            correctAnswer: "إدغام بغنة",
            points: 25,
            explanation: "الواو من حروف (ينمو) الأربعة للإدغام بغنة."
          },
          {
            id: "eq-2",
            type: "fill_blank",
            prompt: "أكمل شطر البيت: (لِلنُّونِ إِنْ تَسْكُنْ وَلِلتَّنْوِينِ ... أَرْبَعُ أَحْكَامٍ فَخُذْ ______)",
            options: ["تَبْيِينِي", "تَعْلِيمِي", "تَحْقِيقِي", "تَقْرِيبِي"],
            correctAnswer: "تَبْيِينِي",
            points: 25,
            explanation: "البيت السادس من تحفة الأطفال: أَرْبَعُ أَحْكَامٍ فَخُذْ تَبْيِينِي."
          }
        ]
      });
      setShowExamModal(false);
      alert("تم إنشاء الاختبار الأسبوعي وتفعيله بنجاح لطلاب الحلقة!");
    } catch (err) {
      alert("حدث خطأ أثناء إنشاء الاختبار.");
    }
  };

  const pendingCount = submissions.filter(s => s.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* هيدر القسم */}
      <div className="bg-white rounded-3xl p-6 border-2 border-[#C5A059]/40 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#046A38] text-white flex items-center justify-center shrink-0 border border-[#C5A059]/50 shadow-xs">
            <BookMarked className="w-6 h-6 text-[#C5A059]" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-serif text-[#046A38] flex items-center gap-2">
              <span>إدارة حفظ المتون العلمية</span>
              <span className="text-xs font-sans font-bold bg-[#C5A059]/20 text-[#046A38] px-2.5 py-0.5 rounded-full border border-[#C5A059]/40">
                حلقة: {assignedHalqaTitle}
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              متابعة حفظ طلاب حلقتك لتحفة الأطفال والجزرية، واعتماد التسميعات والاختبارات الأسبوعية
            </p>
          </div>
        </div>

        {/* أزرار التبديل */}
        <div className="flex items-center gap-2 bg-[#F9F6F0] p-1.5 rounded-2xl border border-stone-200 w-full md:w-auto">
          <button
            onClick={() => setActiveTab("submissions")}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "submissions"
                ? "bg-[#046A38] text-white shadow-xs"
                : "text-slate-600 hover:bg-white"
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>التسميعات الواردة</span>
            {pendingCount > 0 && (
              <span className="bg-amber-400 text-slate-900 text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("students")}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "students"
                ? "bg-[#046A38] text-white shadow-xs"
                : "text-slate-600 hover:bg-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>طلاب الحلقة والتقدم</span>
          </button>

          <button
            onClick={() => setActiveTab("exams")}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "exams"
                ? "bg-[#046A38] text-white shadow-xs"
                : "text-slate-600 hover:bg-white"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>الاختبارات الأسبوعية</span>
          </button>
        </div>
      </div>

      {/* تبويب 1: التسميعات الواردة */}
      {activeTab === "submissions" && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>قائمة التسميعات بانتظار الاعتماد</span>
              <span className="text-xs text-slate-500 font-normal">
                ({submissions.length} تسميع مسجل)
              </span>
            </h3>
          </div>

          {submissions.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto opacity-60" />
              <p className="text-xs text-slate-500 font-medium">
                لا توجد تسميعات معلقة حالياً. جميع طلاب حلقتك معتمدون!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub) => (
                <div 
                  key={sub.id} 
                  className="p-4 rounded-2xl bg-[#F9F6F0] border border-slate-200 hover:border-[#C5A059]/60 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      sub.status === "approved"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : sub.status === "needs_revision"
                        ? "bg-amber-100 text-amber-800 border-amber-300"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}>
                      <Mic className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900">{sub.studentName}</h4>
                        <span className="text-[10px] font-bold bg-[#046A38] text-white px-2 py-0.5 rounded-full">
                          {sub.matnTitle}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          المجموعة {sub.groupNumber} ({sub.verseRange})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>تاريخ الإرسال: {new Date(sub.submittedAt).toLocaleDateString("ar-SA")}</span>
                      </div>

                      {/* مشغل الصوت إذا كان متاحاً */}
                      {sub.audioBase64 && (
                        <div className="pt-1">
                          <audio src={sub.audioBase64} controls className="h-8 max-w-xs" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* إجراء المراجعة */}
                  <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    {sub.status === "pending" ? (
                      <button
                        onClick={() => setSelectedSub(sub)}
                        className="px-4 py-2 rounded-xl bg-[#046A38] hover:bg-[#03542c] text-white text-xs font-bold shadow-xs border border-[#C5A059] cursor-pointer transition-all"
                      >
                        مراجعة واعتماد التسميع
                      </button>
                    ) : (
                      <span className={`text-xs font-bold px-3 py-1 rounded-xl border ${
                        sub.status === "approved"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {sub.status === "approved" ? "تم الاعتماد" : "طلب إعادة"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* تبويب 2: طلاب الحلقة والتقدم */}
      {activeTab === "students" && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              قائمة طلاب الحلقة ({studentsList.length} طالباً)
            </h3>
            <span className="text-xs text-slate-500 font-sans">
              المتون المسندة: تحفة الأطفال والمقدمة الجزرية
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {studentsList.map((stu) => (
              <div 
                key={stu.id}
                className="p-4 rounded-2xl bg-[#F9F6F0] border border-stone-200 hover:border-[#C5A059] transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{stu.name}</span>
                  <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                    نشط
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  المتن الحالي: <strong>تحفة الأطفال</strong>
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                  <span>المجموعة الحالية: 1</span>
                  <span className="text-[#046A38] font-bold">ملتزم بالخطة</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* تبويب 3: الاختبارات الأسبوعية */}
      {activeTab === "exams" && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800">الاختبارات الأسبوعية التراكمية</h3>
              <p className="text-xs text-slate-500 font-sans">
                لا تُتاح الاختبارات للطلاب إلا بعد إنشائها وتفعيلها من قِبلك
              </p>
            </div>
            <button
              onClick={() => setShowExamModal(true)}
              className="px-4 py-2 rounded-xl bg-[#046A38] hover:bg-[#03542c] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs border border-[#C5A059] cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#C5A059]" />
              <span>إنشاء اختبار أسبوعي جديد</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-[#F9F6F0] border border-slate-200 text-xs text-slate-600 leading-relaxed">
            💡 يمكنك إنشاء اختبار أسبوعي يجمع المجموعات التي أتمها الطلاب لقياس رسوخ حفظ المتن وفهم الأحكام التجويدية والتطبيق عليها.
          </div>
        </div>
      )}

      {/* نافذة مراجعة التسميع المنبثقة */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn" dir="rtl">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-2 border-[#C5A059] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold font-serif text-[#046A38]">
                مراجعة تسميع الطالب: {selectedSub.studentName}
              </h3>
              <button 
                onClick={() => setSelectedSub(null)} 
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#F9F6F0] text-xs space-y-1">
              <p><strong>المتن:</strong> {selectedSub.matnTitle}</p>
              <p><strong>المجموعة:</strong> {selectedSub.groupNumber} ({selectedSub.verseRange})</p>
              {selectedSub.audioBase64 && (
                <div className="pt-2">
                  <audio src={selectedSub.audioBase64} controls className="w-full" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                ملاحظات الشيخ والتوجيهات التجويدية:
              </label>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="اكتب للطالب توجيهات الأداء ومخارج الحروف والصفات..."
                rows={3}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#046A38]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">الدرجة (من 100):</label>
                <input
                  type="number"
                  value={masteryScore}
                  onChange={(e) => setMasteryScore(Number(e.target.value))}
                  min={50}
                  max={100}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">مستوى الإتقان:</label>
                <select
                  value={masteryLevel}
                  onChange={(e) => setMasteryLevel(e.target.value as MasteryLevel)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                >
                  <option value="excellent">ممتاز</option>
                  <option value="very_good">جيد جداً</option>
                  <option value="good">جيد</option>
                  <option value="needs_revision">يحتاج مراجعة</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => handleReviewSubmission(false)}
                disabled={isSubmittingReview}
                className="px-4 py-2.5 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-bold transition-all cursor-pointer border border-amber-200"
              >
                طلب إعادة المراجعة
              </button>

              <button
                onClick={() => handleReviewSubmission(true)}
                disabled={isSubmittingReview}
                className="px-5 py-2.5 rounded-xl bg-[#046A38] hover:bg-[#03542c] text-white text-xs font-bold shadow-md border border-[#C5A059] transition-all cursor-pointer"
              >
                {isSubmittingReview ? "جاري الحفظ..." : "اعتماد وفتح المجموعة التالية"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة إنشاء اختبار أسبوعي */}
      {showExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn" dir="rtl">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-[#C5A059] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold font-serif text-[#046A38]">
                إنشاء اختبار أسبوعي في المتون
              </h3>
              <button 
                onClick={() => setShowExamModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">عنوان الاختبار:</label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">المتن المستهدف:</label>
                <select
                  value={examMatnId}
                  onChange={(e) => setExamMatnId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                >
                  {mutun.map(m => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">المدة (بالدقائق):</label>
                  <input
                    type="number"
                    value={examDuration}
                    onChange={(e) => setExamDuration(Number(e.target.value))}
                    min={10}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">درجة الاجتياز (%):</label>
                  <input
                    type="number"
                    value={examPassingScore}
                    onChange={(e) => setExamPassingScore(Number(e.target.value))}
                    min={60}
                    max={100}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setShowExamModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleCreateExam}
                className="px-5 py-2 rounded-xl bg-[#046A38] hover:bg-[#03542c] text-white text-xs font-bold shadow-md border border-[#C5A059] cursor-pointer"
              >
                تأكيد وتفعيل الاختبار
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};