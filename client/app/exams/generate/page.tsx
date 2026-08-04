"use client";

import { Button } from "../../../components/ui";
import { Shuffle } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "../../../components/AppShell";
import { Notice } from "../../../components/Notice";
import { PageHeader } from "../../../components/PageHeader";
import { apiFetch } from "../../../lib/api";
import { useRequireAuth } from "../../../lib/auth";
import type { Chapter, Exam, Subject } from "../../../lib/types";

export default function GenerateExamPage() {
  const ready = useRequireAuth();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "Đề kiểm tra trắc nghiệm",
    subjectId: "",
    chapterIds: [] as string[],
    totalQuestions: 6,
    codeCount: 2,
    startCode: 101,
    easyCount: 3,
    mediumCount: 2,
    hardCount: 1
  });

  const availableChapters = useMemo(() => chapters.filter((chapter) => chapter.subjectId === form.subjectId), [chapters, form.subjectId]);

  useEffect(() => {
    if (!ready) return;
    Promise.all([apiFetch<Subject[]>("/subjects"), apiFetch<Chapter[]>("/chapters")])
      .then(([subjectData, chapterData]) => {
        setSubjects(subjectData);
        setChapters(chapterData);
        const subjectId = subjectData[0]?.id || "";
        setForm((current) => ({
          ...current,
          subjectId,
          chapterIds: chapterData.filter((chapter) => chapter.subjectId === subjectId).map((chapter) => chapter.id)
        }));
      })
      .catch((err) => setError(err.message));
  }, [ready]);

  function setNumber(key: "totalQuestions" | "codeCount" | "startCode" | "easyCount" | "mediumCount" | "hardCount", value: string) {
    setForm({ ...form, [key]: Number(value) });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const exam = await apiFetch<Exam>("/exams/generate", {
        method: "POST",
        body: JSON.stringify(form)
      });
      router.push(`/exams/${exam.id}`);
    } catch (err) {
      const payload = (err as Error & { payload?: { availability?: Record<string, number>; required?: Record<string, number> } }).payload;
      const detail = payload?.availability
        ? ` Hiện có EASY ${payload.availability.EASY}, MEDIUM ${payload.availability.MEDIUM}, HARD ${payload.availability.HARD}.`
        : "";
      setError((err instanceof Error ? err.message : "Không thể sinh đề.") + detail);
    } finally {
      setLoading(false);
    }
  }

  if (!ready) return null;

  return (
    <AppShell>
      <PageHeader title="Sinh đề từ ngân hàng câu hỏi" description="Chọn môn học, chương và cơ cấu độ khó để sinh nhiều mã đề trắc nghiệm." />
      {error ? <Notice message={error} tone="error" /> : null}

      <form className="panel grid gap-5 p-5 xl:grid-cols-[1.2fr_0.8fr]" onSubmit={submit}>
        <section className="space-y-4">
          <label>
            <span className="label">Tên đề</span>
            <input
              autoComplete="off"
              className="input"
              name="examTitle"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="label">Môn học</span>
              <select
                className="select"
                name="examSubject"
                value={form.subjectId}
                onChange={(event) => {
                  const subjectId = event.target.value;
                  setForm({
                    ...form,
                    subjectId,
                    chapterIds: chapters.filter((chapter) => chapter.subjectId === subjectId).map((chapter) => chapter.id)
                  });
                }}
              >
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="label">Tổng số câu</span>
              <input
                className="input"
                inputMode="numeric"
                name="totalQuestions"
                type="number"
                value={form.totalQuestions}
                onChange={(event) => setNumber("totalQuestions", event.target.value)}
              />
            </label>
          </div>

          <div>
            <span className="label">Chương lấy câu hỏi</span>
            <div className="grid gap-2 md:grid-cols-2">
              {availableChapters.length ? availableChapters.map((chapter) => (
                <label key={chapter.id} className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-white p-3 font-bold">
                  <input
                    name="chapterIds"
                    type="checkbox"
                    checked={form.chapterIds.includes(chapter.id)}
                    onChange={(event) => {
                      setForm({
                        ...form,
                        chapterIds: event.target.checked
                          ? [...form.chapterIds, chapter.id]
                          : form.chapterIds.filter((id) => id !== chapter.id)
                      });
                    }}
                  />
                  {chapter.orderIndex}. {chapter.name}
                </label>
              )) : (
                <div className="empty-state md:col-span-2">Môn học này chưa có chương để chọn.</div>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="label">Số mã đề</span>
              <input className="input" inputMode="numeric" name="codeCount" type="number" value={form.codeCount} onChange={(event) => setNumber("codeCount", event.target.value)} />
            </label>
            <label>
              <span className="label">Mã bắt đầu</span>
              <input className="input" inputMode="numeric" name="startCode" type="number" value={form.startCode} onChange={(event) => setNumber("startCode", event.target.value)} />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <label>
              <span className="label">Câu dễ</span>
              <input className="input" inputMode="numeric" name="easyCount" type="number" value={form.easyCount} onChange={(event) => setNumber("easyCount", event.target.value)} />
            </label>
            <label>
              <span className="label">Câu trung bình</span>
              <input className="input" inputMode="numeric" name="mediumCount" type="number" value={form.mediumCount} onChange={(event) => setNumber("mediumCount", event.target.value)} />
            </label>
            <label>
              <span className="label">Câu khó</span>
              <input className="input" inputMode="numeric" name="hardCount" type="number" value={form.hardCount} onChange={(event) => setNumber("hardCount", event.target.value)} />
            </label>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[#fffefa] p-4 text-sm">
            <div className="flex justify-between">
              <span className="muted">Tổng theo độ khó</span>
              <strong>{form.easyCount + form.mediumCount + form.hardCount}</strong>
            </div>
            <div className="mt-2 flex justify-between">
              <span className="muted">Tổng yêu cầu</span>
              <strong>{form.totalQuestions}</strong>
            </div>
          </div>
          <Button fullWidth isPending={loading} type="submit">
            <Shuffle aria-hidden="true" size={16} />
            Sinh đề
          </Button>
        </section>
      </form>
    </AppShell>
  );
}
