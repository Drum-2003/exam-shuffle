"use client";

import { Button } from "../../components/ui";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppShell } from "../../components/AppShell";
import { Notice } from "../../components/Notice";
import { PageHeader } from "../../components/PageHeader";
import { PaginationControls } from "../../components/PaginationControls";
import { apiFetch } from "../../lib/api";
import { useRequireAuth } from "../../lib/auth";
import type { Subject } from "../../lib/types";

const emptyForm = { code: "", name: "", description: "" };
const pageSize = 8;

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function SubjectsPage() {
  const ready = useRequireAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const filteredSubjects = useMemo(() => {
    const query = normalizeText(search.trim());
    if (!query) return subjects;

    return subjects.filter((subject) =>
      [subject.code, subject.name, subject.description || ""].some((value) => normalizeText(value).includes(query))
    );
  }, [search, subjects]);
  const paginatedSubjects = useMemo(() => filteredSubjects.slice((page - 1) * pageSize, page * pageSize), [filteredSubjects, page]);

  async function load() {
    setSubjects(await apiFetch<Subject[]>("/subjects"));
  }

  useEffect(() => {
    if (ready) load().catch((err) => setError(err.message));
  }, [ready]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredSubjects.length / pageSize));
    if (page > totalPages) setPage(totalPages);
  }, [filteredSubjects.length, page]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await apiFetch(editingId ? `/subjects/${editingId}` : "/subjects", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(form)
      });
      setForm(emptyForm);
      setEditingId("");
      setMessage(editingId ? "Đã cập nhật môn học." : "Đã thêm môn học.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu môn học.");
    }
  }

  async function remove(id: string) {
    if (!confirm("Xóa môn học này? Các chương và câu hỏi liên quan cũng sẽ bị xóa.")) return;
    setError("");
    setMessage("");
    try {
      await apiFetch(`/subjects/${id}`, { method: "DELETE" });
      if (editingId === id) {
        setEditingId("");
        setForm(emptyForm);
      }
      setMessage("Đã xóa môn học.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xóa môn học.");
    }
  }

  if (!ready) return null;

  return (
    <AppShell>
      <PageHeader title="Quản lý môn học" description="Tạo mã môn, tên môn và mô tả ngắn cho ngân hàng câu hỏi." />
      {message ? <Notice message={message} tone="success" /> : null}
      {error ? <Notice message={error} tone="error" /> : null}

      <form className="panel mb-5 grid gap-4 p-4 lg:grid-cols-[160px_1fr_1.4fr_auto]" onSubmit={submit}>
        <label>
          <span className="label">Mã môn</span>
          <input
            autoComplete="off"
            className="input"
            name="subjectCode"
            placeholder="Mã môn..."
            spellCheck={false}
            value={form.code}
            onChange={(event) => setForm({ ...form, code: event.target.value })}
          />
        </label>
        <label>
          <span className="label">Tên môn</span>
          <input
            autoComplete="off"
            className="input"
            name="subjectName"
            placeholder="Tên môn..."
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </label>
        <label>
          <span className="label">Mô tả</span>
          <input
            className="input"
            name="subjectDescription"
            placeholder="Mô tả..."
            autoComplete="off"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </label>
        <div className="flex items-end gap-2">
          <Button type="submit">
            <Plus aria-hidden="true" size={16} />
            {editingId ? "Lưu" : "Thêm"}
          </Button>
          {editingId ? (
            <Button aria-label="Hủy sửa môn học" variant="tertiary" onPress={() => (setEditingId(""), setForm(emptyForm))}>
              <X aria-hidden="true" size={16} />
            </Button>
          ) : null}
        </div>
      </form>

      <section className="panel mb-5 flex flex-col gap-3 p-4 md:flex-row md:items-end md:justify-between">
        <label className="min-w-0 flex-1">
          <span className="label">Tìm kiếm môn học</span>
          <div className="flex items-center gap-3">
            <div className="hidden rounded-lg bg-[#edf4ff] p-3 text-[var(--blueprint)] sm:block">
              <Search aria-hidden="true" size={18} />
            </div>
            <input
              autoComplete="off"
              className="input"
              placeholder="Nhập mã môn, tên môn hoặc mô tả..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </label>
        <div className="flex items-center gap-3 md:pb-1">
          <span className="chip">
            {filteredSubjects.length}/{subjects.length} môn học
          </span>
          {search ? (
            <Button aria-label="Xóa tìm kiếm môn học" variant="tertiary" onPress={() => setSearch("")}>
              <X aria-hidden="true" size={16} />
              Xóa lọc
            </Button>
          ) : null}
        </div>
      </section>

      <div className="panel overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Mã môn</th>
              <th>Tên môn</th>
              <th>Mô tả</th>
              <th>Thống kê</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {subjects.length && filteredSubjects.length ? paginatedSubjects.map((subject) => (
              <tr key={subject.id} className="interactive-row">
                <td className="font-black">{subject.code}</td>
                <td>{subject.name}</td>
                <td className="muted">{subject.description}</td>
                <td>
                  <span className="chip">{subject._count?.chapters || 0} chương</span>{" "}
                  <span className="chip">{subject._count?.questions || 0} câu</span>
                </td>
                <td className="whitespace-nowrap text-right">
                  <Button
                    aria-label={`Sửa môn học ${subject.name}`}
                    isIconOnly
                    variant="tertiary"
                    onPress={() => {
                      setEditingId(subject.id);
                      setForm({
                        code: subject.code,
                        name: subject.name,
                        description: subject.description || ""
                      });
                    }}
                  >
                    <Pencil aria-hidden="true" size={16} />
                  </Button>{" "}
                  <Button aria-label={`Xóa môn học ${subject.name}`} isIconOnly variant="danger" onPress={() => remove(subject.id)}>
                    <Trash2 aria-hidden="true" size={16} />
                  </Button>
                </td>
              </tr>
            )) : subjects.length ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">Không tìm thấy môn học phù hợp với từ khóa hiện tại.</div>
                </td>
              </tr>
            ) : (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">Chưa có môn học. Thêm môn đầu tiên để bắt đầu tạo chương và câu hỏi.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <PaginationControls label="môn học" page={page} pageSize={pageSize} totalItems={filteredSubjects.length} onPageChange={setPage} />
    </AppShell>
  );
}
