# الدليل التقني للأمان وإدارة الأسرار وسياسات IAM
## مقرأة رحاب القرآن الإلكترونية (2026)

---

## ١. مقدمة ونطاق الدليل
يوثق هذا الدليل الإجراءات المعيارية لحماية البنية التحتية السحابية الخاصة بمشروع **مقرأة رحاب القرآن الإلكترونية**، وتحديداً:
1. تأمين وإدارة المفاتيح الحساسة (`ADMIN_MASTER_KEY` و `GEMINI_API_KEY`) باستخدام **Google Cloud Secret Manager**.
2. حوكمة وتقييد صلاحيات الهوية والوصول (**IAM - Identity and Access Management**) لقاعدة بيانات Firestore المحددة في ملف التهيئة المعتمد `firebase-applet-config.json`.
3. تطبيق معيار الدفاع المتعمق (**Defense-in-Depth**) للربط بين أمان البنية السحابية وقواعد أمان التطبيق (`firestore.rules`).

---

## ٢. البيانات المرجعية للبيئة السحابية (من واقع `firebase-applet-config.json`)

| المعرّف / العنصر | القيمة المعتمدة في النظام | الوصف |
| :--- | :--- | :--- |
| **Project ID** | `flawless-cacao-n4r4b` | معرّف مشروع Google Cloud و Firebase الأساسي |
| **Project Number** | `676593542004` | الرقم التسلسلي الفريد للمشروع في GCP |
| **Target Firestore DB** | `ai-studio-remix-56841409-6e0e-4be0-8a09-dd6a1dbe5a63` | قاعدة بيانات Firestore المخصصة والمسمّاة للمقرأة |
| **Storage Bucket** | `flawless-cacao-n4r4b.firebasestorage.app` | حاوية التخزين السحابي للملفات والشهادات والوسائط |
| **Auth Domain** | `flawless-cacao-n4r4b.firebaseapp.com` | نطاق المصادقة الإلكترونية |

---

## ٣. إدارة الأسرار الحساسة عبر Google Cloud Secret Manager

### ٣.١ الأسرار المطلوب تأمينها
1. **`ADMIN_MASTER_KEY`**:
   - المفتاح الإداري الفائق لتشغيل عمليات الطوارئ، وتحديث الإعدادات الهيكلية، وتخويل الوصول الإداري الحرج.
   - **الخطر الأمني عند التسريب**: تمكين المهاجم من تجاوز بوابات التحقق والتحكم في حسابات المعلمين والإداريين.
2. **`GEMINI_API_KEY`**:
   - مفتاح المصادقة مع واجهة برمجة Google Gemini API لتشغيل خدمات الذكاء الاصطناعي (تحليل مخارج الحروف، التقييم الآلي للتلاوات، وتوليد التغذية الراجعة القرآنية).
   - **الخطر الأمني عند التسريب**: استنزاف الحصص (Quota Abuse)، وارتفاع التكاليف المالية، وإمكانية إساءة استخدام النموذج.

---

### ٣.٢ خطوات التفعيل والتهيئة عبر `gcloud CLI`

#### الخطوة ١: ضبط المشروع وتفعيل واجهة Secret Manager API
```bash
# ضبط المشروع المستهدف
gcloud config set project flawless-cacao-n4r4b

# تفعيل واجهة برمجة Secret Manager
gcloud services enable secretmanager.googleapis.com --project=flawless-cacao-n4r4b
```

#### الخطوة ٢: إنشاء الأسرار وتخزين القيم الآمنة
```bash
# إنشاء السر الخاص بالمفتاح الإداري الرئيسي مع تعيين سياسة النسخ الاحتياطي التلقائي
gcloud secrets create ADMIN_MASTER_KEY \
    --replication-policy="automatic" \
    --labels=app=rehab-quran,environment=production,tier=backend \
    --project=flawless-cacao-n4r4b

# إضافة الإصدار الأول لمفتاح الإدارة الحرج (يتم إدخاله عبر stdin بأمان دون ظهوره في سجل الطرفية)
echo -n "YOUR_HIGH_ENTROPY_ADMIN_MASTER_KEY_HERE" | \
    gcloud secrets versions add ADMIN_MASTER_KEY --data-file=- --project=flawless-cacao-n4r4b

# إنشاء السر الخاص بمفتاح Gemini API
gcloud secrets create GEMINI_API_KEY \
    --replication-policy="automatic" \
    --labels=app=rehab-quran,environment=production,service=ai-evaluation \
    --project=flawless-cacao-n4r4b

# إضافة الإصدار الأول لمفتاح Gemini API
echo -n "YOUR_VALID_GEMINI_API_KEY_HERE" | \
    gcloud secrets versions add GEMINI_API_KEY --data-file=- --project=flawless-cacao-n4r4b
```

---

### ٣.٣ تطبيق مبدأ الامتياز الأدنى (Least Privilege) على مستوى الأسرار

#### الخطوة ١: إنشاء حساب خدمة مخصص للواجهة الخلفية (Backend Service Account)
تجنب تشغيل التطبيق بحساب الخدمة الافتراضي للكمبيوتر (`Default Compute Service Account`):
```bash
gcloud iam service-accounts create rehab-backend-sa \
    --display-name="Rehab Quran Backend Application Service Account" \
    --description="حساب الخدمة المخصص لمعالجة طلبات الواجهة الخلفية والوصول للأسرار وقاعدة البيانات" \
    --project=flawless-cacao-n4r4b
```
البريد الإلكتروني لحساب الخدمة الناتج:
`rehab-backend-sa@flawless-cacao-n4r4b.iam.gserviceaccount.com`

#### الخطوة ٢: تقييد الوصول للأسرار (Resource-Level IAM Binding)
بدلاً من منح صلاحيات على مستوى المشروع كاملاً، يتم منح صلاحية القراءة فقط (`roles/secretmanager.secretAccessor`) لكل سر على حدة:

```bash
# منح صلاحية الوصول لقراءة مفتاح الإدارة لحساب الخدمة فقط
gcloud secrets add-iam-policy-binding ADMIN_MASTER_KEY \
    --member="serviceAccount:rehab-backend-sa@flawless-cacao-n4r4b.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor" \
    --project=flawless-cacao-n4r4b

# منح صلاحية الوصول لقراءة مفتاح Gemini API لحساب الخدمة فقط
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
    --member="serviceAccount:rehab-backend-sa@flawless-cacao-n4r4b.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor" \
    --project=flawless-cacao-n4r4b
```

> **ملاحظة أمنية حرجة**: لا تمنح حساب الخدمة أبداً دور `roles/secretmanager.admin` أو `roles/editor`، فهذا يمنع العبث بالأسرار أو مسحها أو تعديل سجلاتها.

---

### ٣.٤ كود الاستدعاء البرمجي في السيرفر (Node.js / TypeScript)

في بيئة السيرفر (`server.ts` أو Cloud Functions / Cloud Run)، يتم استدعاء الأسرار عبر حزمة `@google-cloud/secret-manager` ديناميكياً عند بدء التشغيل دون الحاجة لتخزينها في ملفات `.env` غير مشفرة:

```typescript
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const secretClient = new SecretManagerServiceClient();
const PROJECT_ID = 'flawless-cacao-n4r4b';

interface SystemSecrets {
  adminMasterKey: string;
  geminiApiKey: string;
}

/**
 * جلب قيمة أحدث إصدار من سر محدد في Secret Manager
 */
async function getSecretValue(secretName: string): Promise<string> {
  const name = `projects/${PROJECT_ID}/secrets/${secretName}/versions/latest`;
  try {
    const [version] = await secretClient.accessSecretVersion({ name });
    const payload = version.payload?.data?.toString();
    if (!payload) {
      throw new Error(`قيمة السر ${secretName} فارغة أو غير متوفرة.`);
    }
    return payload;
  } catch (error) {
    console.error(`[Security Alert] فشل استرداد السر ${secretName} من Secret Manager:`, error);
    throw error;
  }
}

/**
 * تهيئة الأسرار في الذاكرة الحية للسيرفر فقط وتفادي كتابتها في السجلات
 */
export async function loadSystemSecrets(): Promise<SystemSecrets> {
  const [adminMasterKey, geminiApiKey] = await Promise.all([
    getSecretValue('ADMIN_MASTER_KEY'),
    getSecretValue('GEMINI_API_KEY'),
  ]);

  // تعيينها كمتغيرات بيئة مشفرة في ذاكرة العملية Runtime Memory
  process.env.ADMIN_MASTER_KEY = adminMasterKey;
  process.env.GEMINI_API_KEY = geminiApiKey;

  console.info('[Security Engine] تم تحميل الأسرار السحابية بنجاح من Secret Manager.');
  return { adminMasterKey, geminiApiKey };
}
```

---

## ٤. إعداد سياسات IAM لتقييد الوصول إلى قاعدة بيانات Firestore المحددة

### ٤.١ التحدي والهدف
يحتوي ملف `firebase-applet-config.json` على قاعدة بيانات مسمّاة محددة:
```json
"firestoreDatabaseId": "ai-studio-remix-56841409-6e0e-4be0-8a09-dd6a1dbe5a63"
```
افتراضياً، تمنح سياسات IAM العامة في Google Cloud صلاحيات مثل `roles/datastore.user` على **كافة** قواعد البيانات في المشروع (`(default)` وأي قواعد أخرى). 
المطلوب هو حصر صلاحيات حساب الخدمة والمطورين لتقتصر حصراً وبشكل صارم على هذه القاعدة المحددة فقط.

---

### ٤.٢ بنية معرّف المورد في GCP لـ Named Firestore Database
المسار الكامل للمورد في معمارية Google Cloud Resource Hierarchy:
```text
projects/flawless-cacao-n4r4b/databases/ai-studio-remix-56841409-6e0e-4be0-8a09-dd6a1dbe5a63
```

---

### ٤.٣ إعداد الشروط المقيدة (IAM Conditions) باستخدام صيغة CEL

يتيح محرك IAM Conditions تقييد الأدوار باستخدام لغة **Common Expression Language (CEL)** للتحقق من خاصية `resource.name`.

#### التعبير المنطقي المعتمد (CEL Expression):
```cel
resource.name.startsWith("projects/flawless-cacao-n4r4b/databases/ai-studio-remix-56841409-6e0e-4be0-8a09-dd6a1dbe5a63")
```

---

### ٤.٤ تنفيذ سياسة IAM المشروطة عبر `gcloud CLI`

#### تطبيق دور مستخدم قاعدة البيانات (`roles/datastore.user`) بشرط الحصر على القاعدة المحددة:

```bash
gcloud projects add-iam-policy-binding flawless-cacao-n4r4b \
    --member="serviceAccount:rehab-backend-sa@flawless-cacao-n4r4b.iam.gserviceaccount.com" \
    --role="roles/datastore.user" \
    --condition='title=restrict_to_specific_rehab_database,description=حصر الوصول لقاعدة بيانات مقرأة رحاب القرآن المحددة فقط,expression=resource.name.startsWith("projects/flawless-cacao-n4r4b/databases/ai-studio-remix-56841409-6e0e-4be0-8a09-dd6a1dbe5a63")'
```

#### للمراقبين ومدققي الحسابات (Auditors / Viewers):
إذا كان هناك حساب تدقيق يحتاج لقراءة البيانات فقط دون تعديلها:
```bash
gcloud projects add-iam-policy-binding flawless-cacao-n4r4b \
    --member="group:security-auditors@yourdomain.com" \
    --role="roles/datastore.viewer" \
    --condition='title=audit_viewer_rehab_db_only,description=صلاحية عرض تدقيقي لقاعدة بيانات المقرأة المحددة فقط,expression=resource.name.startsWith("projects/flawless-cacao-n4r4b/databases/ai-studio-remix-56841409-6e0e-4be0-8a09-dd6a1dbe5a63")'
```

---

### ٤.٥ التحقق من صحة سياسة IAM المطبقة
للتأكد من تسجيل الشرط بشكل دقيق في المشروع:
```bash
gcloud projects get-iam-policy flawless-cacao-n4r4b \
    --flatten="bindings[].members" \
    --format='table(bindings.role, bindings.members, bindings.condition.expression)' \
    --filter="bindings.members:rehab-backend-sa"
```

النتيجة المتوقعة:
| ROLE | MEMBERS | EXPRESSION |
| :--- | :--- | :--- |
| `roles/datastore.user` | `serviceAccount:rehab-backend-sa@...` | `resource.name.startsWith("projects/flawless-cacao-n4r4b/databases/ai-studio-remix-56841409-6e0e-4be0-8a09-dd6a1dbe5a63")` |

---

## ٥. طبقة الحماية المتكاملة (Defense-in-Depth)

تطبيق سياسات IAM السابقة يحمي جانب الخادم والبنية التحتية، بينما تكتمل المنظومة بالقواعد الميدانية داخل التطبيق:

```text
                                 [طلب العميل / الواجهة]
                                          │
                                          ▼
                         [Firebase Authentication & JWT]
                         (التحقق من هوية المستخدم ورتبته)
                                          │
                                          ▼
                         [Firestore Security Rules]
                          (تحقق محلي على مستوى المستندات)
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
         [Client SDK Direct]                           [Backend Service API]
   (مقيد بقواعد firestore.rules)                                  │
                                                                  ▼
                                                      [Cloud IAM Conditions]
                                                  (مقيد بقاعدة البيانات المحددة)
                                                                  │
                                                                  ▼
                                                      [Cloud Secret Manager]
                                                  (استدعاء المفاتيح المعتمدة)
```

1. **على مستوى العميل (Web Browser / Client SDK)**:
   - الاتصال المباشر بقاعدة البيانات يخضع لقواعد `firestore.rules`.
   - لا يتم تزويد واجهة العميل بمفتاح `ADMIN_MASTER_KEY` مطلقاً.
   - مفتاح `apiKey` الموجود في `firebase-applet-config.json` محمي بقيود النطاق (HTTP Referrer Restrictions) في Google Cloud Credentials Console.

2. **على مستوى الخادم (Backend / Cloud Run / SSR)**:
   - يتصل باستخدام حساب الخدمة `rehab-backend-sa`.
   - الصلاحيات محددة فقط بقاعدة البيانات `ai-studio-remix-56841409-6e0e-4be0-8a09-dd6a1dbe5a63`.
   - يتم سحب الأسرار في الذاكرة الحية المؤقتة وتدويرها تلقائياً.

---

## ٦. تدوير المفاتيح (Key Rotation) والتنبيهات الأمنية

### ٦.١ تدوير سر `GEMINI_API_KEY` دون توقف الخدمة
1. إنشاء مفتاح جديد في Google AI Studio.
2. إضافة إصدار جديد إلى السر القائم:
   ```bash
   echo -n "NEW_GEMINI_API_KEY" | \
       gcloud secrets versions add GEMINI_API_KEY --data-file=- --project=flawless-cacao-n4r4b
   ```
3. إعادة تشغيل حاويات السيرفر أو استدعاء دالة تحديث الذاكرة `loadSystemSecrets()`.
4. تعطيل الإصدار القديم بعد التأكد من سلامة التشغيل:
   ```bash
   gcloud secrets versions disable 1 --secret=GEMINI_API_KEY --project=flawless-cacao-n4r4b
   ```

### ٦.٢ تفعيل سجلات التدقيق والتنبيهات (Cloud Audit Logs)
لضمان رصد أي محاولة غير مصرح بها:
```bash
# تفعيل سجلات الوصول للبيانات (DATA_READ و DATA_WRITE) في Secret Manager
cat <<EOF > audit_config.yaml
auditConfigs:
- auditLogConfigs:
  - logType: DATA_READ
  - logType: DATA_WRITE
  - logType: ADMIN_READ
  service: secretmanager.googleapis.com
- auditLogConfigs:
  - logType: DATA_READ
  - logType: DATA_WRITE
  service: firestore.googleapis.com
EOF

gcloud projects set-iam-policy flawless-cacao-n4r4b audit_config.yaml
```

---

## ٧. قائمة التحقق الأمني للإدارة (Security Checklist)

- [x] تفعيل `secretmanager.googleapis.com` في المشروع `flawless-cacao-n4r4b`.
- [x] إنشاء السر `ADMIN_MASTER_KEY` مع عزل صلاحياته عن واجهة المستخدم.
- [x] إنشاء السر `GEMINI_API_KEY` وحظر ظهوره في حزم العميل الأمامية (Client Bundles).
- [x] إنشاء حساب خدمة مخصص `rehab-backend-sa@flawless-cacao-n4r4b.iam.gserviceaccount.com`.
- [x] تطبيق شرط IAM Condition لتقييد صلاحيات Firestore على قاعدة `ai-studio-remix-56841409-6e0e-4be0-8a09-dd6a1dbe5a63` فقط.
- [x] تقييد مفتاح API العام في Google Cloud Console بحسب النطاقات المصرح لها (HTTP Referrers).
- [x] التحقق من توافق سجلات التدقيق والمراقبة في تبويب `Audit Logs` داخل بوابة الإدارة.

---
**تم إعداد وتدقيق هذا الدليل الأمني وفقاً لأحدث الممارسات المعتمدة لمنظومة مقرأة رحاب القرآن الإلكترونية.**
