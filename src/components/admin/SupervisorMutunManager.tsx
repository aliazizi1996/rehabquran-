import React, { useState, useEffect } from "react";
import { 
  BookMarked, 
  Plus, 
  Edit3, 
  CheckCircle2, 
  Settings, 
  Upload, 
  Save, 
  Trash2, 
  FileText, 
  TrendingUp, 
  Award, 
  Eye, 
  X,
  Sparkles
} from "lucide-react";
import { ScientificMatn } from "../../types/mutun";
import { fetchScientificMutun, saveScientificMatn } from "../../services/mutunService";

export const SupervisorMutunManager: React.FC = () => {
  const [mutun, setMutun] = useState<ScientificMatn[]>([]);
  const [selectedMatn, setSelectedMatn] = useState<ScientificMatn | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // نموذج إضافة متن جديد ديناميكياً
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newTotalVerses, setNewTotalVerses] = useState(50);
  const [newCategory, setNewCategory] = useState<"tajweed" | "qiraat" | "rasm">("tajweed");
  const [newDescription, setNewDescription] = useState("");
  const [newAudioUrl, setNewAudioUrl] = useState("");
  const [newEdition, setNewEdition] = useState("النسخة المحققة المعتمدة");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      try {
        const list = await fetchScientificMutun();
        if (!isMounted) return;
        setMutun(list);
        if (list.length > 0) setSelectedMatn(list[0]);
      } catch (err) {
        console.warn("[SupervisorMutunManager] Load error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, []);

  const handleCreateMatn = async () => {
    if (!newTitle.trim() || !newAuthor.trim()) {
      alert("يرجى إدخال اسم المتن والناظم.");
      return;
    }
    setIsSaving(true);
    try {
      const generatedId = `matn-${Date.now()}`;
      const newMatn: ScientificMatn = {
        id: generatedId,
        title: newTitle,
        author: newAuthor,
        category: newCategory,
        totalVerses: Number(newTotalVerses),
        defaultGroupSize: 5,
        audioUrl: newAudioUrl,
        description: newDescription || "متن علمي معتمد في مقرأة رحاب القرآن.",
        sourceEdition: newEdition,
        chapters: [
          { id: "chap-1", title: "المقدمة والباب الأول", fromVerse: 1, toVerse: 5 }
        ],
        groups: [
          {
            id: `${generatedId}-grp-1`,
            groupNumber: 1,
            title: "المجموعة الأولى",
            fromVerse: 1,
            toVerse: 5,
            explanationSummary: "شرح المجموعة الأولى المعتمد من المشرف.",
            verses: [
              {
                number: 1,
                sadr: "بَدَأْتُ بِاسْمِ اللَّهِ فِي النَّظْمِ أَوَّلَا",
                ajuz: "تَبَارَكَ رَحْمَانًا رَحِيمًا وَمَوْئِلَا",
                explanation: "افتتاح بالبسملة والثناء على الله عز وجل."
              }
            ],
            quizQuestions: []
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true
      };

      await saveScientificMatn(newMatn);
      setMutun(prev => [...prev, newMatn]);
      setSelectedMatn(newMatn);
      setShowAddModal(false);
      setNewTitle("");
      setNewAuthor("");
      alert("تمت إضافة المتن العلمي بنجاح وحفظه في السحابة!");
    } catch (err) {
      alert("حدث خطأ أثناء حفظ المتن.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* هيدر إدارة المتون للمشرف */}
      <div className="bg-white rounded-3xl p-6 border-2 border-[#C5A059]/40 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#046A38] text-white flex items-center justify-center shrink-0 border border-[#C5A059]/50 shadow-xs">
            <BookMarked className="w-6 h-6 text-[#C5A059]" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-serif text-[#046A38] flex items-center gap-2">
              <span>إدارة المنظومات والمتون العلمية</span>
              <span className="text-xs font-sans font-bold bg-[#C5A059]/20 text-[#046A38] px-2.5 py-0.5 rounded-full border border-[#C5A059]/40">
                لوحة المشرف العام
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              إضافة متون جديدة وتعديل المجموعات والشروحات المعتمدة وإسناد الخطط للحلقات دون الحاجة لتعديل الكود
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 rounded-xl bg-[#046A38] hover:bg-[#03542c] text-white font-bold text-xs flex items-center gap-2 shadow-md border border-[#C5A059] cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4 text-[#C5A059]" />
          <span>إضافة متن علمي جديد</span>
        </button>
      </div>

      {/* قائمة المتون المعتمدة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mutun.map((m) => (
          <div 
            key={m.id}
            onClick={() => setSelectedMatn(m)}
            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer space-y-3 ${
              selectedMatn?.id === m.id
                ? "bg-[#F9F6F0] border-[#046A38] shadow-md"
                : "bg-white border-stone-200 hover:border-[#C5A059]/60"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold font-mono bg-[#046A38] text-white px-2 py-0.5 rounded-full">
                {m.category}
              </span>
              <span className="text-xs font-bold text-[#C5A059]">
                {m.totalVerses} بيتاً
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold font-serif text-slate-900 line-clamp-1">
                {m.title}
              </h3>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                الناظم: {m.author}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
              <span>{m.groups.length} مجموعات معتمدة</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                نشط في الحلقات
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* تفاصيل المتن المختار ومجموعاته */}
      {selectedMatn && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold font-serif text-[#046A38]">
                تفاصيل ومجموعات: {selectedMatn.title}
              </h3>
              <p className="text-xs text-slate-500 font-sans">
                {selectedMatn.description}
              </p>
            </div>
            <span className="text-xs font-bold bg-[#F9F6F0] text-[#046A38] px-3 py-1.5 rounded-xl border border-[#C5A059]/40">
              المرجع: {selectedMatn.sourceEdition || "المقرأة الرسمية"}
            </span>
          </div>

          {/* استعراض المجموعات والأبواب */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700">المجموعات المقررة للطلاب:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedMatn.groups.map((grp) => (
                <div key={grp.id} className="p-3.5 rounded-2xl bg-[#F9F6F0] border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#046A38]">
                      المجموعة {grp.groupNumber}: {grp.title}
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      الأبيات ({grp.fromVerse} - {grp.toVerse})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2">
                    {grp.explanationSummary}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* نافذة إضافة متن جديد */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn" dir="rtl">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-2 border-[#C5A059] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold font-serif text-[#046A38] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#C5A059]" />
                <span>إضافة متن علمي جديد للمقرأة</span>
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">اسم المتن:</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: الشاطبية في القراءات السبع"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">اسم الناظم (المؤلف):</label>
                <input
                  type="text"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  placeholder="مثال: الإمام الشاطبي رحمه الله"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">إجمالي الأبيات:</label>
                  <input
                    type="number"
                    value={newTotalVerses}
                    onChange={(e) => setNewTotalVerses(Number(e.target.value))}
                    min={10}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">التصنيف:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                  >
                    <option value="tajweed">علم التجويد</option>
                    <option value="qiraat">علم القراءات</option>
                    <option value="rasm">رسم المصحف وضبطه</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">رابط التسجيل الصوتي المعتمد (اختياري):</label>
                <input
                  type="url"
                  value={newAudioUrl}
                  onChange={(e) => setNewAudioUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">نبذة عن المتن وأهميته:</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="اكتب نبذة تعريفية بالمتن وأهدافه..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleCreateMatn}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-[#046A38] hover:bg-[#03542c] text-white text-xs font-bold shadow-md border border-[#C5A059] cursor-pointer"
              >
                {isSaving ? "جاري الحفظ..." : "حفظ وإدراج المتن"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};