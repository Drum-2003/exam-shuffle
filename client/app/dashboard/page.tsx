"use client";

import { BookOpen, FileQuestion, Layers, WalletCards } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "../../components/AppShell";
import { Notice } from "../../components/Notice";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/ui";
import { apiFetch } from "../../lib/api";
import { useRequireAuth } from "../../lib/auth";

const stats = [
  { key: "subjects", label: "Môn học", icon: BookOpen, helper: "Đang quản lý" },
  { key: "chapters", label: "Chương", icon: Layers, helper: "Theo môn học" },
  { key: "questions", label: "Câu hỏi", icon: FileQuestion, helper: "Trong ngân hàng" },
  { key: "exams", label: "Đề đã tạo", icon: WalletCards, helper: "Lưu đề đã sinh" }
] as const;

const numberFormatter = new Intl.NumberFormat("vi-VN");

function AnimatedStatNumber({ value, delayMs = 0, play }: { value: number; delayMs?: number; play: boolean }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!play) {
      setDisplayValue(0);
      return;
    }

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion || value === 0) {
      setDisplayValue(value);
      return;
    }

    let animationFrame = 0;
    let timeoutId = 0;
    const duration = 1800;

    timeoutId = window.setTimeout(() => {
      const startedAt = performance.now();
      setDisplayValue(0);

      function tick(now: number) {
        const progress = Math.min((now - startedAt) / duration, 1);
        const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        setDisplayValue(Math.round(value * eased));

        if (progress < 1) {
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
            <Card key={stat.key} className="min-h-[132px]">
              <Card.Header>
                <div className="rounded-lg bg-[#edf4ff] p-2 text-[var(--blueprint)]">
                  <Icon aria-hidden="true" size={22} />
                </div>
                <div className="min-w-0">
                  <Card.Description>{stat.label}</Card.Description>
                  <Card.Title className="mt-1 text-4xl tabular-nums">
                    <AnimatedStatNumber value={value} delayMs={index * 160} play={statsCanPlay} />
                  </Card.Title>
                </div>
              </Card.Header>
              <Card.Content>
                <p className="muted text-sm">{stat.helper}</p>
              </Card.Content>
            </Card>
          );
        })}
      </div>

      <section className="panel mt-6 p-5">
        <h2 className="text-xl font-black">Gợi ý chạy demo</h2>
        <p className="muted mt-2 max-w-3xl text-pretty">
          Vào Sinh đề, chọn Toán 10, lấy 6 câu với 3 dễ, 2 trung bình, 1 khó và tạo 2 mã đề bắt đầu từ 101.
        </p>
      </section>
    </AppShell>
  );
}
