const admin = require('firebase-admin');
const { setGlobalOptions, logger } = require('firebase-functions/v2');
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');

admin.initializeApp();
setGlobalOptions({ region: 'us-central1', maxInstances: 10 });

const db = admin.firestore();

const chunkArray = (items, size) => {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const normalizeStatus = (value) => (
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0131/g, 'i')
    .replace(/\u0130/g, 'i')
    .trim()
);

const statusMessage = (status, restaurantName) => {
  const normalized = normalizeStatus(status);
  const store = restaurantName ? ` (${restaurantName})` : '';

  if (normalized === 'hazirlaniyor') {
    return `Siparisin onaylandi, hazirlaniyor${store}.`;
  }
  if (normalized === 'yolda') {
    return `Siparisin yolda${store}.`;
  }
  if (normalized === 'teslim edildi' || normalized === 'teslimedildi') {
    return `Siparisin teslim edildi${store}. Afiyet olsun.`;
  }
  if (normalized === 'iptal' || normalized === 'reddedildi') {
    return `Siparisin iptal edildi${store}.`;
  }

  return `Siparis durumun guncellendi${store}: ${status}`;
};

const readTokensFromUser = (userData) => {
  if (!userData || typeof userData !== 'object') return [];

  const set = new Set();
  const arr = Array.isArray(userData.expoPushTokens) ? userData.expoPushTokens : [];
  for (const value of arr) {
    if (typeof value === 'string' && value.startsWith('ExponentPushToken[')) {
      set.add(value);
    }
  }

  if (typeof userData.expoPushToken === 'string' && userData.expoPushToken.startsWith('ExponentPushToken[')) {
    set.add(userData.expoPushToken);
  }

  return Array.from(set);
};

const resolveTargetUsers = async (notification) => {
  if (notification.targetType === 'users') {
    const targetUserIds = Array.isArray(notification.targetUserIds) ? notification.targetUserIds : [];
    if (targetUserIds.length === 0) return [];

    const uniqueIds = Array.from(new Set(targetUserIds.filter((id) => typeof id === 'string' && id.trim())));
    const refs = uniqueIds.map((uid) => db.collection('users').doc(uid));
    const snapshots = await db.getAll(...refs);

    return snapshots
      .filter((snap) => snap.exists)
      .map((snap) => ({ uid: snap.id, ...snap.data() }));
  }

  const customerSnapshot = await db.collection('users').where('role', '==', 'customer').get();
  return customerSnapshot.docs.map((docSnap) => ({ uid: docSnap.id, ...docSnap.data() }));
};

const sendExpoPush = async (messages) => {
  if (messages.length === 0) return;
  const chunks = chunkArray(messages, 100);

  for (const chunk of chunks) {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(chunk)
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Expo push send failed (${response.status}): ${text}`);
    }

    const result = await response.json();
    logger.info('Expo push response', { data: result?.data?.length || 0, errors: result?.errors || [] });
  }
};

exports.sendPushWhenNotificationCreated = onDocumentCreated('notifications/{notificationId}', async (event) => {
  const notification = event.data?.data();
  if (!notification) return;

  const users = await resolveTargetUsers(notification);
  if (users.length === 0) {
    logger.info('No target users found for notification', { notificationId: event.params.notificationId });
    return;
  }

  const messages = [];
  for (const user of users) {
    const tokens = readTokensFromUser(user);
    for (const token of tokens) {
      messages.push({
        to: token,
        sound: 'default',
        title: notification.title || 'Bildirim',
        body: notification.message || '',
        channelId: 'default',
        data: {
          notificationId: event.params.notificationId,
          type: notification.type || 'manual',
          relatedPromoCode: notification.relatedPromoCode || null,
          relatedOrderId: notification.relatedOrderId || null
        }
      });
    }
  }

  if (messages.length === 0) {
    logger.info('No expo tokens found for notification', { notificationId: event.params.notificationId });
    return;
  }

  await sendExpoPush(messages);
});

exports.createOrderStatusNotification = onDocumentUpdated('orders/{orderId}', async (event) => {
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();
  if (!before || !after) return;

  const prevStatus = normalizeStatus(before.status);
  const nextStatus = normalizeStatus(after.status);
  if (!nextStatus || prevStatus === nextStatus) return;
  const allowedStatuses = new Set(['hazirlaniyor', 'yolda', 'teslim edildi', 'teslimedildi']);
  if (!allowedStatuses.has(nextStatus)) return;

  const customerId = typeof after.customerId === 'string' ? after.customerId : '';
  if (!customerId) return;

  const message = statusMessage(after.status, after.restaurantName);

  await db.collection('notifications').add({
    title: 'Siparis Durumu',
    message,
    type: 'order_status',
    targetType: 'users',
    targetUserIds: [customerId],
    relatedPromoCode: null,
    relatedOrderId: event.params.orderId,
    createdAt: Date.now(),
    createdBy: 'system',
    readBy: []
  });
});
