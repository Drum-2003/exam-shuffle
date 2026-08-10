"use client";

import { ArrowRight, BookOpen, CheckCircle2, FileQuestion, Layers, PlusCircle, Shuffle, Upload, WalletCards } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "../../components/AppShell";
import { Notice } from "../../components/Notice";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/ui";
import { apiFetch } from "../../lib/api";
import { useRequireAuth } from "../../lib/auth";

const stats = [
  { key: "subjects", label: "Môn học", icon: BookOpen, helper: "Đang quản lý", href: "/subjects" },
  { key: "chapters", label: "Chương", icon: Layers, helper: "Theo môn học", href: "/chapters" },
  { key: "questions", label: "Câu hỏi", icon: FileQuestion, helper: "Trong ngân hàng", href: "/questions" },
  { key: "exams", label: "Đề đã tạo", icon: WalletCards, helper: "Lưu đề đã sinh", href: "/exams" }
] as const;

const quickActions = [
  { label: "Thêm môn/chương", href: "/subjects", icon: PlusCircle, helper: "Chuẩn bị cấu trúc ngân hàng câu hỏi" },
  { label: "Import Excel", href: "/questions/import", icon: Upload, helper: "Nạp nhanh câu hỏi từ file mẫu" },
  { label: "Sinh đề", href: "/exams/generate", icon: Shuffle, helper: "Chọn chương, độ khó và số mã đề" }
] as const;

const workflow = [
  "Tạo môn học và chương",
  "Nhập hoặc import câu hỏi",
  "Sinh mã đề theo cấu hình",
  "Xuất đề và đáp án"
];

const numberFormatter = new Intl.NumberFormat("vi-VN");

function AnimatedStatNumber({ value, delayMs = 0, play }: { value: number; delayMs?: number; play: boolean }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!play) {
      setDisplayValue(0);
      return;
    }

    let animationFrame = 0;
    let timeoutId = 0;
    const duration = 3400;
    const rollDuration = 1500;
    const rollCeiling = Math.max(value, 9);
    const rollStepOffset = Math.floor(delayMs / 40);
    const rollEndValue = (Math.floor(rollDuration / 80) * 3 + rollStepOffset) % (rollCeiling + 1);

    timeoutId = window.setTimeout(() => {
      const startedAt = performance.now();
      setDisplayValue(0);

      function tick(now: number) {
        const elapsed = now - startedAt;

        if (elapsed < rollDuration) {
          const rollingValue = (Math.floor(elapsed / 80) * 3 + rollStepOffset) % (rollCeiling + 1);
          setDisplayValue(rollingValue);
        } else {
          const progress = Math.min((elapsed - rollDuration) / (duration - rollDuration), 1);
          const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - Math.pow(-2 * progress + 2, 3) / 2;
          setDisplayValue(Math.round(rollEndValue + (value - rollEndValue) * eased));
        }

        if (elapsed < duration) {
          animationFrame = window.requestAnimationFrame(tick);
        }
      }

      animationFrame = window.requestAnimationFrame(tick);
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
      window.cancelAnimationFrame(animationFrame);
    };
  }, [delayMs, play, value]);

  return <>{numberFormatter.format(displayValue)}</>;
}

export default function DashboardPage() {
  const ready = useRequireAuth();
  const [data, setData] = useState<Record<string, number>>({});
  const [statsCanPlay, setStatsCanPlay] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    let playTimer = 0;

    setStatsCanPlay(false);
    apiFetch<Record<string, number>>("/dashboard")
      .then((dashboardData) => {
        if (cancelled) return;
        setData(dashboardData);
        playTimer = window.setTimeout(() => {
          if (!cancelled) setStatsCanPlay(true);
        }, 450);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(playTimer);
    };
  }, [ready]);

  if (!ready) return null;

  return (
    <AppShell>
      <PageHeader title="Tổng quan" description="Theo dõi ngân hàng câu hỏi trắc nghiệm và các đề đã sinh." />
      {error ? <Notice message={error} tone="error" /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const value = data[stat.key] ?? 0;
          return (
            <Link
              key={stat.key}
              aria-label={`Mở trang ${stat.label}`}
              className="block rounded-xl focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[rgba(49,94,168,0.28)]"
              href={stat.href}
            >
              <Card className="min-h-[132px]">
                <Card.Header>
                  <div className="rounded-lg bg-[#edf4ff] p-2 text-[var(--blueprint)]">
                    <Icon aria-hidden="true" size={22} />
                  </div>
                  <div className="min-w-0">
                    <Card.Description>{stat.label}</Card.Description>
                    <Card.Title className="mt-1 text-4xl tabular-nums">
                      <AnimatedStatNumber value={value} delayMs={index * 220} play={statsCanPlay} />
                    </Card.Title>
                  </div>
                </Card.Header>
                <Card.Content>
                  <p className="muted text-sm">{stat.helper}</p>
                </Card.Content>
              </Card>
            </Link>
          );
        })}
      </div>

      <section className="panel mt-6 p-5">
        <h2 className="text-xl font-black">Gợi ý chạy demo</h2>
        <p className="muted mt-2 max-w-3xl text-pretty">
          Vào Sinh đề, chọn Toán 10, lấy 6 câu với 3 dễ, 2 trung bình, 1 khó và tạo 2 mã đề bắt đầu từ 101.
        </p>
      </section>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="panel p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">Thao tác nhanh</h2>
              <p className="muted mt-1 text-sm">Các lối tắt hay dùng khi chuẩn bị ngân hàng và sinh đề.</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.href}
                  className="group rounded-lg border border-[var(--line)] bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-soft)]"
                  href={action.href}
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="rounded-lg bg-[#edf4ff] p-2 text-[var(--blueprint)]">
                      <Icon aria-hidden="true" size={20} />
                    </div>
                    <ArrowRight aria-hidden="true" className="text-[var(--mint)] transition group-hover:translate-x-1" size={18} />
                  </div>
                  <h3 className="font-black">{action.label}</h3>
                  <p className="muted mt-2 text-sm leading-6">{action.helper}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="text-xl font-black">Quy trình làm đề</h2>
          <div className="mt-4 grid gap-3">
            {workflow.map((item, index) => (
              <div key={item} className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-white px-3 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e4f4ee] text-sm font-black tabular-nums text-[var(--mint)]">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1 font-bold">{item}</div>
                <CheckCircle2 aria-hidden="true" className="text-[var(--mint)]" size={18} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
