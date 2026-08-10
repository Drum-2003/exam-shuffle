export type AppNotificationTone = "info" | "success" | "warning";

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  href: string;
  tone: AppNotificationTone;
  createdAt: string;
};

const STORAGE_KEY = "quizforge_notifications";
const MAX_NOTIFICATIONS = 20;

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function getAppNotifications(): AppNotification[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AppNotification[]) : [];
  } catch {
    return [];
  }
}

export function addAppNotification(input: Omit<AppNotification, "id" | "createdAt">) {
  if (!canUseStorage()) return;

  const notification: AppNotification = {
    ...input,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString()
  };
  const notifications = [notification, ...getAppNotifications()].slice(0, MAX_NOTIFICATIONS);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
}

export function clearAppNotifications() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}
