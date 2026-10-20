/**
 * مترجم ومعالج أخطاء Firebase Authentication
 * يحول رموز أخطاء Firebase إلى رسائل واضحة ومحددة مع كود الخطأ الأصلي
 */

export function formatFirebaseAuthError(err: any): string {
  if (!err) return 'حدث خطأ غير متوقع أثناء تسجيل الدخول.';
  
  const code: string = (err.code || '').trim();
  const rawMessage: string = (err.message || '').trim();

  // إذا كانت الرسالة مخصصة مسبقاً بالعربية (مثل عدم وجود الرقم الأكاديمي أو تعطيل الحساب أو خطأ كلمة المرور)
  if (
    rawMessage.includes('تعطيل هذا الحساب') || 
    rawMessage.includes('الرقم الأكاديمي') || 
    rawMessage.includes('غير مسجل') || 
    rawMessage.includes('كلمة المرور المدخلة غير صحيحة')
  ) {
    return rawMessage;
  }

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'بيانات الدخول غير صحيحة: كلمة المرور أو المعرف الأكاديمي غير مطابق. يرجى التأكد من كلمة المرور المستلمة عبر واتساب أو مراجعة إدارة المقرأة.';

    case 'auth/user-not-found':
      return 'هذا الحساب أو الرقم الأكاديمي غير مسجل في المقرأة. يرجى التأكد من البيانات أو مراجعة المشرف الأكاديمي.';

    case 'auth/invalid-email':
      return 'صيغة البريد الإلكتروني غير صحيحة. يرجى إدخال بريد صالح مثل name@example.com. [auth/invalid-email]';

    case 'auth/user-disabled':
      return 'تم تعطيل هذا الحساب من قِبل إدارة المقرأة أو مزود الخدمة. يرجى مراجعة المشرف العام. [auth/user-disabled]';

    case 'auth/too-many-requests':
      return 'تم حظر محاولات الدخول مؤقتاً بسبب تكرار المحاولات الخاطئة. يرجى الانتظار دقيقتين أو استخدام رابط إعادة التعيين. [auth/too-many-requests]';

    case 'auth/operation-not-allowed':
      return 'طريقة تسجيل الدخول بالبريد وكلمة المرور غير مفعّلة في Firebase Console (Authentication > Sign-in method > Email/Password). يرجى تفعيلها من لوحة Firebase. [auth/operation-not-allowed]';

    case 'auth/network-request-failed':
      return 'تعذر الاتصال بخوادم Firebase السحابية. يرجى التحقق من اتصال الإنترنت لديك. [auth/network-request-failed]';

    case 'auth/popup-closed-by-user':
      return 'تم إغلاق نافذة تسجيل الدخول المنبثقة قبل استكمال المصادقة. يرجى إعادة المحاولة. [auth/popup-closed-by-user]';

    case 'auth/popup-blocked':
      return 'قام المتصفح بحظر نافذة تسجيل الدخول المنبثقة بحساب Google. يرجى السماح بالنوافذ المنبثقة للموقع. [auth/popup-blocked]';

    case 'auth/internal-error':
      return 'خطأ داخلي من خادم Firebase. يرجى المحاولة بعد لحظات. [auth/internal-error]';

    default:
      if (code) {
        return `خطأ Firebase (${code}): ${rawMessage || 'فشلت المصادقة، يرجى التحقق من البيانات.'}`;
      }
      return rawMessage || 'تعذر استكمال المصادقة عبر Firebase.';
  }
}
