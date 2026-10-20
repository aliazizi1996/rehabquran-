/**
 * خادم الإشارات لبث الحلقات القرآنية عبر WebRTC
 * WebRTC Signaling Server for Real-Time Quranic Halqas
 * مقرأة رحاب القرآن الإلكترونية
 */

import http from 'http';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';

interface HalqaClient {
  ws?: WebSocket;
  id: string;
  name: string;
  role: 'teacher' | 'student' | 'supervisor';
  roomId: string;
  isAudioOnly: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isHandRaised: boolean;
  isCurrentReciter: boolean;
  joinedAt: string;
  lastPoll?: number;
}

interface QueuedSignalMessage {
  targetUserId: string;
  payload: any;
  timestamp: number;
}

export function setupWebRtcSignaling(httpServer: http.Server, app: express.Express) {
  // تخزين الغرف والعملاء المتصلين في الذاكرة
  const rooms = new Map<string, Map<string, HalqaClient>>();
  // طابور الرسائل للمستخدمين الذين يتصلون عبر استطلاع HTTP (Polling fallback)
  const messageQueue = new Map<string, QueuedSignalMessage[]>();

  // إنشاء خادم WebSocket على المسار /ws/live-halqa
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/live-halqa' });

  wss.on('connection', (ws: WebSocket) => {
    let currentClientId: string | null = null;
    let currentRoomId: string | null = null;

    ws.on('message', (data: string | Buffer) => {
      try {
        const msg = JSON.parse(data.toString());

        switch (msg.type) {
          case 'join': {
            const { roomId, user } = msg;
            if (!roomId || !user?.id) return;

            currentClientId = user.id;
            currentRoomId = roomId;

            if (!rooms.has(roomId)) {
              rooms.set(roomId, new Map());
            }

            const roomClients = rooms.get(roomId)!;
            const client: HalqaClient = {
              ws,
              id: user.id,
              name: user.name || 'مستخدم',
              role: user.role || 'student',
              roomId,
              isAudioOnly: Boolean(user.isAudioOnly),
              isMuted: Boolean(user.isMuted),
              isVideoOff: Boolean(user.isVideoOff),
              isHandRaised: Boolean(user.isHandRaised),
              isCurrentReciter: Boolean(user.isCurrentReciter),
              joinedAt: user.joinedAt || new Date().toISOString(),
            };

            // إرسال قائمة الأعضاء الحاليين بالغرفة للداخل الجديد
            const existingUsers = Array.from(roomClients.values()).map(c => ({
              id: c.id,
              name: c.name,
              role: c.role,
              isAudioOnly: c.isAudioOnly,
              isMuted: c.isMuted,
              isVideoOff: c.isVideoOff,
              isHandRaised: c.isHandRaised,
              isCurrentReciter: c.isCurrentReciter,
              joinedAt: c.joinedAt,
            }));

            ws.send(JSON.stringify({
              type: 'room-users',
              roomId,
              users: existingUsers,
            }));

            // إضافة العميل للغرفة
            roomClients.set(user.id, client);

            // إشعار باقي الأعضاء بالانضمام
            broadcastToRoom(roomId, user.id, {
              type: 'user-joined',
              roomId,
              user: {
                id: client.id,
                name: client.name,
                role: client.role,
                isAudioOnly: client.isAudioOnly,
                isMuted: client.isMuted,
                isVideoOff: client.isVideoOff,
                isHandRaised: client.isHandRaised,
                isCurrentReciter: client.isCurrentReciter,
                joinedAt: client.joinedAt,
              },
            });
            break;
          }

          case 'offer':
          case 'answer':
          case 'ice-candidate': {
            // توجيه إشارات WebRTC SDP و ICE للنظير المعني
            const targetId = msg.targetUserId;
            if (currentRoomId && targetId) {
              sendToUser(currentRoomId, targetId, msg);
            }
            break;
          }

          case 'participant-update':
          case 'raise-hand':
          case 'lower-hand':
          case 'grant-turn':
          case 'revoke-turn':
          case 'quran-sync':
          case 'chat-msg': {
            // بث عام لجميع أفراد الغرفة
            if (currentRoomId) {
              broadcastToRoom(currentRoomId, null, msg);
            }
            break;
          }

          case 'leave': {
            if (currentRoomId && currentClientId) {
              handleClientDisconnect(currentRoomId, currentClientId);
            }
            break;
          }
        }
      } catch (err) {
        console.warn('[WebRTC Signaling] Error processing message:', err);
      }
    });

    ws.on('close', () => {
      if (currentRoomId && currentClientId) {
        handleClientDisconnect(currentRoomId, currentClientId);
      }
    });

    ws.on('error', (err) => {
      console.warn('[WebRTC Signaling] Socket error:', err);
    });
  });

  function broadcastToRoom(roomId: string, excludeUserId: string | null, payload: any) {
    const roomClients = rooms.get(roomId);
    if (!roomClients) return;

    const str = JSON.stringify(payload);
    for (const [clientId, client] of roomClients.entries()) {
      if (excludeUserId && clientId === excludeUserId) continue;

      if (client.ws && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(str);
      } else {
        // إضافة لطابور HTTP للمستخدمين غير المتصلين عبر WebSocket
        queueMessage(clientId, payload);
      }
    }
  }

  function sendToUser(roomId: string, targetUserId: string, payload: any) {
    const roomClients = rooms.get(roomId);
    if (!roomClients) return;

    const target = roomClients.get(targetUserId);
    if (target?.ws && target.ws.readyState === WebSocket.OPEN) {
      target.ws.send(JSON.stringify(payload));
    } else {
      queueMessage(targetUserId, payload);
    }
  }

  function queueMessage(userId: string, payload: any) {
    if (!messageQueue.has(userId)) {
      messageQueue.set(userId, []);
    }
    const q = messageQueue.get(userId)!;
    q.push({ targetUserId: userId, payload, timestamp: Date.now() });
    // الاحتفاظ بأحدث 40 رسالة فقط لمنع تراكم الذاكرة
    if (q.length > 40) {
      q.splice(0, q.length - 40);
    }
  }

  function handleClientDisconnect(roomId: string, clientId: string) {
    const roomClients = rooms.get(roomId);
    if (!roomClients) return;

    roomClients.delete(clientId);
    broadcastToRoom(roomId, null, {
      type: 'user-left',
      roomId,
      userId: clientId,
    });

    if (roomClients.size === 0) {
      rooms.delete(roomId);
    }
  }

  // ==========================================
  // HTTP REST Fallback Endpoints (بديل HTTP عند حظر WebSocket)
  // ==========================================

  app.post('/api/live-halqa/rooms/:roomId/join', express.json(), (req, res) => {
    const { roomId } = req.params;
    const { user } = req.body;
    if (!roomId || !user?.id) {
      return res.status(400).json({ error: 'Missing roomId or user.id' });
    }

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
    }

    const roomClients = rooms.get(roomId)!;
    const client: HalqaClient = {
      id: user.id,
      name: user.name || 'طالب',
      role: user.role || 'student',
      roomId,
      isAudioOnly: Boolean(user.isAudioOnly),
      isMuted: Boolean(user.isMuted),
      isVideoOff: Boolean(user.isVideoOff),
      isHandRaised: Boolean(user.isHandRaised),
      isCurrentReciter: Boolean(user.isCurrentReciter),
      joinedAt: new Date().toISOString(),
      lastPoll: Date.now(),
    };

    roomClients.set(user.id, client);

    broadcastToRoom(roomId, user.id, {
      type: 'user-joined',
      roomId,
      user,
    });

    const existingUsers = Array.from(roomClients.values()).map(c => ({
      id: c.id,
      name: c.name,
      role: c.role,
      isAudioOnly: c.isAudioOnly,
      isMuted: c.isMuted,
      isVideoOff: c.isVideoOff,
      isHandRaised: c.isHandRaised,
      isCurrentReciter: c.isCurrentReciter,
      joinedAt: c.joinedAt,
    }));

    return res.json({
      success: true,
      users: existingUsers,
    });
  });

  app.post('/api/live-halqa/rooms/:roomId/signal', express.json(), (req, res) => {
    const { roomId } = req.params;
    const payload = req.body;
    if (!roomId || !payload) {
      return res.status(400).json({ error: 'Missing roomId or payload' });
    }

    if (payload.targetUserId) {
      sendToUser(roomId, payload.targetUserId, payload);
    } else {
      broadcastToRoom(roomId, payload.from || null, payload);
    }

    return res.json({ success: true });
  });

  app.get('/api/live-halqa/rooms/:roomId/poll', (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    const q = messageQueue.get(userId) || [];
    const messages = q.map(item => item.payload);
    // إفراغ الرسائل المقروءة
    messageQueue.delete(userId);

    return res.json({ messages });
  });

  app.get('/api/live-halqa/rooms/:roomId/info', (req, res) => {
    const { roomId } = req.params;
    const roomClients = rooms.get(roomId);
    if (!roomClients) {
      return res.json({ active: false, participantsCount: 0, participants: [] });
    }

    const participants = Array.from(roomClients.values()).map(c => ({
      id: c.id,
      name: c.name,
      role: c.role,
      isHandRaised: c.isHandRaised,
      isCurrentReciter: c.isCurrentReciter,
    }));

    return res.json({
      active: true,
      participantsCount: participants.length,
      participants,
    });
  });

  console.log('[WebRTC Signaling] Real-time Halqa signaling server initialized on /ws/live-halqa');
}
