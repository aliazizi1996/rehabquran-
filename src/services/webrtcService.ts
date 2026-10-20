/**
 * خدمة البث المباشر للحلقات القرآنية عبر WebRTC
 * WebRTC Service for Real-time Quranic Halqas
 * مقرأة رحاب القرآن الإلكترونية
 */

import { WebRtcParticipant, WebRtcChatMessage, QuranSyncState } from '../types/webrtc';

export interface WebRtcCallbacks {
  onParticipantsChange: (participants: WebRtcParticipant[]) => void;
  onRemoteStream: (peerId: string, stream: MediaStream) => void;
  onRemoteStreamRemoved: (peerId: string) => void;
  onChatMessage: (message: WebRtcChatMessage) => void;
  onQuranSync: (sync: QuranSyncState) => void;
  onTurnGranted: (studentId: string, studentName: string) => void;
  onTurnRevoked: (studentId: string) => void;
  onHandRaised: (studentId: string, studentName: string) => void;
  onAudioLevel?: (level: number) => void;
  onConnectionStatus: (status: 'connecting' | 'connected' | 'disconnected' | 'failed') => void;
  onError: (error: string) => void;
}

export class WebRtcHalqaSession {
  private roomId: string;
  private currentUser: WebRtcParticipant;
  private callbacks: WebRtcCallbacks;
  
  private localStream: MediaStream | null = null;
  private displayStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private participants: Map<string, WebRtcParticipant> = new Map();
  
  private ws: WebSocket | null = null;
  private pollInterval: any = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private audioLevelInterval: any = null;
  private isDestroyed = false;

  private readonly iceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.services.mozilla.com' },
  ];

  constructor(roomId: string, currentUser: WebRtcParticipant, callbacks: WebRtcCallbacks) {
    this.roomId = roomId;
    this.currentUser = currentUser;
    this.callbacks = callbacks;
  }

  /**
   * تشغيل الجلسة والحصول على وسائط الميكروفون / الكاميرا ثم الاتصال بخادم الإشارات
   */
  public async start(options: { enableAudio?: boolean; enableVideo?: boolean } = {}): Promise<MediaStream | null> {
    try {
      this.callbacks.onConnectionStatus('connecting');

      // 1. طلب تصريح الميكروفون والكاميرا بحسب الخيارات
      await this.initLocalStream(options.enableAudio ?? true, options.enableVideo ?? false);

      // 2. إعداد مراقب مستوى الصوت المحلي
      this.initAudioAnalyser();

      // 3. إضافة المستخدم الحالي لقائمة المشاركين
      this.participants.set(this.currentUser.id, {
        ...this.currentUser,
        stream: this.localStream || undefined,
      });
      this.emitParticipants();

      // 4. الاتصال بقناة الإشارات (Signaling) عبر WebSocket مع بديل HTTP
      this.connectSignaling();

      return this.localStream;
    } catch (err: any) {
      console.warn('[WebRTC] Start initialization warning:', err);
      this.callbacks.onError(err?.message || 'تعذر تشغيل الميكروفون أو الكاميرا. يرجى التحقق من صلاحيات المتصفح.');
      return null;
    }
  }

  /**
   * تهيئة الوسائط المحلية (صوت + فيديو اختياري)
   */
  private async initLocalStream(enableAudio: boolean, enableVideo: boolean): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      console.warn('[WebRTC] getUserMedia is not supported in this browser environment');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: enableAudio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        } : false,
        video: enableVideo ? {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 24 },
        } : false,
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err: any) {
      console.warn('[WebRTC] Failed to get video+audio, trying audio-only fallback:', err);
      // Fallback: جرب الصوت فقط إذا رفضت الكاميرا
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        this.currentUser.isAudioOnly = true;
        this.currentUser.isVideoOff = true;
      } catch (audioErr: any) {
        console.warn('[WebRTC] Microphone also failed or denied:', audioErr);
        // إنشاء بث صامت كـ fallback لمنع الانهيار والسماح بالاستماع
        this.localStream = this.createSilentAudioStream();
      }
    }
  }

  /**
   * إنشاء بث صامت إذا تعذر الميكروفون كي يستمر الطالب في الاستماع للشرح والتسميع
   */
  private createSilentAudioStream(): MediaStream {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const dst = ctx.createMediaStreamDestination();
        const gain = ctx.createGain();
        gain.gain.value = 0; // صامت تماماً
        osc.connect(gain);
        gain.connect(dst);
        osc.start();
        return dst.stream;
      }
    } catch {}
    return new MediaStream();
  }

  /**
   * تحليل الصوت لتحديث المؤشر البصري
   */
  private initAudioAnalyser(): void {
    if (!this.localStream) return;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (!audioTrack) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(this.localStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      source.connect(this.analyser);

      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.audioLevelInterval = setInterval(() => {
        if (!this.analyser || this.currentUser.isMuted) {
          if (this.callbacks.onAudioLevel) this.callbacks.onAudioLevel(0);
          return;
        }
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 255) * 100));
        if (this.callbacks.onAudioLevel) {
          this.callbacks.onAudioLevel(normalized);
        }
      }, 120);
    } catch (e) {
      console.warn('[WebRTC] Audio analyser setup skipped:', e);
    }
  }

  /**
   * الاتصال بقناة الإشارات (WebSocket مع خطة بديلة لـ REST Polling)
   */
  private connectSignaling(): void {
    if (typeof window === 'undefined') return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/live-halqa`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.callbacks.onConnectionStatus('connected');
        this.sendSignal({
          type: 'join',
          roomId: this.roomId,
          user: {
            id: this.currentUser.id,
            name: this.currentUser.name,
            role: this.currentUser.role,
            isAudioOnly: this.currentUser.isAudioOnly,
            isMuted: this.currentUser.isMuted,
            isVideoOff: this.currentUser.isVideoOff,
            isHandRaised: this.currentUser.isHandRaised,
            isCurrentReciter: this.currentUser.isCurrentReciter,
            joinedAt: new Date().toISOString(),
          },
        });
      };

      this.ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);
          await this.handleSignalingMessage(msg);
        } catch (e) {
          console.warn('[WebRTC] Error handling signal message:', e);
        }
      };

      this.ws.onerror = () => {
        console.warn('[WebRTC] WebSocket error, activating fallback signaling...');
        this.activateHttpFallback();
      };

      this.ws.onclose = () => {
        if (!this.isDestroyed) {
          this.activateHttpFallback();
        }
      };
    } catch {
      this.activateHttpFallback();
    }
  }

  /**
   * خطة بديلة لتبادل إشارات WebRTC عبر HTTP REST عند غياب WebSocket
   */
  private activateHttpFallback(): void {
    if (this.pollInterval || this.isDestroyed) return;
    this.callbacks.onConnectionStatus('connected');

    // إرسال طلب الانضمام عبر HTTP
    void fetch(`/api/live-halqa/rooms/${encodeURIComponent(this.roomId)}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: this.currentUser }),
    }).catch(() => {});

    // فحص الرسائل الدورية كل ثانيتين
    this.pollInterval = setInterval(async () => {
      if (this.isDestroyed) return;
      try {
        const res = await fetch(`/api/live-halqa/rooms/${encodeURIComponent(this.roomId)}/poll?userId=${encodeURIComponent(this.currentUser.id)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.messages)) {
            for (const msg of data.messages) {
              await this.handleSignalingMessage(msg);
            }
          }
        }
      } catch {}
    }, 2000);
  }

  /**
   * إرسال رسالة إشارة للخادم
   */
  private sendSignal(payload: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    } else {
      // إرسال عبر REST API كبديل
      void fetch(`/api/live-halqa/rooms/${encodeURIComponent(this.roomId)}/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, from: this.currentUser.id }),
      }).catch(() => {});
    }
  }

  /**
   * معالجة رسائل الإشارات الواردة
   */
  private async handleSignalingMessage(msg: any): Promise<void> {
    switch (msg.type) {
      case 'room-users': {
        // قائمة المستخدمين الموجودين بالغرفة
        if (Array.isArray(msg.users)) {
          for (const user of msg.users) {
            if (user.id !== this.currentUser.id) {
              this.participants.set(user.id, user);
              // إذا كنا المعلم أو أقدم بالغرفة، نبادر بإنشاء العرض (Offer)
              if (this.currentUser.role === 'teacher' || this.currentUser.id < user.id) {
                await this.createPeerConnection(user.id, true);
              }
            }
          }
          this.emitParticipants();
        }
        break;
      }

      case 'user-joined': {
        const user = msg.user;
        if (user && user.id !== this.currentUser.id) {
          this.participants.set(user.id, user);
          this.emitParticipants();
          // إنشاء الاتصال إذا كان دورنا المعلم
          if (this.currentUser.role === 'teacher') {
            await this.createPeerConnection(user.id, true);
          }
        }
        break;
      }

      case 'user-left': {
        const peerId = msg.userId;
        if (peerId) {
          this.participants.delete(peerId);
          this.closePeer(peerId);
          this.emitParticipants();
        }
        break;
      }

      case 'offer': {
        if (msg.targetUserId === this.currentUser.id || !msg.targetUserId) {
          await this.handleOffer(msg.from, msg.sdp, msg.userInfo);
        }
        break;
      }

      case 'answer': {
        if (msg.targetUserId === this.currentUser.id || !msg.targetUserId) {
          await this.handleAnswer(msg.from, msg.sdp);
        }
        break;
      }

      case 'ice-candidate': {
        if (msg.targetUserId === this.currentUser.id || !msg.targetUserId) {
          await this.handleIceCandidate(msg.from, msg.candidate);
        }
        break;
      }

      case 'participant-update': {
        const user = msg.user;
        if (user && user.id) {
          const existing = this.participants.get(user.id) || { ...user };
          this.participants.set(user.id, { ...existing, ...user });
          this.emitParticipants();
        }
        break;
      }

      case 'raise-hand': {
        const student = this.participants.get(msg.studentId);
        if (student) {
          student.isHandRaised = true;
          this.participants.set(msg.studentId, student);
          this.emitParticipants();
        }
        this.callbacks.onHandRaised(msg.studentId, msg.studentName || 'طالب');
        break;
      }

      case 'grant-turn': {
        // تحديث القارئ الحالي
        for (const [id, p] of this.participants.entries()) {
          p.isCurrentReciter = id === msg.studentId;
          if (id === msg.studentId) {
            p.isHandRaised = false;
          }
        }
        this.emitParticipants();
        this.callbacks.onTurnGranted(msg.studentId, msg.studentName || '');
        break;
      }

      case 'revoke-turn': {
        for (const p of this.participants.values()) {
          p.isCurrentReciter = false;
        }
        this.emitParticipants();
        this.callbacks.onTurnRevoked(msg.studentId);
        break;
      }

      case 'quran-sync': {
        if (msg.sync) {
          this.callbacks.onQuranSync(msg.sync);
        }
        break;
      }

      case 'chat-msg': {
        if (msg.message) {
          this.callbacks.onChatMessage(msg.message);
        }
        break;
      }
    }
  }

  /**
   * إنشاء اتصال RTCPeerConnection لنظير محدد
   */
  private async createPeerConnection(peerId: string, isInitiator: boolean): Promise<RTCPeerConnection> {
    if (this.peerConnections.has(peerId)) {
      return this.peerConnections.get(peerId)!;
    }

    const pc = new RTCPeerConnection({ iceServers: this.iceServers });
    this.peerConnections.set(peerId, pc);

    // إضافة المسارات الصوتية والمرئية المحلية للاتصال
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // التقاط مسارات النظير البعيد
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0] || new MediaStream([event.track]);
      const participant = this.participants.get(peerId);
      if (participant) {
        participant.stream = remoteStream;
        this.participants.set(peerId, participant);
        this.emitParticipants();
      }
      this.callbacks.onRemoteStream(peerId, remoteStream);
    };

    // إرسال مرشحي ICE
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal({
          type: 'ice-candidate',
          roomId: this.roomId,
          from: this.currentUser.id,
          targetUserId: peerId,
          candidate: event.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        this.callbacks.onRemoteStreamRemoved(peerId);
      }
    };

    // إذا كنا البادئين، ننشئ العرض
    if (isInitiator) {
      try {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await pc.setLocalDescription(offer);
        this.sendSignal({
          type: 'offer',
          roomId: this.roomId,
          from: this.currentUser.id,
          targetUserId: peerId,
          sdp: offer,
          userInfo: this.currentUser,
        });
      } catch (e) {
        console.warn(`[WebRTC] Failed to create offer for ${peerId}:`, e);
      }
    }

    return pc;
  }

  private async handleOffer(peerId: string, sdp: RTCSessionDescriptionInit, userInfo?: any): Promise<void> {
    if (userInfo) {
      this.participants.set(peerId, userInfo);
      this.emitParticipants();
    }

    const pc = await this.createPeerConnection(peerId, false);
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      this.sendSignal({
        type: 'answer',
        roomId: this.roomId,
        from: this.currentUser.id,
        targetUserId: peerId,
        sdp: answer,
      });
    } catch (e) {
      console.warn(`[WebRTC] Error responding to offer from ${peerId}:`, e);
    }
  }

  private async handleAnswer(peerId: string, sdp: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.peerConnections.get(peerId);
    if (pc && pc.signalingState !== 'stable') {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      } catch (e) {
        console.warn(`[WebRTC] Error setting remote description answer for ${peerId}:`, e);
      }
    }
  }

  private async handleIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn(`[WebRTC] Error adding ICE candidate from ${peerId}:`, e);
      }
    }
  }

  private closePeer(peerId: string): void {
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(peerId);
    }
    this.callbacks.onRemoteStreamRemoved(peerId);
  }

  private emitParticipants(): void {
    this.callbacks.onParticipantsChange(Array.from(this.participants.values()));
  }

  // ==========================================
  // Public Controls (أدوات التحكم العامة)
  // ==========================================

  public toggleMute(): boolean {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      this.currentUser.isMuted = !audioTrack.enabled;
      this.updateLocalParticipantState();
      return this.currentUser.isMuted;
    }
    return false;
  }

  public async toggleVideo(): Promise<boolean> {
    if (!this.localStream) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];
    
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      this.currentUser.isVideoOff = !videoTrack.enabled;
    } else {
      // طلب كاميرا جديدة إذا لم تكن موجودة
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newTrack = stream.getVideoTracks()[0];
        if (newTrack) {
          this.localStream.addTrack(newTrack);
          // إضافة المسار لجميع النظراء
          for (const pc of this.peerConnections.values()) {
            pc.addTrack(newTrack, this.localStream);
          }
          this.currentUser.isVideoOff = false;
        }
      } catch {
        this.currentUser.isVideoOff = true;
      }
    }

    this.updateLocalParticipantState();
    return !this.currentUser.isVideoOff;
  }

  public async toggleScreenShare(): Promise<MediaStream | null> {
    if (this.displayStream) {
      // إيقاف مشاركة الشاشة
      this.displayStream.getTracks().forEach((t) => t.stop());
      this.displayStream = null;
      return null;
    }

    try {
      this.displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const screenTrack = this.displayStream.getVideoTracks()[0];
      screenTrack.onended = () => {
        this.displayStream = null;
      };

      // استبدال مسار الفيديو لكل النظراء
      for (const pc of this.peerConnections.values()) {
        const senders = pc.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(screenTrack);
        } else {
          pc.addTrack(screenTrack, this.displayStream);
        }
      }

      return this.displayStream;
    } catch {
      return null;
    }
  }

  public raiseHand(): void {
    this.currentUser.isHandRaised = true;
    this.updateLocalParticipantState();
    this.sendSignal({
      type: 'raise-hand',
      roomId: this.roomId,
      studentId: this.currentUser.id,
      studentName: this.currentUser.name,
    });
  }

  public lowerHand(): void {
    this.currentUser.isHandRaised = false;
    this.updateLocalParticipantState();
    this.sendSignal({
      type: 'lower-hand',
      roomId: this.roomId,
      studentId: this.currentUser.id,
    });
  }

  public grantTurn(studentId: string, studentName: string): void {
    this.sendSignal({
      type: 'grant-turn',
      roomId: this.roomId,
      studentId,
      studentName,
    });
  }

  public revokeTurn(studentId: string): void {
    this.sendSignal({
      type: 'revoke-turn',
      roomId: this.roomId,
      studentId,
    });
  }

  public syncQuran(sync: QuranSyncState): void {
    this.sendSignal({
      type: 'quran-sync',
      roomId: this.roomId,
      sync,
    });
  }

  public sendChatMessage(text: string, isTajweedNote: boolean = false): void {
    const msg: WebRtcChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderId: this.currentUser.id,
      senderName: this.currentUser.name,
      senderRole: this.currentUser.role,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      isTajweedNote,
    };
    this.callbacks.onChatMessage(msg);
    this.sendSignal({
      type: 'chat-msg',
      roomId: this.roomId,
      message: msg,
    });
  }

  private updateLocalParticipantState(): void {
    this.participants.set(this.currentUser.id, { ...this.currentUser, stream: this.localStream || undefined });
    this.emitParticipants();
    this.sendSignal({
      type: 'participant-update',
      roomId: this.roomId,
      user: {
        id: this.currentUser.id,
        isMuted: this.currentUser.isMuted,
        isVideoOff: this.currentUser.isVideoOff,
        isHandRaised: this.currentUser.isHandRaised,
        isCurrentReciter: this.currentUser.isCurrentReciter,
      },
    });
  }

  /**
   * إنهاء ومغادرة الجلسة وتنظيف جميع المسارات والموارد
   */
  public destroy(): void {
    this.isDestroyed = true;

    // 1. إعلام الآخرين بالمغادرة
    this.sendSignal({
      type: 'leave',
      roomId: this.roomId,
      userId: this.currentUser.id,
    });

    // 2. إيقاف المسارات المحلية
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
    if (this.displayStream) {
      this.displayStream.getTracks().forEach((track) => track.stop());
      this.displayStream = null;
    }

    // 3. إغلاق اتصالات RTCPeerConnection
    for (const pc of this.peerConnections.values()) {
      pc.close();
    }
    this.peerConnections.clear();
    this.participants.clear();

    // 4. إغلاق WebSocket ومؤقتات الاستطلاع
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    if (this.audioLevelInterval) {
      clearInterval(this.audioLevelInterval);
      this.audioLevelInterval = null;
    }
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }

    this.callbacks.onConnectionStatus('disconnected');
  }
}
