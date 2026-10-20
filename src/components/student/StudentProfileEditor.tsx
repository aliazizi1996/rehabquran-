/**
 * مكون الملف الشخصي للطالب - تعديل البيانات، تغيير كلمة المرور، ورفع الصورة
 * مقرأة رحاب القرآن الإلكترونية
 */

import React, { useState } from 'react';
import { 
  User, Lock, Camera, Save, CheckCircle2, AlertCircle, 
  Loader2, KeyRound, Phone, MapPin, BookOpen, Sparkles
} from 'lucide-react';
import { AuthAccount } from '../../types';
import { auth, db } from '../../lib/firebase';
import { updatePassword, updateProfile } from 'firebase/auth';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { uploadImageToCloudinary } from '../../services/cloudinaryService';

interface StudentProfileEditorProps {
  currentAccount: AuthAccount;
  onProfileUpdated?: (updatedAccount: Partial<AuthAccount>) => void;
}

export const StudentProfileEditor: React.FC<StudentProfileEditorProps> = ({
  currentAccount,
  onProfileUpdated,
}) => {
  // 1. Profile fields
  const [name, setName] = useState(currentAccount.name || '');
  const [phone, setPhone] = useState(currentAccount.phone || '');
  const [memorization, setMemorization] = useState((currentAccount as any).memorization || '5 أجزاء');
  const [riwayah, setRiwayah] = useState((currentAccount as any).riwayah || 'حفص عن عاصم');
  const [cityCountry, setCityCountry] = useState((currentAccount as any).cityCountry || 'المملكة العربية السعودية');
  const [bio, setBio] = useState((currentAccount as any).bio || '');
  const [avatarUrl, setAvatarUrl] = useState<string>((currentAccount as any).avatarUrl || (currentAccount as any).photoURL || '');

  // 2. Password change fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 3. Statuses
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Handle Photo File Upload
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    setProfileFeedback(null);

    try {
      // الرفع عبر خدمة Cloudinary
      const res = await uploadImageToCloudinary(file, 'student_avatars');
      if (res.success && res.secureUrl) {
        setAvatarUrl(res.secureUrl);

        // Update Firebase Auth current user profile if available
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, {
            photoURL: res.secureUrl,
          });
        }

        // Update in Firestore
        const userDocRef = doc(db, 'users', currentAccount.id);
        await updateDoc(userDocRef, {
          avatarUrl: res.secureUrl,
          photoURL: res.secureUrl,
        }).catch(async () => {
          await setDoc(userDocRef, { avatarUrl: res.secureUrl }, { merge: true });
        });

        if (onProfileUpdated) {
          onProfileUpdated({ avatarUrl: res.secureUrl } as any);
        }

        setProfileFeedback({ type: 'success', msg: 'تم رفع وتحديث صورتك الشخصية بنجاح! ✨' });
      } else {
        throw new Error(res.error || 'فشل رفع الصورة.');
      }
    } catch (err: any) {
      setProfileFeedback({ type: 'error', msg: err?.message || 'تعذر رفع الصورة الشخصية.' });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Save Profile Details
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setProfileFeedback({ type: 'error', msg: 'يرجى كتابة اسم الطالب كاملاً.' });
      return;
    }

    setIsSavingProfile(true);
    setProfileFeedback(null);

    try {
      const updateData: any = {
        name: name.trim(),
        phone: phone.trim(),
        memorization: memorization.trim(),
        riwayah: riwayah.trim(),
        cityCountry: cityCountry.trim(),
        bio: bio.trim(),
        avatarUrl,
        lastProfileUpdate: new Date().toISOString(),
      };

      // Update in Firebase Auth
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: name.trim(),
        });
      }

      // Update in Firestore 'users' & 'students'
      const userRef = doc(db, 'users', currentAccount.id);
      await setDoc(userRef, updateData, { merge: true });

      const studentRef = doc(db, 'students', currentAccount.id);
      await setDoc(studentRef, updateData, { merge: true }).catch(() => {});

      if (onProfileUpdated) {
        onProfileUpdated(updateData);
      }

      setProfileFeedback({ type: 'success', msg: 'تم حفظ وتحديث بيانات ملفك الشخصي بنجاح في قاعدة البيانات.' });
    } catch (err: any) {
      setProfileFeedback({ type: 'error', msg: err?.message || 'تعذر حفظ البيانات، تحقق من اتصالك وحاول ثانية.' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (!newPassword || newPassword.length < 6) {
      setPasswordFeedback({ type: 'error', msg: 'يجب أن لا تقل كلمة المرور الجديدة عن 6 خانات.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', msg: 'كلمتا المرور غير متطابقتين.' });
      return;
    }

    setIsChangingPassword(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('يرجى إعادة تسجيل الدخول لتتمكن من تغيير كلمة المرور لأسباب أمنية.');
      }

      await updatePassword(user, newPassword);

      setPasswordFeedback({ type: 'success', msg: 'تم تغيير كلمة المرور بنجاح! احرص على حفظها في مكان آمن.' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      if (err?.code === 'auth/requires-recent-login') {
        setPasswordFeedback({
          type: 'error',
          msg: 'تتطلب العملية تسجيل دخول حديث لأسباب أمنية. يرجى تسجيل الخروج ثم الدخول مجدداً.',
        });
      } else {
        setPasswordFeedback({
          type: 'error',
          msg: err?.message || 'فشل تحديث كلمة المرور، يرجى المحاولة مرة أخرى.',
        });
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in text-right" dir="rtl">
      
      {/* 1. بطاقة الصورة والبيانات الشخصية */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 border-b border-slate-100 pb-6">
          
          {/* Avatar with Upload Badge */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#046A38] to-[#065A31] text-white flex items-center justify-center font-bold text-3xl border-2 border-[#C5A059] shadow-md overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <span>{name?.charAt(0) || 'ط'}</span>
              )}
            </div>

            <label className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-[#C5A059] hover:bg-[#b08d47] text-white shadow-md cursor-pointer transition-transform hover:scale-110">
              {isUploadingPhoto ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                disabled={isUploadingPhoto}
                className="hidden"
              />
            </label>
          </div>

          <div className="text-center sm:text-right space-y-1">
            <h3 className="font-bold text-xl font-serif text-[#046A38]">{name}</h3>
            <p className="text-xs text-slate-500 font-mono">
              الرقم الأكاديمي: {(currentAccount as any).academicId || currentAccount.username}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <span className="text-[11px] font-bold text-[#046A38] bg-emerald-50 border border-emerald-200 px-3 py-0.5 rounded-full">
                طالب معتمد في المقرأة
              </span>
              <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {currentAccount.section === 'female' ? 'قسم الطالبات' : 'قسم الطلاب'}
              </span>
            </div>
          </div>
        </div>

        {profileFeedback && (
          <div className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
            profileFeedback.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {profileFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>{profileFeedback.msg}</span>
          </div>
        )}

        {/* Profile Edit Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">الاسم الرباعي المعتمد في الشهادات:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl bg-[#F9F6F0] border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#046A38]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">رقم الهاتف / الواتساب:</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                dir="ltr"
                className="w-full p-2.5 rounded-xl bg-[#F9F6F0] border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#046A38]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">مقدار الحفظ الفعلي:</label>
              <input
                type="text"
                value={memorization}
                onChange={(e) => setMemorization(e.target.value)}
                placeholder="مثال: 10 أجزاء / حفظ القرآن كاملاً"
                className="w-full p-2.5 rounded-xl bg-[#F9F6F0] border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#046A38]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">الرواية القرآنية المعتمدة:</label>
              <input
                type="text"
                value={riwayah}
                onChange={(e) => setRiwayah(e.target.value)}
                placeholder="حفص عن عاصم / ورش عن نافع"
                className="w-full p-2.5 rounded-xl bg-[#F9F6F0] border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#046A38]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">المدينة والدولة:</label>
              <input
                type="text"
                value={cityCountry}
                onChange={(e) => setCityCountry(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#F9F6F0] border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#046A38]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">نبذة شخصية أو هدفك في المقرأة:</label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="أطمح لنيل الإجازة بالسند المتصل وإتقان القراءات العشر..."
                className="w-full p-2.5 rounded-xl bg-[#F9F6F0] border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#046A38]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="px-6 py-2.5 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer border border-[#C5A059] disabled:opacity-50"
            >
              {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin text-[#C5A059]" /> : <Save className="w-4 h-4 text-[#C5A059]" />}
              <span>حفظ وتحديث بيانات الملف الشخصي</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. بطاقة تغيير كلمة المرور */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#C5A059] flex items-center justify-center">
            <Lock className="w-5 h-5 text-[#C5A059]" />
          </div>
          <div>
            <h4 className="font-bold text-base font-serif text-slate-900">تغيير كلمة المرور</h4>
            <p className="text-[11px] text-slate-500">قم بتحديث كلمة المرور الخاصة بحسابك لحماية بياناتك</p>
          </div>
        </div>

        {passwordFeedback && (
          <div className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
            passwordFeedback.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {passwordFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>{passwordFeedback.msg}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">كلمة المرور الجديدة:</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="6 خانات على الأقل"
                className="w-full p-2.5 rounded-xl bg-[#F9F6F0] border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#046A38]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">تأكيد كلمة المرور الجديدة:</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد إدخال كلمة المرور"
                className="w-full p-2.5 rounded-xl bg-[#F9F6F0] border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#046A38]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isChangingPassword || !newPassword}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin text-[#C5A059]" /> : <KeyRound className="w-4 h-4 text-[#C5A059]" />}
              <span>تحديث كلمة المرور</span>
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};
