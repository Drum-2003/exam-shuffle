"use client";

import { Button } from "../../components/ui";
import { BookOpen, Layers, Pencil, Plus, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppShell } from "../../components/AppShell";
import { Notice } from "../../components/Notice";
import { PageHeader } from "../../components/PageHeader";
import { PaginationControls } from "../../components/PaginationControls";
import { apiFetch } from "../../lib/api";
import { useRequireAuth } from "../../lib/auth";
import type { Chapter, Subject } from "../../lib/types";

const emptyForm = { name: "", orderIndex: 1, subjectId: "" };
const pageSize = 10;

export default function ChaptersPage() {
  const ready = useRequireAuth();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const orderedChapters = useMemo(
    () =>
      [...chapters].sort((a, b) => {
        const subjectA = a.subject?.name || subjects.find((subject) => subject.id === a.subjectId)?.name || "";
        const subjectB = b.subject?.name || subjects.find((subject) => subject.id === b.subjectId)?.name || "";
        return subjectA.localeCompare(subjectB, "vi") || a.orderIndex - b.orderIndex;
      }),
    [chapters, subjects]
  );
  const paginatedChapters = useMemo(() => orderedChapters.slice((page - 1) * pageSize, page * pageSize), [orderedChapters, page]);
  const chapterGroups = useMemo(
    () =>
      subjects
        .map((subject) => ({
          subject,
          chapters: paginatedChapters
            .filter((chapter) => chapter.subjectId === subject.id)
            .sort((a, b) => a.orderIndex - b.orderIndex)
        }))
        .filter((group) => group.chapters.length > 0),
    [paginatedChapters, subjects]
  );

  async function load() {
    const [subjectData, chapterData] = await Promise.all([apiFetch<Subject[]>("/subjects"), apiFetch<Chapter[]>("/chapters")]);
    setSubjects(subjectData);
    setChapters(chapterData);
    if (!form.subjectId && subjectData[0]) setForm((current) => ({ ...current, subjectId: subjectData[0].id }));
  }

  useEffect(() => {
    if (ready) load().catch((err) => setError(err.message));
  }, [ready]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(chapters.length / pageSize));
    if (page > totalPages) setPage(totalPages);
  }, [chapters.length, page]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await apiFetch(editingId ? `/chapters/${editingId}` : "/chapters", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(form)
      });
      setMessage(editingId ? "Đã cập nhật chương." : "Đã thêm chương.");
      setEditingId("");
      setForm({ ...emptyForm, subjectId: subjects[0]?.id || "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu chương.");
    }
  }

  async function remove(id: string) {
    if (!confirm("Xóa chương này? Các câu hỏi liên quan cũng sẽ bị xóa.")) return;
    await apiFetch(`/chapters/${id}`, { method: "DELETE" });
    await load();
  }

  if (!ready) return null;

  return (
    <AppShell>
      <PageHeader title="Quản lý chương" description="Mỗi chương thuộc một môn học và được dùng để lọc khi sinh đề." />
      {message ? <Notice message={message} tone="success" /> : null}
      {error ? <Notice message={error} tone="error" /> : null}

      <form className="panel mb-5 grid gap-4 p-4 lg:grid-cols-[1fr_130px_1fr_auto]" onSubmit={submit}>
        <label>
          <span className="label">Tên chương</span>
          <input
            autoComplete="off"
            className="input"
            name="chapterName"
            value={form.name}
            placeholder="Tên chương..."
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </label>
        <label>
          <span className="label">Thứ tự</span>
          <input
            className="input"
            inputMode="numeric"
            name="chapterOrder"
            type="number"
            value={form.orderIndex}
            onChange={(event) => setForm({ ...form, orderIndex: Number(event.target.value) })}
          />
        </label>
        <label>
          <span className="label">Môn học</span>
          <select className="select" name="chapterSubject" value={form.subjectId} onChange={(event) => setForm({ ...form, subjectId: event.target.value })}>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-2">
          <Button type="submit">
            <Plus aria-hidden="true" size={16} />
            {editingId ? "Lưu" : "Thêm"}
          </Button>
          {editingId ? (
            <Button
              aria-label="Hủy sửa chương"
              variant="tertiary"
              onPress={() => (setEditingId(""), setForm({ ...emptyForm, subjectId: subjects[0]?.id || "" }))}
            >
              <X aria-hidden="true" size={16} />
            </Button>
          ) : null}
        </div>
      </form>

      {chapters.length ? (
        <div className="grid gap-4">
          {chapterGroups.map(({ subject, chapters: subjectChapters }) => (
            <section key={subject.id} className="panel overflow-hidden">
              <div className="flex flex-col gap-3 border-b border-[var(--line)] bg-[#f5faf2] px-4 py-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-[#e4f4ee] p-2 text-[var(--mint)]">
                    <BookOpen aria-hidden="true" size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black">{subject.name}</h2>
                    <p className="muted text-sm">{subjectChapters.length} chương thuộc môn học này</p>
                  </div>
                </div>
                <span className="chip">{subjectChapters.reduce((total, chapter) => total + (chapter._count?.questions || 0), 0)} câu hỏi</span>
              </div>

              {subjectChapters.length ? (
                <div className="divide-y divide-[var(--line)]">
                  {subjectChapters.map((chapter) => (
                    <article key={chapter.id} className="grid gap-3 px-4 py-3 md:grid-cols-[auto_1fr_auto_auto] md:items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--line)] bg-white text-sm font-black tabular-nums">
                        {chapter.orderIndex}
                      </div>
                      <div className="min-w-0">
                        <div className="break-words font-black">{chapter.name}</div>
                        <div className="muted mt-1 flex items-center gap-2 text-sm">
                          <Layers aria-hidden="true" size={14} />
                          Chương {chapter.orderIndex}
                        </div>
                      </div>
                      <span className="chip w-fit">{chapter._count?.questions || 0} câu</span>
                      <div className="flex justify-end gap-2">
                        <Button
                          aria-label={`Sửa chương ${chapter.name}`}
                          isIconOnly
                          variant="tertiary"
                          onPress={() => {
                            setEditingId(chapter.id);
                            setForm({
                              name: chapter.name,
                              orderIndex: chapter.orderIndex,
                              subjectId: chapter.subjectId
                            });
                          }}
                        >
                          <Pencil aria-hidden="true" size={16} />
                        </Button>
                        <Button aria-label={`Xóa chương ${chapter.name}`} isIconOnly variant="danger" onPress={() => remove(chapter.id)}>
                          <Trash2 aria-hidden="true" size={16} />
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="p-4">
                  <div className="empty-state min-h-[120px]">Môn học này chưa có chương.</div>
                </div>
              )}
            </section>
          ))}
        </div>
      ) : (
        <div className="empty-state">Chưa có chương. Tạo chương để phân loại câu hỏi khi sinh đề.</div>
      )}
      <PaginationControls label="chương" page={page} pageSize={pageSize} totalItems={chapters.length} onPageChange={setPage} />
    </AppShell>
  );
}
