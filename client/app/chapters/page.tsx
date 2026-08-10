"use client";

import { Button } from "../../components/ui";
import { BookOpen, Layers, Pencil, Plus, Search, Trash2, X } from "lucide-react";
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

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function ChaptersPage() {
  const ready = useRequireAuth();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
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
  const filteredChapters = useMemo(() => {
    const query = normalizeText(search.trim());
    if (!query) return orderedChapters;

    return orderedChapters.filter((chapter) => {
      const subjectName = chapter.subject?.name || subjects.find((subject) => subject.id === chapter.subjectId)?.name || "";
      return [chapter.name, subjectName, String(chapter.orderIndex)].some((value) => normalizeText(value).includes(query));
    });
  }, [orderedChapters, search, subjects]);
  const paginatedChapters = useMemo(() => filteredChapters.slice((page - 1) * pageSize, page * pageSize), [filteredChapters, page]);
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
    const totalPages = Math.max(1, Math.ceil(filteredChapters.length / pageSize));
    if (page > totalPages) setPage(totalPages);
  }, [filteredChapters.length, page]);

  useEffect(() => {
    setPage(1);
  }, [search]);

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
    setError("");
    setMessage("");
    try {
      await apiFetch(`/chapters/${id}`, { method: "DELETE" });
      if (editingId === id) {
        setEditingId("");
        setForm({ ...emptyForm, subjectId: subjects[0]?.id || "" });
      }
      setMessage("Đã xóa chương.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xóa chương.");
    }
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

      <section className="panel mb-5 flex flex-col gap-3 p-4 md:flex-row md:items-end md:justify-between">
        <label className="min-w-0 flex-1">
          <span className="label">Tìm kiếm chương</span>
          <div className="flex items-center gap-3">
            <div className="hidden rounded-lg bg-[#edf4ff] p-3 text-[var(--blueprint)] sm:block">
              <Search aria-hidden="true" size={18} />
            </div>
            <input
              autoComplete="off"
              className="input"
              placeholder="Nhập tên chương, môn học hoặc thứ tự..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </label>
        <div className="flex items-center gap-3 md:pb-1">
          <span className="chip">
            {filteredChapters.length}/{chapters.length} chương
          </span>
          {search ? (
            <Button aria-label="Xóa tìm kiếm chương" variant="tertiary" onPress={() => setSearch("")}>
              <X aria-hidden="true" size={16} />
              Xóa lọc
            </Button>
          ) : null}
        </div>
      </section>

      {chapters.length ? (
        filteredChapters.length ? (
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
                      <article key={chapter.id} className="interactive-row grid gap-3 px-4 py-3 md:grid-cols-[auto_1fr_auto_auto] md:items-center">
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
          <div className="empty-state">Không tìm thấy chương phù hợp với từ khóa hiện tại.</div>
        )
      ) : (
        <div className="empty-state">Chưa có chương. Tạo chương để phân loại câu hỏi khi sinh đề.</div>
      )}
      <PaginationControls label="chương" page={page} pageSize={pageSize} totalItems={filteredChapters.length} onPageChange={setPage} />
    </AppShell>
  );
}
