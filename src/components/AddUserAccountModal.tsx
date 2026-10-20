import React, { useState, useEffect } from 'react';
import { 
  X, UserPlus, Shield, User, Key, Phone, BookOpen, Check, 
  Copy, MessageCircle, RefreshCw, Eye, EyeOff, Sparkles, CheckCircle2,
  GraduationCap
} from 'lucide-react';
import { AuthAccount } from '../types';
import { adminCreateAccount } from '../data/authStore';
import { validateAndCleanWhatsAppNumber } from '../services/whatsappService';
import { COUNTRY_DIAL_CODES, DEFAULT_COUNTRY_DIAL_CODE } from '../data/countryPhoneCodes';

interface AddUserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: 'student' | 'teacher' | 'supervisor';
  initialSection?: 'male' | 'female' | 'both';
  onAccountCreated?: (account: AuthAccount) => void;
}

export const AddUserAccountModal: React.FC<AddUserAccountModalProps> = ({
  isOpen,
  onClose,
  initialRole = 'student',
  initialSection = 'male',
  onAccountCreated,
}) => {
  const [role, setRole] = useState<'student' | 'teacher' | 'supervisor'>(initialRole);
  const [section, setSection] = useState<'male' | 'female' | 'both'>(initialSection);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_DIAL_CODE);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [assignedHalqaTitle, setAssignedHalqaTitle] = useState('');
  const [titleBadge, setTitleBadge] = useState('');
  const [notes, setNotes] = useState('');
  
  // State for success confirmation
  const [createdAccount, setCreatedAccount] = useState<AuthAccount | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset when opening modal or changing role
  useEffect(() => {
    if (isOpen) {
      setRole(initialRole);
      setSection(initialSection === 'both' ? 'male' : initialSection);
      setName('');
      setPhone('');
      setUsername('');
      setPassword('');
      setCreatedAccount(null);
      setCopiedSuccess(false);
      setErrorMessage(null);
      setNotes('');
    }
  }, [isOpen, initialRole, initialSection]);

  // Update default halqa when role or section changes
  useEffect(() => {
    if (role === 'student') {
      if (section === 'male') {
        setAssignedHalqaTitle('حلقة قسم الطلاب (بنين)');
        setTitleBadge('طالب مجتهد - حلقة الفجر');
      } else {
        setAssignedHalqaTitle('حلقة قسم الطالبات (أخوات)');
        setTitleBadge('طالبة متميزة - قسم الطالبات');
      }
    } else if (role === 'teacher') {
      if (section === 'male') {
        setAssignedHalqaTitle('حلقة قسم الطلاب (بنين)');
        setTitleBadge('معلم مقرأة معتمد ومجاز');
      } else if (section === 'female') {
        setAssignedHalqaTitle('حلقة قسم الطالبات (أخوات)');
        setTitleBadge('معلمة مقرأة معتمدة ومجازة');
      } else {
        setAssignedHalqaTitle('كلا القسمين (بنين وبنات)');
        setTitleBadge('معلم ومقرئ معتمد');
      }
    } else {
      setAssignedHalqaTitle('الإدارة والإشراف العام');
      setTitleBadge('مشرف وموجه في المقرأة');
    }
  }, [role, section]);

  if (!isOpen) return null;

  // Auto-generate username from phone or clean latin
  const handleAutoGenerateUsername = () => {
    if (phone.trim()) {
      const clean = phone.replace(/[^0-9]/g, '');
      setUsername(clean);
    } else if (name.trim()) {
      const translit = name.trim().split(' ').slice(0, 2).join('_').toLowerCase();
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      setUsername(`user_${randomSuffix}`);
    } else {
      setUsername(`user_${Math.floor(1000 + Math.random() * 9000)}`);
    }
  };

  const generateRandomPassword = () => {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnopqrstuvwxyz';
    const numbers = '23456789';
    const all = upper + lower + numbers;
    
    let res = '';
    res += upper.charAt(Math.floor(Math.random() * upper.length));
    res += lower.charAt(Math.floor(Math.random() * lower.length));
    res += numbers.charAt(Math.floor(Math.random() * numbers.length));
    for (let i = 0; i < 7; i++) {
      res += all.charAt(Math.floor(Math.random() * all.length));
    }
    const shuffled = res.split('').sort(() => Math.random() - 0.5).join('');
    setPassword(shuffled);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('يرجى كتابة اسم الطالب أو المعلم.');
      return;
    }

    if (!phone.trim() && !username.trim()) {
      setErrorMessage('يرجى إدخال رقم الهاتف أو اسم المستخدم لتسجيل الدخول.');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('يرجى تعيين كلمة المرور الخاصة بالحساب.');
      return;
    }

    const result = adminCreateAccount({
      name: name.trim(),
      phone: phone.trim(),
      username: username.trim() || undefined,
      password: password.trim(),
      role,
      section,
      titleBadge: titleBadge.trim() || undefined,
      assignedHalqaTitle: assignedHalqaTitle.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    if (result.success && result.account) {
      setCreatedAccount(result.account);

      // حفظ الحساب في Firestore ومزامنة البيانات مع سجل الرقابة
      const newAcc = result.account;
      (async () => {
        try {
          const { doc, setDoc } = await import('firebase/firestore');
          const { db } = await import('../lib/firebase');
          await setDoc(doc(db, 'users', newAcc.id), {
            id: newAcc.id,
            name: newAcc.name,
            fullName: newAcc.name,
            role: newAcc.role,
            section: newAcc.section,
            phone: newAcc.phone,
            username: newAcc.username,
            assignedHalqaTitle: newAcc.assignedHalqaTitle || '',
            titleBadge: newAcc.titleBadge || '',
            status: 'active',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }, { merge: true });

          if (newAcc.role === 'student') {
            await setDoc(doc(db, 'students', newAcc.id), {
              id: newAcc.id,
              name: newAcc.name,
              fullName: newAcc.name,
              phone: newAcc.phone,
              section: newAcc.section,
              status: 'active',
              isActive: true,
              assignedHalqaTitle: newAcc.assignedHalqaTitle || '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }, { merge: true });
          } else if (newAcc.role === 'teacher') {
            await setDoc(doc(db, 'teachers', newAcc.id), {
              id: newAcc.id,
              name: newAcc.name,
              phone: newAcc.phone,
              section: newAcc.section,
              status: 'active',
              isActive: true,
              riwayah: 'حفص عن عاصم',
              qualification: 'إجازة في القرآن الكريم بالسند المتصل',
              studentsCount: 0,
              assignedHalqaTitle: newAcc.assignedHalqaTitle || '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }, { merge: true });
          }
        } catch (fsErr) {
          console.warn('Manual account Firestore sync notice:', fsErr);
        }

        try {
          const { recordAuditLog } = await import('../services/contentManagementService');
          await recordAuditLog({
            operatorName: 'المشرف العام',
            operatorEmail: 'aliazize101@gmail.com',
            operatorRole: 'supervisor',
            action: `إضافة ${newAcc.role === 'student' ? 'طالب' : 'معلم'} يدويًا`,
            targetItem: newAcc.name,
            details: `تم إنشاء حساب ${newAcc.role === 'student' ? 'طالب' : 'معلم'} جديد يدويًا باسم [${newAcc.name}] برقم هاتف (${newAcc.phone}) وحلقة [${newAcc.assignedHalqaTitle || 'عامة'}].`,
            status: 'SUCCESS',
            timestamp: new Date().toLocaleTimeString('ar-SA'),
          });
        } catch {}
      })();

      if (onAccountCreated) {
        onAccountCreated(result.account);
      }
    } else {
      setErrorMessage(result.message);
    }
  };

  // Formatted credentials text for sharing
  const getCredentialsShareText = (acc: AuthAccount) => {
    const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://rehab-quran.app';
    const roleTitle = acc.role === 'student' ? 'طالب' : acc.role === 'teacher' ? 'معلم' : 'مشرف';
    return `السلام عليكم ورحمة الله وبركاته،\n` +
      `حياك الله ${acc.name}،\n` +
      `يسرنا إبلاغك بأنه تم إنشاء وتفعيل حسابك الرسمي في *مقرأة رحاب القرآن الإلكترونية* كـ (${roleTitle}).\n\n` +
      `📋 *بيانات الدخول المباشر إلى حسابك:*\n` +
      `👤 *الاسم:* ${acc.name}\n` +
      `🔑 *اسم المستخدم:* ${acc.username}\n` +
      `📱 *رقم الهاتف:* ${acc.phone}\n` +
      `🔒 *كلمة المرور:* ${acc.password}\n` +
      `📖 *الحلقة المخصصة:* ${acc.assignedHalqaTitle || 'حلقة المقرأة'}\n\n` +
      `🌐 *رابط تسجيل الدخول المباشر:*\n${appUrl}\n\n` +
      `نسأل الله لك التوفيق والسداد في مدارسة كتاب الله وحفظه.`;
  };

  const handleCopyCredentials = () => {
    if (!createdAccount) return;
    const text = getCredentialsShareText(createdAccount);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 3000);
    }).catch(() => {
      // Fallback
      setCopiedSuccess(true);
    });
  };

  const handleSendWhatsApp = () => {
    if (!createdAccount) return;
    const text = getCredentialsShareText(createdAccount);
    const validation = validateAndCleanWhatsAppNumber(createdAccount.phone, countryCode);
    if (!validation.isValid) {
      setErrorMessage(`رقم الهاتف (${createdAccount.phone || 'غير محدد'}) غير صالح للإرسال عبر واتساب: ${validation.error || 'يرجى مراجعة الرقم'}`);
      return;
    }

    const url = `https://wa.me/${validation.cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleResetForAnother = () => {
    setName('');
    setPhone('');
    setCountryCode(DEFAULT_COUNTRY_DIAL_CODE);
    setUsername('');
    setPassword('');
    setNotes('');
    setCreatedAccount(null);
    setCopiedSuccess(false);
    setErrorMessage(null);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      dir="rtl"
      id="modal-add-user-account"
    >
      <div 
        className="bg-[#05130d] border-2 border-amber-500/70 rounded-3xl w-full max-w-xl text-white shadow-2xl overflow-hidden my-auto animate-scaleUp relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-[#0d2a1c] via-[#113824] to-[#071a11] border-b border-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black font-serif text-white">
                  إضافة حساب جديد يدوياً
                </h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                  دخول مباشر فوري
                </span>
              </div>
              <p className="text-xs text-emerald-300/90 mt-0.5">
                إنشاء حساب طالب أو معلم وتعيين كلمة مرور للدخول دون تسجيل ذاتي
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-950/80 border border-red-500/80 text-red-200 text-xs font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 shrink-0 animate-ping" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* SUCCESS SCREEN */}
          {createdAccount ? (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-5 rounded-3xl bg-gradient-to-b from-emerald-950/90 to-[#06180f] border-2 border-emerald-500/80 text-center space-y-3 shadow-xl">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-md">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-white font-serif">
                    تم إنشاء وتفعيل الحساب بنجاح!
                  </h4>
                  <p className="text-xs text-emerald-300 mt-1">
                    أصبح بإمكان {createdAccount.role === 'student' ? 'الطالب' : 'المعلم'} تسجيل الدخول فوراً باستخدام البيانات التالية:
                  </p>
                </div>

                {/* Credentials summary box */}
                <div className="bg-[#030e08] border border-amber-500/50 rounded-2xl p-4 text-right space-y-2.5 text-xs font-mono shadow-inner">
                  <div className="flex justify-between items-center border-b border-emerald-900/60 pb-2">
                    <span className="text-slate-400 font-sans">الاسم الكريم:</span>
                    <strong className="text-white text-sm font-sans">{createdAccount.name}</strong>
                  </div>
                  <div className="flex justify-between items-center border-b border-emerald-900/60 pb-2">
                    <span className="text-slate-400 font-sans">الصفة / الدور:</span>
                    <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold font-sans">
                      {createdAccount.role === 'student' ? 'طالب مقرأة' : createdAccount.role === 'teacher' ? 'معلم مقرأة' : 'مشرف'}
                      {createdAccount?.section === 'male' ? ' (قسم الطلاب)' : createdAccount?.section === 'female' ? ' (قسم الطالبات)' : ''}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-emerald-900/60 pb-2">
                    <span className="text-slate-400 font-sans">اسم المستخدم:</span>
                    <strong className="text-amber-300 text-sm tracking-wider">{createdAccount.username}</strong>
                  </div>
                  <div className="flex justify-between items-center border-b border-emerald-900/60 pb-2">
                    <span className="text-slate-400 font-sans">رقم الواتساب المعتمد:</span>
                    {(() => {
                      const phoneVal = validateAndCleanWhatsAppNumber(createdAccount.phone, countryCode);
                      return phoneVal.isValid ? (
                        <div className="flex items-center gap-1.5" dir="ltr">
                          <span className="text-emerald-300 text-xs font-mono font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/60">
                            {phoneVal.formattedDisplay}
                          </span>
                        </div>
                      ) : (
                        <strong className="text-amber-400 text-xs font-sans">
                          {createdAccount.phone ? `${createdAccount.phone} (غير صالح للواتساب)` : 'غير محدد'}
                        </strong>
                      );
                    })()}
                  </div>
                  <div className="flex justify-between items-center border-b border-emerald-900/60 pb-2">
                    <span className="text-slate-400 font-sans">كلمة المرور:</span>
                    <strong className="text-amber-400 text-base font-black tracking-widest bg-amber-950/60 px-2.5 py-0.5 rounded-lg border border-amber-500/40">
                      {createdAccount.password}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-400 font-sans">الحلقة المسندة:</span>
                    <span className="text-slate-200 font-sans">{createdAccount.assignedHalqaTitle}</span>
                  </div>
                </div>

                {/* Primary Sharing buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleCopyCredentials}
                    className="p-3 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
                  >
                    {copiedSuccess ? (
                      <>
                        <Check className="w-4 h-4 text-amber-300" />
                        <span className="text-amber-300">تم نسخ البيانات للحافظة!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>نسخ بيانات الدخول</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    className="p-3 rounded-2xl bg-[#128C7E] hover:bg-[#075E54] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>إرسال عبر واتساب للطالب</span>
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetForAnother}
                  className="px-4 py-2.5 rounded-2xl bg-[#082215] hover:bg-[#0e3321] border border-emerald-700 text-xs font-bold text-emerald-300 flex items-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>إضافة حساب آخر</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-md hover:from-amber-400 hover:to-amber-300"
                >
                  تم والعودة للوحة التحكم
                </button>
              </div>
            </div>
          ) : (
            /* FORM STATE */
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* 1. ROLE SELECTION */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  1. الصفة / نوع الحساب:
                </label>
                <div className="grid grid-cols-3 gap-2 bg-[#040e09] p-1.5 rounded-2xl border border-emerald-800">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      role === 'student'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>طالب / طالبة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('teacher')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      role === 'teacher'
                        ? 'bg-emerald-600 text-white font-black shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>معلم / معلمة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('supervisor')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      role === 'supervisor'
                        ? 'bg-teal-600 text-white font-black shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    <span>مشرف / مسجل</span>
                  </button>
                </div>
              </div>

              {/* 2. SECTION SELECTION */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  2. القسم المخصص:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSection('male')}
                    className={`py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      section === 'male'
                        ? 'bg-[#0f3020] border-amber-400 text-amber-300 shadow-md font-black'
                        : 'bg-[#06170e] border-emerald-900 text-slate-300 hover:border-emerald-700'
                    }`}
                  >
                    <span>🧔</span>
                    <span>قسم الطلاب (بنين)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSection('female')}
                    className={`py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      section === 'female'
                        ? 'bg-[#0f3020] border-teal-400 text-teal-300 shadow-md font-black'
                        : 'bg-[#06170e] border-emerald-900 text-slate-300 hover:border-emerald-700'
                    }`}
                  >
                    <span>🧕</span>
                    <span>قسم الطالبات (أخوات)</span>
                  </button>
                  {role !== 'student' && (
                    <button
                      type="button"
                      onClick={() => setSection('both')}
                      className={`py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        section === 'both'
                          ? 'bg-[#0f3020] border-emerald-400 text-emerald-300 shadow-md font-black'
                          : 'bg-[#06170e] border-emerald-900 text-slate-300 hover:border-emerald-700'
                      }`}
                    >
                      <span>🌐</span>
                      <span>كلا القسمين</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 3. FULL NAME */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  3. اسم {role === 'student' ? 'الطالب' : role === 'teacher' ? 'المعلم' : 'المشرف'} الكامل: <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-emerald-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: يحيى منصور الوصابي أو فاطمة أحمد"
                    className="w-full bg-[#030d07] border border-emerald-700/80 rounded-2xl py-2.5 pr-10 pl-4 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>

              {/* 4. LOGIN CREDENTIALS CARD */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#061c12] to-[#04120a] border border-amber-500/40 space-y-3.5">
                <div className="flex items-center justify-between border-b border-emerald-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black text-amber-300 font-serif">
                      بيانات تسجيل الدخول المباشر (الهاتف / اسم المستخدم وكلمة المرور)
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-medium">
                    يكفي إدخال أحدهما
                  </span>
                </div>

                {/* Phone & Username Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      رقم الهاتف / الواتساب:
                    </label>
                    <div className="flex gap-2">
                      <div className="w-28 sm:w-32 shrink-0">
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="w-full bg-[#020a05] border border-emerald-700/80 rounded-xl py-2 px-2 text-[11px] text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                          title="اختر رمز الدولة (اليمن +967 افتراضياً)"
                        >
                          {COUNTRY_DIAL_CODES.map((c) => (
                            <option key={c.iso} value={c.dialCode} className="bg-[#020a05] text-white">
                              {c.flag} {c.dialCode ? `+${c.dialCode}` : c.nameAr}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="relative flex-1">
                        <Phone className="w-3.5 h-3.5 text-emerald-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="مثال: 713801916 أو 0713801916"
                          className="w-full bg-[#020a05] border border-emerald-700/80 rounded-xl py-2 pr-9 pl-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono text-left"
                          dir="ltr"
                        />
                      </div>
                    </div>
                    {phone.trim() && (() => {
                      const preview = validateAndCleanWhatsAppNumber(phone, countryCode);
                      return (
                        <div className="mt-1 flex items-center justify-between text-[10px] px-1">
                          <span className="text-slate-400">الصيغة الدولية المعتمدة:</span>
                          <span className={`font-mono font-bold ${preview.isValid ? 'text-emerald-400' : 'text-amber-400'}`} dir="ltr">
                            {preview.isValid ? preview.formattedDisplay : 'يرجى مراجعة الرقم'}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-300">
                        اسم المستخدم (Username):
                      </label>
                      <button
                        type="button"
                        onClick={handleAutoGenerateUsername}
                        className="text-[10px] text-amber-400 hover:text-amber-300 underline flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>توليد تلقائي</span>
                      </button>
                    </div>
                    <div className="relative">
                      <span className="text-xs text-slate-500 absolute right-3 top-1/2 -translate-y-1/2">@</span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="مثال: yahya_mansour أو 967771234567"
                        className="w-full bg-[#020a05] border border-emerald-700/80 rounded-xl py-2 pr-8 pl-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Password field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-300">
                      تعيين كلمة المرور الخاصة به: <span className="text-amber-400">*</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={generateRandomPassword}
                        className="text-[10px] px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-500/60 text-amber-300 hover:bg-amber-900 cursor-pointer flex items-center gap-1 font-bold transition-all shadow-xs"
                      >
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>توليد كلمة مرور آمنة</span>
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="أدخل كلمة مرور قوية (أو اضغط توليد آمن)"
                      className="w-full bg-[#020a05] border border-emerald-700/80 rounded-xl py-2 pr-3 pl-10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    💡 سيستخدم {role === 'student' ? 'الطالب' : 'المعلم'} هذه الكلمة لتسجيل الدخول مباشرة من شاشة الدخول.
                  </p>
                </div>
              </div>

              {/* 5. HALQA ASSIGNMENT & TITLE BADGE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    الحلقة أو المسار المخصص:
                  </label>
                  <select
                    value={assignedHalqaTitle}
                    onChange={(e) => setAssignedHalqaTitle(e.target.value)}
                    className="w-full bg-[#030d07] border border-emerald-700/80 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="حلقة قسم الطلاب (بنين)">حلقة قسم الطلاب (بنين)</option>
                    <option value="حلقة قسم الطالبات (أخوات)">حلقة قسم الطالبات (أخوات)</option>
                    <option value="حلقة الفجر القرآنية المباركة">حلقة الفجر القرآنية المباركة</option>
                    <option value="مسار الإتقان والإجازة بالسند المتصل">مسار الإتقان والإجازة بالسند المتصل</option>
                    <option value="مسار حفظ وتثبيت القرآن الكريم">مسار حفظ وتثبيت القرآن الكريم</option>
                    <option value="مسار تصحيح التلاوة وأحكام التجويد">مسار تصحيح التلاوة وأحكام التجويد</option>
                    <option value="الإدارة والإشراف العام">الإدارة والإشراف العام</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    اللقب أو الصفة التقديرية:
                  </label>
                  <input
                    type="text"
                    value={titleBadge}
                    onChange={(e) => setTitleBadge(e.target.value)}
                    placeholder="مثال: طالب مجتهد - مسار الإتقان"
                    className="w-full bg-[#030d07] border border-emerald-700/80 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* 6. OPTIONAL NOTES */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  ملاحظات إضافية (اختياري):
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: طالب مستجد تم تسجيله بعد اختبار التلاوة"
                  className="w-full bg-[#030d07] border border-emerald-700/80 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* SUBMIT BUTTONS */}
              <div className="pt-3 border-t border-emerald-800/80 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-amber-500/20 cursor-pointer active:scale-95 transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>حفظ وإنشاء الحساب وتفعيل الدخول</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
