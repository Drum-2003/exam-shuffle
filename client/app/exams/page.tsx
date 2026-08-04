"use client";

import { Eye, PlusCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "../../components/AppShell";
import { Notice } from "../../components/Notice";
import { PageHeader } from "../../components/PageHeader";
import { apiFetch } from "../../lib/api";
import { useRequireAuth } from "../../lib/auth";
import type { Exam, Subject } from "../../lib/types";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric"
});

export default function ExamsPage() {
  const ready = useRequireAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [error, setError] = useState("");

  async function load(selectedSubject = subjectId) {
    const query = selectedSubject ? `?subjectId=${selectedSubject}` : "";
    setExams(await apiFetch<Exam[]>(`/exams${query}`));
  }

  useEffect(() => {
    if (!ready) return;
    Promise.all([apiFetch<Subject[]>("/subjects"), load("")])
      .then(([subjectData]) => setSubjects(subjectData))
      .catch((err) => setError(err.message));
  }, [ready]);

  async function remove(id: string) {
    if (!confirm("Xóa đề này?")) return;
    await apiFetch(`/exams/${id}`, { method: "DELETE" });
    await load();
  }

  if (!ready) return null;

  return (
    <AppShell>
      <PageHeader title="Đề đã tạo" description="Danh sách đề thi đã sinh từ ngân hàng câu hỏi và lưu cố định đáp án." />
      {error ? <Notice message={error} tone="error" /> : null}
      <div className="panel mb-5 flex flex-col gap-3 p-4 md:flex-row md:items-end">
        <label className="max-w-sm flex-1">
          <span className="label">Lọc theo môn học</span>
          <select
            className="select"
            name="examSubjectFilter"
            value={subjectId}
            onChange={(event) => {
              setSubjectId(event.target.value);
              load(event.target.value).catch((err) => setError(err.message));
            }}
          >
            <option value="">Tất cả môn</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </label>
        <Link
          className="inline-flex h-12 min-w-[150px] items-center justify-center gap-2 rounded-lg border border-[#b9d4cc] bg-[#e4f4ee] px-4 text-sm font-black text-[var(--ink)] shadow-sm transition-colors hover:bg-[#d8eee6] focus-visible:ring-3 focus-visible:ring-[rgba(54,87,168,0.28)]"
          href="/exams/generate"
        >
          <PlusCircle aria-hidden="true" size={17} />
          Sinh đề mới
        </Link>
      </div>

      <div className="panel overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Tên đề</th>
              <th>Môn học</th>
              <th>Mã đề</th>
              <th>Số câu</th>
              <th>Ngày tạo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {exams.length ? exams.map((exam) => (
              <tr key={exam.id}>
                <td className="font-black">{exam.title}</td>
                <td>{exam.subject?.name}</td>
                <td>{exam.codes?.map((code) => code.code).join(", ")}</td>
                <td>{exam.totalQuestions}</td>
                <td>{dateFormatter.format(new Date(exam.createdAt))}</td>
                <td>
                  <div className="flex items-center justify-end gap-2">
                  <Link
                    aria-label={`Xem chi tiết ${exam.title}`}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--line)] bg-white text-[var(--ink)] shadow-sm transition-colors hover:border-[#b9d4cc] hover:bg-[#f2fbf7] focus-visible:ring-3 focus-visible:ring-[rgba(54,87,168,0.28)]"
                    href={`/exams/${exam.id}`}
                  >
                    <Eye aria-hidden="true" size={16} />
                  </Link>
                  <button
                    aria-label={`Xóa ${exam.title}`}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#efc7c7] bg-[#fff7f7] text-[var(--danger)] shadow-sm transition-colors hover:border-[var(--danger)] hover:bg-[#ffecec] focus-visible:ring-3 focus-visible:ring-[rgba(189,63,63,0.22)]"
                    type="button"
                    onClick={() => remove(exam.id)}
                  >
                    <Trash2 aria-hidden="true" size={16} />
                  </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">Chưa có đề thi. Sinh đề mới để xem trước và xuất file.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
