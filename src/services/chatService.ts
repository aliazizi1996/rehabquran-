/**
 * Chat & Halqa Assignment Service - مقرأة رحاب القرآن الإلكترونية
 * خدمة المحادثة الفورية بين الطالب ومعلمه المعيّن وإدارة الحلقات
 * متوافقة 100% مع Firebase Authentication وCloud Firestore (Spark Plan)
 */

import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  onSnapshot, 
  getDocs,
  getDoc,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { db, auth, getFirebaseAuthHeaders } from '../lib/firebase';
import { AuthAccount } from '../types';
import { recordAuditLog } from './contentManagementService';
import { getAcademyDatabase, saveAcademyDatabase } from '../data/academyDb';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'student' | 'teacher' | 'supervisor' | 'admin';
  recipientId: string;
  recipientName: string;
  recipientRole?: string;
  text: string;
  createdAt: string;
  createdAtMs: number;
  read: boolean;
  readAt?: string | null;
  halqaId?: string;
  halqaTitle?: string;
  isBroadcast?: boolean; // تمييز الرسائل الجماعية عن الفردية
}

export interface StudentHalqaAssignment {
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  halqaId: string;
  halqaTitle: string;
  halqaType?: string;
  halqaSchedule: string;
  whatsappGroupUrl?: string; // رابط مجموعة واتساب المعتمد من المشرف فقط
  googleMeetUrl?: string; // رابط البث المباشر Google Meet المنشور من المعلم
  lastUpdated?: string;
}

export interface HalqaAnnouncement {
  id: string;
  halqaId: string;
  halqaTitle: string;
  teacherId: string;
  teacherName: string;
  title: string;
  content: string;
  priority?: 'normal' | 'urgent';
  createdAt: string;
  createdAtMs: number;
}

const LOCAL_STORAGE_CHAT_PREFIX = 'rehab_chat_conv_';
const LOCAL_STORAGE_ASSIGNMENTS_KEY = 'rehab_student_halqa_assignments_v1';
const LOCAL_STORAGE_HALQAS_EXTRA_KEY = 'rehab_halqas_extra_details_v1';
const LOCAL_STORAGE_ANNOUNCEMENTS_PREFIX = 'rehab_halqa_announcements_';

// Build a deterministic conversation ID between two parties
export function getConversationId(userId1: string, userId2: string): string {
  const sorted = [userId1, userId2].sort();
  return `conv_${sorted[0]}_${sorted[1]}`;
}

/**
 * إرسال رسالة فورية بين الطالب ومعلمه وحفظها في Firestore
 */
export async function sendChatMessage(params: {
  senderId: string;
  senderName: string;
  senderRole: 'student' | 'teacher' | 'supervisor' | 'admin';
  recipientId: string;
  recipientName: string;
  recipientRole?: string;
  text: string;
  halqaId?: string;
  halqaTitle?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const trimmedText = params.text.trim();
  if (!trimmedText) {
    return { success: false, error: 'نص الرسالة فارغ' };
  }

  const conversationId = getConversationId(params.senderId, params.recipientId);
  const now = new Date();
  const createdAt = now.toISOString();
  const createdAtMs = now.getTime();
  const messageId = `msg_${createdAtMs}_${Math.random().toString(36).substring(2, 7)}`;

  const newMsg: ChatMessage = {
    id: messageId,
    conversationId,
    senderId: params.senderId,
    senderName: params.senderName,
    senderRole: params.senderRole,
    recipientId: params.recipientId,
    recipientName: params.recipientName,
    recipientRole: params.recipientRole || (params.senderRole === 'student' ? 'teacher' : 'student'),
    text: trimmedText,
    createdAt,
    createdAtMs,
    read: false,
    readAt: null,
    halqaId: params.halqaId,
    halqaTitle: params.halqaTitle,
  };

  // 1. Save to local storage for immediate responsiveness and offline resilience
  try {
    const localKey = `${LOCAL_STORAGE_CHAT_PREFIX}${conversationId}`;
    const cached = JSON.parse(localStorage.getItem(localKey) || '[]');
    cached.push(newMsg);
    localStorage.setItem(localKey, JSON.stringify(cached));
  } catch (e) {
    console.warn('Could not cache message locally:', e);
  }

  // 2. Persist to Cloud Firestore (/messages collection)
  try {
    const msgDocRef = doc(db, 'messages', messageId);
    await setDoc(msgDocRef, {
      ...newMsg,
      _serverTimestamp: serverTimestamp()
    });

    return { success: true, messageId };
  } catch (err: any) {
    console.warn('Firestore message save note:', err?.message);
    // Even if firestore network is temporarily delayed, local message is stored
    return { success: true, messageId };
  }
}

/**
 * الاشتراك الحي والمباشر (Real-time onSnapshot) في محادثة محددة
 */
export function subscribeToConversation(
  userId1: string,
  userId2: string,
  onUpdate: (messages: ChatMessage[]) => void
): () => void {
  const conversationId = getConversationId(userId1, userId2);
  const localKey = `${LOCAL_STORAGE_CHAT_PREFIX}${conversationId}`;

  // Initial load from local cache
  try {
    const cached = JSON.parse(localStorage.getItem(localKey) || '[]');
    if (Array.isArray(cached) && cached.length > 0) {
      onUpdate(cached);
    }
  } catch (e) {
    // Ignore cache parse error
  }

  try {
    const messagesRef = collection(db, 'messages');
    // Using single where filter + limit to guarantee full compatibility and prevent read explosions on Spark
    const q = query(
      messagesRef, 
      where('conversationId', '==', conversationId),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveList: ChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as ChatMessage;
        liveList.push({
          ...data,
          id: docSnap.id
        });
      });

      // Also incorporate any local offline messages that might not have synced yet
      try {
        const cached: ChatMessage[] = JSON.parse(localStorage.getItem(localKey) || '[]');
        const combined = [...liveList];
        for (const localMsg of cached) {
          if (!combined.some(m => m.id === localMsg.id)) {
            combined.push(localMsg);
          }
        }
        // Chronological order: oldest first, newest at the bottom
        combined.sort((a, b) => (a.createdAtMs || 0) - (b.createdAtMs || 0));
        localStorage.setItem(localKey, JSON.stringify(combined));
        onUpdate(combined);
      } catch {
        liveList.sort((a, b) => (a.createdAtMs || 0) - (b.createdAtMs || 0));
        onUpdate(liveList);
      }
    }, (error) => {
      console.warn('Chat subscription fallback to local cache:', error.message);
      // Fallback to local cache
      const cached = JSON.parse(localStorage.getItem(localKey) || '[]');
      onUpdate(cached);
    });

    return unsubscribe;
  } catch (err) {
    console.error('Failed to initialize Firestore chat subscription:', err);
    return () => {};
  }
}

/**
 * تحديث حالة الرسائل المقروءة (Mark as Read)
 */
export async function markMessagesAsRead(
  messages: ChatMessage[],
  currentUserId: string
): Promise<void> {
  const unreadIncoming = messages.filter(
    (m) => m.recipientId === currentUserId && !m.read
  );

  if (unreadIncoming.length === 0) return;

  const now = new Date().toISOString();

  // Update in local cache
  if (messages.length > 0) {
    const conversationId = messages[0].conversationId;
    const localKey = `${LOCAL_STORAGE_CHAT_PREFIX}${conversationId}`;
    try {
      const cached: ChatMessage[] = JSON.parse(localStorage.getItem(localKey) || '[]');
      const updated = cached.map((m) => {
        if (m.recipientId === currentUserId && !m.read) {
          return { ...m, read: true, readAt: now };
        }
        return m;
      });
      localStorage.setItem(localKey, JSON.stringify(updated));
    } catch {}
  }

  // Update in Firestore
  for (const msg of unreadIncoming) {
    try {
      const docRef = doc(db, 'messages', msg.id);
      await updateDoc(docRef, {
        read: true,
        readAt: now
      });
    } catch (e) {
      // Ignore individual update error
    }
  }
}

/**
 * الاشتراك في عدد الرسائل غير المقروءة الواردة للمستخدم
 */
export function subscribeToUnreadCount(
  userId: string,
  onCountChange: (count: number) => void
): () => void {
  try {
    const messagesRef = collection(db, 'messages');
    // Only query unread messages (read: false) with a cap to drastically reduce Spark reads
    const q = query(
      messagesRef, 
      where('recipientId', '==', userId),
      where('read', '==', false),
      limit(30)
    );

    return onSnapshot(q, (snapshot) => {
      onCountChange(snapshot.size);
    }, () => {
      // Local fallback
      try {
        let count = 0;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(LOCAL_STORAGE_CHAT_PREFIX)) {
            const list: ChatMessage[] = JSON.parse(localStorage.getItem(key) || '[]');
            count += list.filter(m => m.recipientId === userId && !m.read).length;
          }
        }
        onCountChange(count);
      } catch {
        onCountChange(0);
      }
    });
  } catch {
    return () => {};
  }
}

/**
 * استرجاع بيانات الحلقة والشيخ المعيّن للطالب
 * تضمن دائماً بيانات دقيقة ومحدّثة من المشرف
 */
export async function getStudentHalqaDetails(
  studentAccount: AuthAccount
): Promise<StudentHalqaAssignment> {
  const studentId = studentAccount.id;
  const isFemale = studentAccount.section === 'female' || studentAccount.gender === 'female';

  // Default fallback assignment
  const defaultAssignment: StudentHalqaAssignment = {
    studentId,
    studentName: studentAccount.name,
    teacherId: isFemale ? 'tch-2' : 'tch-1',
    teacherName: isFemale ? 'الشيخة أم أنس الزبيدي' : 'الشيخ إبراهيم الوصابي',
    halqaId: isFemale ? 'cls-f1' : 'cls-m1',
    halqaTitle: isFemale ? 'حلقة الزهراوان لتثبيت الحفظ (عصراً)' : 'حلقة الإتقان والتحفيظ (الفجر)',
    halqaSchedule: isFemale ? 'الأحد والثلاثاء والخميس (4:00 م - 5:30 م)' : 'السبت والإثنين والأربعاء (5:30 ص - 7:00 ص)',
    whatsappGroupUrl: undefined, // No fake links! Only supervisor-assigned links
  };

  // 1. Check local assignments cache
  try {
    const storedAssignments: Record<string, StudentHalqaAssignment> = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_ASSIGNMENTS_KEY) || '{}'
    );
    if (storedAssignments[studentId]) {
      return {
        ...defaultAssignment,
        ...storedAssignments[studentId],
        studentName: studentAccount.name
      };
    }
    if (studentAccount.username && storedAssignments[studentAccount.username]) {
      return {
        ...defaultAssignment,
        ...storedAssignments[studentAccount.username],
        studentName: studentAccount.name
      };
    }
  } catch {}

  // 1.5 Check Academy Database for matched student
  try {
    const academyDbRaw = localStorage.getItem('rehab_quran_academy_db_v2');
    if (academyDbRaw) {
      const dbParsed = JSON.parse(academyDbRaw);
      const studentsList = Array.isArray(dbParsed?.students) ? dbParsed.students : [];
      const found = studentsList.find((s: any) => 
        s && (
          s.userId === studentId || 
          s.id === studentId || 
          s.academicId === studentAccount.username || 
          s.academicId === studentId ||
          s.name === studentAccount.name
        )
      );
      if (found) {
        const classesList = Array.isArray(dbParsed?.classes) ? dbParsed.classes : [];
        const cls = classesList.find((c: any) => c && (c.id === found.classId || c.name === found.className));
        return {
          ...defaultAssignment,
          studentId,
          studentName: found.name || studentAccount.name,
          teacherId: found.teacherId || cls?.teacherId || defaultAssignment.teacherId,
          teacherName: found.teacherName || cls?.teacherName || defaultAssignment.teacherName,
          halqaId: found.classId || cls?.id || defaultAssignment.halqaId,
          halqaTitle: found.className || cls?.name || defaultAssignment.halqaTitle,
          halqaSchedule: found.preferredTime || cls?.scheduleTime || defaultAssignment.halqaSchedule,
          googleMeetUrl: cls?.meetUrl || undefined,
        };
      }
    }
  } catch {}

  // 2. Query Firestore /students or /users
  try {
    const studentDocRef = doc(db, 'students', studentId);
    const snap = await getDoc(studentDocRef);
    if (snap.exists()) {
      const data = snap.data();
      const assignment: StudentHalqaAssignment = {
        studentId,
        studentName: data.name || studentAccount.name,
        teacherId: data.teacherId || defaultAssignment.teacherId,
        teacherName: data.teacherName || defaultAssignment.teacherName,
        halqaId: data.assignedHalqaId || defaultAssignment.halqaId,
        halqaTitle: data.assignedHalqaTitle || data.halqaTitle || defaultAssignment.halqaTitle,
        halqaSchedule: data.halqaSchedule || defaultAssignment.halqaSchedule,
        whatsappGroupUrl: data.whatsappGroupUrl || undefined,
        googleMeetUrl: data.googleMeetUrl || undefined,
      };

      // Also check halqa details if halqaId exists
      if (assignment.halqaId) {
        const halqaSnap = await getDoc(doc(db, 'halqas', assignment.halqaId));
        if (halqaSnap.exists()) {
          const hData = halqaSnap.data();
          if (hData.whatsappGroupUrl) assignment.whatsappGroupUrl = hData.whatsappGroupUrl;
          if (hData.googleMeetUrl) assignment.googleMeetUrl = hData.googleMeetUrl;
          if (hData.halqaType) assignment.halqaType = hData.halqaType;
          if (hData.timeSlot) assignment.halqaSchedule = hData.timeSlot;
          if (hData.teacherName) assignment.teacherName = hData.teacherName;
          if (hData.teacherId) assignment.teacherId = hData.teacherId;
          if (hData.title) assignment.halqaTitle = hData.title;
        }
      }

      return assignment;
    }
  } catch (err) {
    console.warn('Could not fetch student halqa from Firestore:', err);
  }

  return defaultAssignment;
}

/**
 * وظيفة المشرف: إسناد وتعيين المعلم والحلقة للطالب مع رابط الواتساب والموعد
 */
export async function assignStudentHalqaBySupervisor(params: {
  studentId: string;
  studentName: string;
  academicId?: string;
  teacherId: string;
  teacherName: string;
  halqaId: string;
  halqaTitle: string;
  halqaSchedule: string;
  whatsappGroupUrl?: string;
  googleMeetUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanWhatsappUrl = params.whatsappGroupUrl?.trim() || undefined;
    const cleanMeetUrl = params.googleMeetUrl?.trim() || undefined;

    const assignment: StudentHalqaAssignment = {
      studentId: params.studentId,
      studentName: params.studentName,
      teacherId: params.teacherId,
      teacherName: params.teacherName,
      halqaId: params.halqaId,
      halqaTitle: params.halqaTitle,
      halqaSchedule: params.halqaSchedule,
      whatsappGroupUrl: cleanWhatsappUrl,
      googleMeetUrl: cleanMeetUrl,
      lastUpdated: new Date().toISOString(),
    };

    // 1. Save in local cache (index by both studentId and academicId if available)
    try {
      const stored: Record<string, StudentHalqaAssignment> = JSON.parse(
        localStorage.getItem(LOCAL_STORAGE_ASSIGNMENTS_KEY) || '{}'
      );
      stored[params.studentId] = assignment;
      if (params.academicId) {
        stored[params.academicId] = assignment;
      }
      localStorage.setItem(LOCAL_STORAGE_ASSIGNMENTS_KEY, JSON.stringify(stored));
    } catch {}

    // 2. Persist in Firestore /students/{studentId}
    const studentDocRef = doc(db, 'students', params.studentId);
    await setDoc(studentDocRef, {
      id: params.studentId,
      userId: params.studentId,
      name: params.studentName,
      academicId: params.academicId || null,
      teacherId: params.teacherId,
      teacherName: params.teacherName,
      assignedHalqaId: params.halqaId,
      assignedHalqaTitle: params.halqaTitle,
      halqaSchedule: params.halqaSchedule,
      whatsappGroupUrl: cleanWhatsappUrl || null,
      googleMeetUrl: cleanMeetUrl || null,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    // 3. Also update /users/{studentId} if it exists
    try {
      const userDocRef = doc(db, 'users', params.studentId);
      await setDoc(userDocRef, {
        assignedHalqaTitle: params.halqaTitle,
        assignedHalqaIds: [params.halqaId],
        teacherId: params.teacherId,
        teacherName: params.teacherName,
        halqaSchedule: params.halqaSchedule,
        whatsappGroupUrl: cleanWhatsappUrl || null,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch {}

    // 4. Update the Halqa document itself if whatsappGroupUrl or schedule changed
    if (params.halqaId) {
      try {
        const halqaRef = doc(db, 'halqas', params.halqaId);
        await setDoc(halqaRef, {
          title: params.halqaTitle,
          teacherName: params.teacherName,
          teacherId: params.teacherId,
          timeSlot: params.halqaSchedule,
          whatsappGroupUrl: cleanWhatsappUrl || null,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch {}
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error assigning halqa by supervisor:', err);
    return { success: false, error: err?.message || 'فشل حفظ الإسناد في قاعدة البيانات' };
  }
}

/**
 * وظيفة المشرف: تعديل رابط مجموعة الواتساب وموعد الحلقة مباشرة
 */
export async function updateHalqaDetailsBySupervisor(params: {
  halqaId: string;
  title?: string;
  halqaType?: string;
  classification?: string;
  timeSlot?: string;
  teacherName?: string;
  teacherId?: string;
  whatsappGroupUrl?: string;
  googleMeetUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanWaUrl = params.whatsappGroupUrl?.trim() || undefined;
    const cleanMeetUrl = params.googleMeetUrl?.trim() || undefined;

    // Cache extra details locally
    try {
      const extraMap = JSON.parse(localStorage.getItem(LOCAL_STORAGE_HALQAS_EXTRA_KEY) || '{}');
      extraMap[params.halqaId] = {
        ...extraMap[params.halqaId],
        whatsappGroupUrl: cleanWaUrl,
        googleMeetUrl: cleanMeetUrl,
        timeSlot: params.timeSlot,
        title: params.title,
        halqaType: params.halqaType,
        classification: params.classification,
        teacherName: params.teacherName,
      };
      localStorage.setItem(LOCAL_STORAGE_HALQAS_EXTRA_KEY, JSON.stringify(extraMap));
    } catch {}

    // Update in Firestore
    const halqaRef = doc(db, 'halqas', params.halqaId);
    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };
    if (params.title) updates.title = params.title;
    if (params.halqaType) updates.halqaType = params.halqaType;
    if (params.classification) updates.classification = params.classification;
    if (params.timeSlot) updates.timeSlot = params.timeSlot;
    if (params.teacherName) updates.teacherName = params.teacherName;
    if (params.teacherId) updates.teacherId = params.teacherId;
    updates.whatsappGroupUrl = cleanWaUrl || null;
    if (cleanMeetUrl !== undefined) {
      updates.googleMeetUrl = cleanMeetUrl || null;
    }

    await setDoc(halqaRef, updates, { merge: true });
    return { success: true };
  } catch (err: any) {
    console.error('Error updating halqa details:', err);
    return { success: false, error: err?.message || 'فشل تحديث بيانات الحلقة' };
  }
}

/**
 * وظيفة المعلم: تحديث رابط Google Meet وموعد الحلقة المباشرة ليظهر تلقائياً للطلاب
 */
export async function updateHalqaLiveSessionByTeacher(params: {
  halqaId: string;
  teacherId: string;
  teacherName: string;
  googleMeetUrl: string;
  timeSlot?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanMeetUrl = params.googleMeetUrl.trim();
    if (!cleanMeetUrl) {
      return { success: false, error: 'يرجى إدخال رابط Google Meet صالح' };
    }

    const halqaRef = doc(db, 'halqas', params.halqaId);
    const updates: Record<string, any> = {
      googleMeetUrl: cleanMeetUrl,
      updatedAt: new Date().toISOString(),
    };
    if (params.timeSlot) updates.timeSlot = params.timeSlot.trim();

    await setDoc(halqaRef, updates, { merge: true });

    // Update local cache
    try {
      const extraMap = JSON.parse(localStorage.getItem(LOCAL_STORAGE_HALQAS_EXTRA_KEY) || '{}');
      extraMap[params.halqaId] = {
        ...extraMap[params.halqaId],
        googleMeetUrl: cleanMeetUrl,
        timeSlot: params.timeSlot || extraMap[params.halqaId]?.timeSlot,
      };
      localStorage.setItem(LOCAL_STORAGE_HALQAS_EXTRA_KEY, JSON.stringify(extraMap));
    } catch {}

    // Record audit log
    await recordAuditLog({
      operatorName: params.teacherName,
      operatorEmail: `${params.teacherId}@rehabquran.org`,
      operatorRole: 'teacher',
      action: 'تحديث رابط الحلقة المباشرة (Google Meet)',
      targetItem: params.halqaId,
      details: `قام فضيلة الشيخ (${params.teacherName}) بنشر رابط Google Meet للحلقة: ${cleanMeetUrl}`,
      status: 'SUCCESS',
      timestamp: new Date().toLocaleTimeString('ar-SA'),
    });

    return { success: true };
  } catch (err: any) {
    console.error('Error updating live session meet url:', err);
    return { success: false, error: err?.message || 'فشل تحديث رابط Google Meet' };
  }
}

/**
 * وظيفة المعلم: نشر إعلان أو رسالة جماعية لطلاب حلقته فقط
 */
export async function publishHalqaAnnouncement(params: {
  halqaId: string;
  halqaTitle: string;
  teacherId: string;
  teacherName: string;
  title: string;
  content: string;
  priority?: 'normal' | 'urgent';
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const trimmedContent = params.content.trim();
    if (!trimmedContent) {
      return { success: false, error: 'محتوى الإعلان فارغ' };
    }

    const now = new Date();
    const createdAtMs = now.getTime();
    const announcementId = `ann_${createdAtMs}_${Math.random().toString(36).substring(2, 7)}`;

    const announcement: HalqaAnnouncement = {
      id: announcementId,
      halqaId: params.halqaId,
      halqaTitle: params.halqaTitle,
      teacherId: params.teacherId,
      teacherName: params.teacherName,
      title: params.title.trim() || 'توجيه قرآني لطلاب الحلقة',
      content: trimmedContent,
      priority: params.priority || 'normal',
      createdAt: now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }),
      createdAtMs,
    };

    // 1. Cache locally
    try {
      const localKey = `${LOCAL_STORAGE_ANNOUNCEMENTS_PREFIX}${params.halqaId}`;
      const cached: HalqaAnnouncement[] = JSON.parse(localStorage.getItem(localKey) || '[]');
      cached.unshift(announcement);
      localStorage.setItem(localKey, JSON.stringify(cached.slice(0, 50)));
    } catch {}

    // 2. Save to Cloud Firestore (/halqa_announcements collection)
    const docRef = doc(db, 'halqa_announcements', announcementId);
    await setDoc(docRef, {
      ...announcement,
      _serverTimestamp: serverTimestamp(),
    });

    // 3. Record audit log
    await recordAuditLog({
      operatorName: params.teacherName,
      operatorEmail: `${params.teacherId}@rehabquran.org`,
      operatorRole: 'teacher',
      action: 'نشر إعلان جماعي لطلاب الحلقة',
      targetItem: params.halqaTitle,
      details: `قام الشيخ (${params.teacherName}) بإرسال إعلان بعنوان [${announcement.title}] لطلاب حلقة [${params.halqaTitle}].`,
      status: 'SUCCESS',
      timestamp: now.toLocaleTimeString('ar-SA'),
    });

    return { success: true, id: announcementId };
  } catch (err: any) {
    console.error('Error publishing halqa announcement:', err);
    return { success: false, error: err?.message || 'فشل إرسال الإعلان' };
  }
}

/**
 * الاشتراك الحي والمباشر في إعلانات وتوجيهات حلقة محددة
 */
export function subscribeToHalqaAnnouncements(
  halqaId: string,
  onUpdate: (announcements: HalqaAnnouncement[]) => void
): () => void {
  const localKey = `${LOCAL_STORAGE_ANNOUNCEMENTS_PREFIX}${halqaId}`;

  // Initial load from local cache
  try {
    const cached: HalqaAnnouncement[] = JSON.parse(localStorage.getItem(localKey) || '[]');
    if (Array.isArray(cached) && cached.length > 0) {
      onUpdate(cached);
    }
  } catch {}

  try {
    const ref = collection(db, 'halqa_announcements');
    const q = query(ref, where('halqaId', '==', halqaId), limit(25));

    return onSnapshot(q, (snapshot) => {
      const list: HalqaAnnouncement[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as HalqaAnnouncement;
        list.push({ ...data, id: docSnap.id });
      });

      // Incorporate local cache
      try {
        const cached: HalqaAnnouncement[] = JSON.parse(localStorage.getItem(localKey) || '[]');
        const combined = [...list];
        for (const item of cached) {
          if (!combined.some(c => c.id === item.id)) {
            combined.push(item);
          }
        }
        combined.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
        localStorage.setItem(localKey, JSON.stringify(combined.slice(0, 50)));
        onUpdate(combined);
      } catch {
        list.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
        onUpdate(list);
      }
    }, (error) => {
      console.warn('Announcements snapshot fallback to local:', error.message);
      const cached = JSON.parse(localStorage.getItem(localKey) || '[]');
      onUpdate(cached);
    });
  } catch {
    return () => {};
  }
}

/**
 * وظيفة المشرف: نقل الطالب إلى حلقة أخرى وتغيير معلمه
 */
export async function transferStudentToHalqa(params: {
  studentId: string;
  studentName: string;
  newHalqaId: string;
  newHalqaTitle: string;
  newTeacherId: string;
  newTeacherName: string;
  newSchedule: string;
  whatsappGroupUrl?: string;
  supervisorAdmin: { name: string; email: string };
}): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await assignStudentHalqaBySupervisor({
      studentId: params.studentId,
      studentName: params.studentName,
      halqaId: params.newHalqaId,
      halqaTitle: params.newHalqaTitle,
      teacherId: params.newTeacherId,
      teacherName: params.newTeacherName,
      halqaSchedule: params.newSchedule,
      whatsappGroupUrl: params.whatsappGroupUrl,
    });

    if (res.success) {
      // Record audit log
      await recordAuditLog({
        operatorName: params.supervisorAdmin.name,
        operatorEmail: params.supervisorAdmin.email,
        operatorRole: 'supervisor',
        action: 'نقل طالب إلى حلقة أخرى',
        targetItem: params.studentName,
        details: `قام المشرف بنقل الطالب [${params.studentName}] إلى حلقة [${params.newHalqaTitle}] بإشراف فضيلة الشيخ [${params.newTeacherName}].`,
        status: 'SUCCESS',
        timestamp: new Date().toLocaleTimeString('ar-SA'),
      });
    }

    return res;
  } catch (err: any) {
    return { success: false, error: err?.message || 'فشل نقل الطالب' };
  }
}

/**
 * وظيفة المشرف: تعطيل أو تفعيل حساب مستخدم (طالب أو معلم)
 */
export async function toggleUserAccountStatus(params: {
  userId: string;
  userName: string;
  role: 'student' | 'teacher';
  newStatus: boolean; // true = active, false = disabled
  supervisorAdmin: { name: string; email: string };
  reason?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. استدعاء مسار الخادم قبل أي تعديل على Firestore
    const authHeaders = await getFirebaseAuthHeaders();
    const reason = params.reason?.trim()
      ? `${params.reason.trim()} (بواسطة المشرف ${params.supervisorAdmin.name || params.supervisorAdmin.email})`
      : `تغيير الحالة بواسطة المشرف ${params.supervisorAdmin.name || params.supervisorAdmin.email}`;
    const response = await fetch(`/api/admin/users/${params.userId}/toggle-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({
        isActive: params.newStatus,
        reason,
      }),
    });

    // 2. إذا كانت الاستجابة غير 2xx: ارمِ خطأ برسالة عربية واضحة للمشرف وامنع تعديل Firestore إطلاقاً
    if (!response.ok) {
      let serverErrorMsg = '';
      try {
        const errorJson = await response.json();
        serverErrorMsg = errorJson?.error || errorJson?.message || '';
      } catch {}

      const errorMsg = serverErrorMsg || (
        response.status === 401 || response.status === 403
          ? 'غير مصرح لك بتعديل حالة هذا الحساب أو انتهت صلاحية الجلسة'
          : `تعذر تعديل حالة المستخدم عبر الخادم (رمز الاستجابة: ${response.status})، حاول مرة أخرى`
      );
      throw new Error(errorMsg);
    }

    // 3. إذا نجح الطلب: تحديث تكميلي على العميل (مع معالجة استثنائية آمنة لأن الخادم أنجز التحديث بسلطة كاملة)
    try {
      const userDocRef = doc(db, 'users', params.userId);
      await setDoc(userDocRef, {
        isActive: params.newStatus,
        status: params.newStatus ? 'active' : 'disabled',
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      // Also update students or teachers collection
      const targetColl = params.role === 'student' ? 'students' : 'teachers';
      const docRef = doc(db, targetColl, params.userId);
      await setDoc(docRef, {
        status: params.newStatus ? 'active' : 'disabled',
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (clientFsErr) {
      console.warn('[toggle-status] Client-side Firestore sync notice (server already updated successfully):', clientFsErr);
    }

    const actionText = params.newStatus ? 'تفعيل حساب مستخدم' : 'تعطيل حساب مستخدم';
    await recordAuditLog({
      operatorName: params.supervisorAdmin.name,
      operatorEmail: params.supervisorAdmin.email,
      operatorRole: 'supervisor',
      action: actionText,
      targetItem: params.userName,
      details: `قام المشرف بـ (${actionText}) لـ [${params.userName} - ${params.role}]. المعرّف: ${params.userId}.${params.reason ? ` السبب الموثق: ${params.reason}.` : ''}`,
      status: 'SUCCESS',
      timestamp: new Date().toLocaleTimeString('ar-SA'),
    });

    return { success: true };
  } catch (err: any) {
    console.error('Error toggling user account status:', err);
    return { success: false, error: err?.message || 'فشل تعديل حالة الحساب' };
  }
}
