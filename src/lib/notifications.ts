export function notificationExpiresAt(notification: { type: string; timestamp: number }) {
  return notification.timestamp +
    (notification.type === 'system' || notification.type === 'level_up' ? 5000 : 30000);
}
