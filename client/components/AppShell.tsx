"use client";

import {
  AlertCircle,
  BookOpen,
  Bell,
  CheckCircle2,
  FileQuestion,
  Gauge,
  Layers,
  LogOut,
  Shuffle,
  Trash2,
  Upload,
  WalletCards
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { clearToken } from "../lib/api";
import {
  APP_NOTIFICATIONS_UPDATED,
  clearAppNotifications,
  getAppNotifications,
  type AppNotification
} from "../lib/notifications";
import { AppLogo } from "./AppLogo";
import { Button } from "./ui";

const nav = [
  { href: "/dashboard", label: "Tổng quan", icon: Gauge },
  { href: "/subjects", label: "Môn học", icon: BookOpen },
  { href: "/chapters", label: "Chương", icon: Layers },
  { href: "/questions", label: "Câu hỏi", icon: FileQuestion },
  { href: "/questions/import", label: "Import Excel", icon: Upload },
  { href: "/exams/generate", label: "Sinh đề", icon: Shuffle },
  { href: "/exams", label: "Đề đã tạo", icon: WalletCards }
];

const notificationTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit"
});

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function refreshNotifications() {
      setNotifications(getAppNotifications());
    }

    refreshNotifications();
    window.addEventListener(APP_NOTIFICATIONS_UPDATED, refreshNotifications);
    window.addEventListener("storage", refreshNotifications);

    return () => {
      window.removeEventListener(APP_NOTIFICATIONS_UPDATED, refreshNotifications);
      window.removeEventListener("storage", refreshNotifications);
    };
  }, []);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", closeOnOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
    };
  }, [open]);

  function clearNotifications() {
    clearAppNotifications();
    setOpen(false);
  }

  return (
    <div ref={panelRef} className="fixed right-3 top-3 z-40 sm:right-5 sm:top-5">
      <button
        aria-expanded={open}
        aria-label="Mở thông báo"
        className="notification-bell"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <Bell aria-hidden="true" size={20} />
        {notifications.length ? <span className="notification-bell__badge">{notifications.length}</span> : null}
      </button>

      {open ? (
        <div aria-label="Thông báo hoạt động" className="notification-popover" role="dialog">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black">Thông báo</h2>
              <p className="muted text-xs">Hoạt động gần đây của bạn</p>
            </div>
            {notifications.length ? (
              <button className="notification-clear" onClick={clearNotifications} type="button">
                <Trash2 aria-hidden="true" size={15} />
                Xóa
              </button>
            ) : null}
          </div>

          {notifications.length ? (
            <div className="grid max-h-[420px] gap-2 overflow-y-auto pr-1">
              {notifications.slice(0, 8).map((notification) => {
                const Icon = notification.tone === "warning" ? AlertCircle : CheckCircle2;
                const toneClass =
                  notification.tone === "warning"
                    ? "notification-item__icon--warning"
                    : notification.tone === "success"
                      ? "notification-item__icon--success"
                      : "notification-item__icon--info";

                return (
                  <Link
                    key={notification.id}
                    className="notification-item"
                    href={notification.href}
                    onClick={() => setOpen(false)}
                  >
                    <span className={`notification-item__icon ${toneClass}`}>
                      <Icon aria-hidden="true" size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black">{notification.title}</span>
                      <span className="muted mt-1 line-clamp-2 block text-xs leading-5">{notification.message}</span>
                      <span className="mt-2 block text-[11px] font-black text-[var(--blueprint)]">
                        {notificationTimeFormatter.format(new Date(notification.createdAt))}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="empty-state min-h-[116px] px-4 py-5 text-sm">
              Chưa có thông báo nào. Khi bạn thêm, sửa, xóa, import hoặc sinh đề, thông báo sẽ hiện ở đây.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const activeHref =
    nav
      .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
      .sort((a, b) => b.href.length - a.href.length)[0]?.href ||
    (/^\/exams\/[^/]+$/.test(pathname) ? "/exams" : "");

  function logout() {
    clearToken();
    router.push("/login");
  }

  return (
    <div className="min-h-screen overflow-x-hidden lg:grid lg:grid-cols-[280px_1fr]">
      <NotificationBell />

      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[var(--ink)] focus:px-4 focus:py-2 focus:text-white"
        href="#main-content"
      >
        Bỏ qua điều hướng
      </a>

      <aside className="border-b border-[var(--line)] bg-[#fffefa]/95 px-4 py-4 backdrop-blur lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
        <div className="mb-4 border-b border-[var(--line)] pb-4 lg:mb-6 lg:pb-5">
          <AppLogo size="sidebar" />
          <p className="muted mt-2 text-sm leading-6">
            Xáo trộn câu hỏi trắc nghiệm và sinh đề từ ngân hàng câu hỏi.
          </p>
        </div>

        <nav aria-label="Điều hướng chính" className="grid grid-cols-2 gap-2 pb-2 sm:grid-cols-3 lg:flex lg:flex-col lg:pb-0">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = activeHref === item.href;

            return (
              <Link
                key={item.href}
                aria-current={active ? "page" : undefined}
                className={`app-nav-link flex min-w-0 items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-extrabold focus-visible:ring-3 focus-visible:ring-[rgba(54,87,168,0.28)] ${
                  active
                    ? "border-[#b9d4cc] bg-[#e4f4ee] text-[var(--ink)] shadow-sm"
                    : "border-transparent text-[var(--ink)] hover:bg-[#efe9dc]"
                }`}
                href={item.href}
              >
                <Icon aria-hidden="true" size={18} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <Button className="mt-6 w-full" variant="tertiary" onPress={logout}>
          <LogOut aria-hidden="true" size={16} />
          Đăng xuất
        </Button>
      </aside>

      <main id="main-content" className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}
