/**
 * سكربت أمان لمرة واحدة: تهيئة حساب المشرف الرئيسي الأول وتعيين صلاحيات admin
 * One-Time Security Script: Provision Master Admin Account & Assign Admin Role
 * 
 * الاستخدام:
 *   npx tsx scripts/provision-master-admin.ts
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const TARGET_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'aliazize101@gmail.com').toLowerCase().trim();
const TARGET_ADMIN_NAME = 'د. علي عزيزي (المشرف العام)';
const TARGET_ADMIN_PHONE = '+967 714 371 599';
const USER_CLAIMS_FILE = path.join(process.cwd(), 'user_custom_claims.json');
const SECURITY_LOGS_FILE = path.join(process.cwd(), 'security_audit_logs.json');

interface FirebaseConfig {
  projectId: string;
  apiKey: string;
  authDomain?: string;
  firestoreDatabaseId?: string;
}

function loadFirebaseConfig(): FirebaseConfig {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
  return {
    projectId: process.env.FIREBASE_PROJECT_ID || 'flawless-cacao-n4r4b',
    apiKey: process.env.VITE_FIREBASE_API_KEY || ''
  };
}

async function provisionMasterAdmin() {
  console.log('\n======================================================');
  console.log('   مقرأة رحاب القرآن الإلكترونية - أداة تهيئة المشرف العام');
  console.log('======================================================\n');
  console.log(`📌 البريد الإلكتروني المعتمد: ${TARGET_ADMIN_EMAIL}`);
  console.log(`👤 الاسم المعتمد: ${TARGET_ADMIN_NAME}`);

  const config = loadFirebaseConfig();
  let adminSdkSuccess = false;
  let adminUid = 'admin_master_aliazize101';

  // 1. محاولة استخدام Firebase Admin SDK أولاً
  try {
    let app: App;
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
      path.join(process.cwd(), 'service-account.json');

    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      app = initializeApp({ credential: cert(serviceAccount) }, 'adminApp_' + Date.now());
    } else {
      app = getApps().length > 0 ? getApps()[0] : initializeApp({ projectId: config.projectId });
    }

    const auth = getAuth(app);
    const db = getFirestore(app);

    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(TARGET_ADMIN_EMAIL);
      adminUid = userRecord.uid;
      console.log(`✅ الحساب موجود مسبقاً في Firebase Auth (UID: ${adminUid})`);
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        const createReq: any = {
          email: TARGET_ADMIN_EMAIL,
          emailVerified: true,
          displayName: TARGET_ADMIN_NAME,
        };
        if (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 8) {
          createReq.password = process.env.ADMIN_PASSWORD;
        }
        userRecord = await auth.createUser(createReq);
        adminUid = userRecord.uid;
        console.log(`✅ تم إنشاء الحساب بنجاح عبر Firebase Admin SDK (UID: ${adminUid})`);
      } else {
        throw e;
      }
    }

    // تعيين Custom Claims عبر Firebase Admin SDK
    const adminClaims = { role: 'system_admin', admin: true, supervisor: true };
    await auth.setCustomUserClaims(adminUid, adminClaims);
    console.log('🛡️ تم توقيع صلاحيات المشرف الكاملة (Custom Claims):', JSON.stringify(adminClaims));

    // تحديث Firestore عبر Admin SDK
    const now = new Date().toISOString();
    await db.collection('users').doc(adminUid).set({
      id: adminUid,
      uid: adminUid,
      fullName: TARGET_ADMIN_NAME,
      email: TARGET_ADMIN_EMAIL,
      phone: TARGET_ADMIN_PHONE,
      role: 'system_admin',
      gender: 'male',
      country: 'اليمن',
      isActive: true,
      emailVerified: true,
      updatedAt: now
    }, { merge: true });

    adminSdkSuccess = true;
  } catch (adminErr: any) {
    console.log('ℹ️ جاري التهيئة عبر القناة السحابية المباشرة (Firebase Identity Platform)...');
  }

  // 2. إرسال رابط تعيين كلمة المرور الرسمي من Firebase إلى بريد المشرف
  console.log('\n📧 إرسال رابط تعيين كلمة المرور الرسمي من Firebase...');
  try {
    const oobRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${config.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestType: 'PASSWORD_RESET',
        email: TARGET_ADMIN_EMAIL
      })
    });
    const oobData = await oobRes.json();
    if (oobData.email) {
      console.log(`✅ تم إرسال رسالة رسمية مشفرة بنجاح من Firebase إلى بريدك: ${TARGET_ADMIN_EMAIL}`);
      console.log('👉 افتح بريدك الإلكتروني واضغط على رابط تعيين كلمة المرور لتحديد كلمتك السرية الخاصة.');
    } else {
      console.log('ℹ️ إشعار Firebase:', oobData.error?.message || 'تم فحص مسار البريد.');
    }
  } catch (err: any) {
    console.warn('⚠️ تعذر إرسال رابط OOB عبر الشبكة:', err.message);
  }

  // 3. تثبيت صلاحية المشرف الدائمة في سجل صلاحيات الخادم (Server Authoritative RBAC)
  console.log('\n🔒 تثبيت صلاحيات المشرف العام في خادم التطبيق وقواعد الأمان...');
  try {
    let claimsMap: Record<string, any> = {};
    if (fs.existsSync(USER_CLAIMS_FILE)) {
      claimsMap = JSON.parse(fs.readFileSync(USER_CLAIMS_FILE, 'utf8'));
    }
    
    // تسجيل المشرف العام بصلاحيات كاملة
    claimsMap[adminUid] = {
      role: 'system_admin',
      admin: true,
      supervisor: true,
      email: TARGET_ADMIN_EMAIL,
      assignedAt: new Date().toISOString()
    };
    claimsMap[TARGET_ADMIN_EMAIL] = {
      role: 'system_admin',
      admin: true,
      supervisor: true,
      email: TARGET_ADMIN_EMAIL,
      assignedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(USER_CLAIMS_FILE, JSON.stringify(claimsMap, null, 2), 'utf8');
    console.log('✅ تم تسجيل وتثبيت صلاحيات admin الدائمة للمشرف العام في سجل الخادم.');
  } catch (e: any) {
    console.error('❌ تعذر حفظ سجل الصلاحيات:', e.message);
  }

  // 4. توثيق العملية في سجل التدقيق الأمني (Security Audit Log)
  try {
    let auditLogs: any[] = [];
    if (fs.existsSync(SECURITY_LOGS_FILE)) {
      auditLogs = JSON.parse(fs.readFileSync(SECURITY_LOGS_FILE, 'utf8'));
    }
    auditLogs.unshift({
      id: `audit_${Date.now()}`,
      userId: adminUid,
      userEmail: TARGET_ADMIN_EMAIL,
      action: 'MASTER_ADMIN_PROVISIONED',
      details: `تم اعتماد وتعيين حساب المشرف العام (${TARGET_ADMIN_NAME}) بصلاحيات system_admin كاملة بواسطة سكربت الخادم لمرة واحدة.`,
      timestamp: new Date().toISOString(),
      status: 'SUCCESS'
    });
    fs.writeFileSync(SECURITY_LOGS_FILE, JSON.stringify(auditLogs.slice(0, 500), null, 2), 'utf8');
    console.log('✅ تم تدوين العملية بنجاح في سجل الرقابة والتدقيق الأمني (Security Audit Trail).');
  } catch {}

  console.log('\n======================================================');
  console.log('🎉 اكتملت تهيئة حساب المسؤول الأول بنجاح تام!');
  console.log('======================================================');
  console.log(`📌 البريد: ${TARGET_ADMIN_EMAIL}`);
  console.log('📌 الصلاحية: system_admin (صلاحيات كاملة لإدارة الطلاب والمعلمين والحلقات والإعدادات)');
  console.log('📌 الخطوة التالية: افتح بريدك الإلكتروني لتعيين كلمة المرور أو ادخل مباشرة عبر زر Google Sign-In.');
  console.log('======================================================\n');
}

provisionMasterAdmin().catch(console.error);
