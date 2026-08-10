"use client";

import {
  BookOpen,
  FileQuestion,
  Gauge,
  Layers,
  LogOut,
  Shuffle,
  Upload,
  WalletCards
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearToken } from "../lib/api";
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
