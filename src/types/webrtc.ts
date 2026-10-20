/**
 * أنواع وبيانات بث الحلقات القرآنية المباشرة عبر WebRTC
 * مقرأة رحاب القرآن الإلكترونية - الهوية الرسمية 2026
 */

export interface WebRtcParticipant {
  id: string;
  name: string;
  role: 'teacher' | 'student' | 'supervisor';
  section?: 'male' | 'female' | 'both';
  isAudioOnly: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isHandRaised: boolean;
  isCurrentReciter: boolean;
  joinedAt: string;
  stream?: MediaStream;
  avatarText?: string;
}

export interface WebRtcChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'teacher' | 'student' | 'supervisor';
  text: string;
  timestamp: string;
  isTajweedNote?: boolean;
}

export interface QuranSyncState {
  surahNumber: number;
  surahName: string;
  ayahStart: number;
  ayahEnd: number;
  juzNumber: number;
  pageNumber?: number;
  sampleAyahText?: string;
  updatedBy: string;
}

export interface LiveHalqaSessionInfo {
  roomId: string;
  halqaTitle: string;
  halqaId?: string;
  teacherId: string;
  teacherName: string;
  section?: 'male' | 'female';
  status: 'active' | 'ended' | 'waiting';
  startedAt: string;
  currentReciterId?: string;
  currentReciterName?: string;
  quranSync?: QuranSyncState;
  participantsCount: number;
}
