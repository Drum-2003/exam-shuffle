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
  { key: "subjects", label: "Môn học", icon: BookOpen, helper: "Đang quản lý", tone: "bg-[#eef5ff] text-[var(--blueprint)]" },
  { key: "chapters", label: "Chương", icon: Layers, helper: "Theo môn học", tone: "bg-[#eaf7f2] text-[var(--mint)]" },
  { key: "questions", label: "Câu hỏi", icon: FileQuestion, helper: "Trong ngân hàng", tone: "bg-[#fff3df] text-[var(--amber)]" },
  { key: "exams", label: "Đề đã tạo", icon: WalletCards, helper: "Lưu đề đã sinh", tone: "bg-[#f0eefb] text-[#6652b8]" }
] as const;

const numberFormatter = new Intl.NumberFormat("vi-VN");

export default function DashboardPage() {
  const ready = useRequireAuth();
  const [data, setData] = useState<Record<string, number>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    apiFetch<Record<string, number>>("/dashboard").then(setData).catch((err) => setError(err.message));
  }, [ready]);

  if (!ready) return null;

  return (
    <AppShell>
      <PageHeader title="Tổng quan" description="Theo dõi ngân hàng câu hỏi trắc nghiệm và các đề đã sinh." />
      {error ? <Notice message={error} tone="error" /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const value = data[stat.key] ?? 0;
          return (
            <Card key={stat.key} className="min-h-[142px] overflow-hidden">
              <Card.Header>
                <div className={`rounded-lg p-2.5 ${stat.tone}`}>
                  <Icon aria-hidden="true" size={22} />
                </div>
                <div className="min-w-0">
                  <Card.Description>{stat.label}</Card.Description>
                  <Card.Title className="dashboard-stat-value mt-1 tabular-nums">{numberFormatter.format(value)}</Card.Title>
                </div>
              </Card.Header>
              <Card.Content>
                <p className="muted mt-1 text-sm">{stat.helper}</p>
              </Card.Content>
            </Card>
          );
        })}
      </div>

      <section className="panel mt-6 overflow-hidden p-0">
        <div className="border-l-4 border-[var(--blueprint)] bg-white/70 p-5">
          <h2 className="text-xl font-black">Gợi ý chạy demo</h2>
          <p className="muted mt-2 max-w-3xl text-pretty">
          Vào Sinh đề, chọn Toán 10, lấy 6 câu với 3 dễ, 2 trung bình, 1 khó và tạo 2 mã đề bắt đầu từ 101.
          </p>
        </div>
      </section>
    </AppShell>
  );
}
