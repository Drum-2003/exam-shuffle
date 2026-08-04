"use client";

import { Button } from "../../components/ui";
import { BookOpen, FileQuestion, Layers, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppShell } from "../../components/AppShell";
import { Notice } from "../../components/Notice";
import { PageHeader } from "../../components/PageHeader";
import { PaginationControls } from "../../components/PaginationControls";
import { apiFetch } from "../../lib/api";
import { useRequireAuth } from "../../lib/auth";
import type { Answer, Chapter, Difficulty, Question, Subject } from "../../lib/types";

const labels = ["A", "B", "C", "D"] as const;
const pageSize = 8;
const difficultyLabels: Record<Difficulty, string> = {
  EASY: "Dễ",
  MEDIUM: "Trung bình",
  HARD: "Khó"
};

function freshAnswers(): Answer[] {
  return labels.map((label, index) => ({ label, content: "", isCorrect: index === 0 }));
}

const emptyForm = {
  content: "",
  subjectId: "",
  chapterId: "",
  difficulty: "EASY" as Difficulty,
  answers: freshAnswers()
};

export default function QuestionsPage() {
  const ready = useRequireAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [filters, setFilters] = useState({ search: "", subjectId: "", chapterId: "", difficulty: "" });
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const formChapters = useMemo(() => chapters.filter((chapter) => chapter.subjectId === form.subjectId), [chapters, form.subjectId]);
  const filterChapters = useMemo(
    () => chapters.filter((chapter) => !filters.subjectId || chapter.subjectId === filters.subjectId),
    [chapters, filters.subjectId]
  );
  const paginatedQuestions = useMemo(() => questions.slice((page - 1) * pageSize, page * pageSize), [page, questions]);
  const questionGroups = useMemo(() => {
    const subjectMap = new Map<string, { subject: Subject; chapters: Map<string, { chapter?: Chapter; questions: Question[] }> }>();

    paginatedQuestions.forEach((question) => {
      const subject =
        question.subject ||
        subjects.find((item) => item.id === question.subjectId) || {
          id: question.subjectId,
          code: "",
          name: "Chưa rõ môn học"
        };
      const chapter = question.chapter || chapters.find((item) => item.id === question.chapterId);
      const subjectGroup =
        subjectMap.get(subject.id) ||
        ({
          subject,
          chapters: new Map<string, { chapter?: Chapter; questions: Question[] }>()
        } satisfies { subject: Subject; chapters: Map<string, { chapter?: Chapter; questions: Question[] }> });
      const chapterKey = chapter?.id || question.chapterId || "unknown";
      const chapterGroup = subjectGroup.chapters.get(chapterKey) || { chapter, questions: [] };

      chapterGroup.questions.push(question);
      subjectGroup.chapters.set(chapterKey, chapterGroup);
      subjectMap.set(subject.id, subjectGroup);
    });

    return Array.from(subjectMap.values()).map((group) => ({
      subject: group.subject,
      chapters: Array.from(group.chapters.values()).sort((a, b) => (a.chapter?.orderIndex || 0) - (b.chapter?.orderIndex || 0))
    }));
  }, [chapters, paginatedQuestions, subjects]);

  async function loadBase() {
    const [subjectData, chapterData] = await Promise.all([apiFetch<Subject[]>("/subjects"), apiFetch<Chapter[]>("/chapters")]);
    setSubjects(subjectData);
    setChapters(chapterData);
    if (!form.subjectId && subjectData[0]) {
      const firstChapter = chapterData.find((chapter) => chapter.subjectId === subjectData[0].id);
      setForm((current) => ({ ...current, subjectId: subjectData[0].id, chapterId: firstChapter?.id || "" }));
    }
  }

  async function loadQuestions() {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) query.set(key, value);
    });
    setQuestions(await apiFetch<Question[]>(`/questions?${query}`));
  }

  useEffect(() => {
    if (!ready) return;
    Promise.all([loadBase(), loadQuestions()]).catch((err) => setError(err.message));
  }, [ready]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(questions.length / pageSize));
    if (page > totalPages) setPage(totalPages);
  }, [page, questions.length]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await apiFetch(editingId ? `/questions/${editingId}` : "/questions", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(form)
      });
      setMessage(editingId ? "Đã cập nhật câu hỏi." : "Đã thêm câu hỏi.");
      setEditingId("");
      setForm({
        ...emptyForm,
        subjectId: subjects[0]?.id || "",
        chapterId: chapters.find((chapter) => chapter.subjectId === subjects[0]?.id)?.id || "",
        answers: freshAnswers()
      });
      await loadQuestions();
    } catch (err) {
      const payload = (err as Error & { payload?: { errors?: string[] } }).payload;
      setError(payload?.errors?.join(" ") || (err instanceof Error ? err.message : "Không thể lưu câu hỏi."));
    }
  }

  async function applyFilters(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    await loadQuestions();
  }

  async function remove(id: string) {
    if (!confirm("Xóa câu hỏi này?")) return;
    await apiFetch(`/questions/${id}`, { method: "DELETE" });
    await loadQuestions();
  }

  function setAnswer(index: number, patch: Partial<Answer>) {
    setForm((current) => ({
      ...current,
      answers: current.answers.map((answer, answerIndex) => (answerIndex === index ? { ...answer, ...patch } : answer))
    }));
  }

  if (!ready) return null;

  return (
    <AppShell>
      <PageHeader title="Quản lý câu hỏi" description="Thêm thủ công, sửa, xóa và lọc câu hỏi theo đúng cấu trúc 4 đáp án." />
      {message ? <Notice message={message} tone="success" /> : null}
      {error ? <Notice message={error} tone="error" /> : null}

      <form className="panel mb-5 space-y-4 p-4" onSubmit={submit}>
        <div className="grid gap-4 lg:grid-cols-[1fr_240px_240px_160px]">
          <label>
            <span className="label">Nội dung câu hỏi</span>
            <textarea
              className="textarea"
              name="questionContent"
              value={form.content}
              onChange={(event) => setForm({ ...form, content: event.target.value })}
            />
          </label>
          <label>
            <span className="label">Môn học</span>
            <select
              className="select"
              name="questionSubject"
              value={form.subjectId}
              onChange={(event) => {
                const subjectId = event.target.value;
                const firstChapter = chapters.find((chapter) => chapter.subjectId === subjectId);
                setForm({ ...form, subjectId, chapterId: firstChapter?.id || "" });
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
            <span className="label">Chương</span>
            <select className="select" name="questionChapter" value={form.chapterId} onChange={(event) => setForm({ ...form, chapterId: event.target.value })}>
              {formChapters.map((chapter) => (
                <option key={chapter.id} value={chapter.id}>
                  {chapter.orderIndex}. {chapter.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">Độ khó</span>
            <select
              className="select"
              name="questionDifficulty"
              value={form.difficulty}
              onChange={(event) => setForm({ ...form, difficulty: event.target.value as Difficulty })}
            >
              <option value="EASY">Dễ</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="HARD">Khó</option>
            </select>
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {form.answers.map((answer, index) => (
            <label key={answer.label} className="rounded-lg border border-[var(--line)] bg-white p-3">
              <span className="mb-2 flex items-center justify-between">
                <span className="label mb-0">Đáp án {answer.label}</span>
              <input
                aria-label={`Chọn đáp án đúng ${answer.label}`}
                  type="radio"
                  name="correct"
                  checked={answer.isCorrect}
                  onChange={() =>
                    setForm({
                      ...form,
                      answers: form.answers.map((item, answerIndex) => ({ ...item, isCorrect: answerIndex === index }))
                    })
                  }
                />
              </span>
              <input
                autoComplete="off"
                className="input"
                name={`answer${answer.label}`}
                value={answer.content}
                onChange={(event) => setAnswer(index, { content: event.target.value })}
              />
            </label>
          ))}
        </div>

        <div className="flex gap-2">
          <Button type="submit">
            <Plus aria-hidden="true" size={16} />
            {editingId ? "Lưu câu hỏi" : "Thêm câu hỏi"}
          </Button>
          {editingId ? (
            <Button
              aria-label="Hủy sửa câu hỏi"
              variant="tertiary"
              onPress={() => {
                setEditingId("");
                setForm({ ...emptyForm, subjectId: subjects[0]?.id || "", chapterId: chapters[0]?.id || "", answers: freshAnswers() });
              }}
            >
              <X aria-hidden="true" size={16} />
              Hủy sửa
            </Button>
          ) : null}
        </div>
      </form>

      <form className="panel mb-5 grid gap-3 p-4 lg:grid-cols-[1fr_220px_220px_160px_auto]" onSubmit={applyFilters}>
        <input
          aria-label="Tìm nội dung câu hỏi"
          autoComplete="off"
          className="input"
          name="questionSearch"
          placeholder="Tìm nội dung câu hỏi"
          value={filters.search}
          onChange={(event) => setFilters({ ...filters, search: event.target.value })}
        />
        <select
          aria-label="Lọc câu hỏi theo môn học"
          className="select"
          name="filterSubject"
          value={filters.subjectId}
          onChange={(event) => setFilters({ ...filters, subjectId: event.target.value, chapterId: "" })}
        >
          <option value="">Tất cả môn</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Lọc câu hỏi theo chương"
          className="select"
          name="filterChapter"
          value={filters.chapterId}
          onChange={(event) => setFilters({ ...filters, chapterId: event.target.value })}
        >
          <option value="">Tất cả chương</option>
          {filterChapters.map((chapter) => (
            <option key={chapter.id} value={chapter.id}>
              {chapter.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Lọc câu hỏi theo độ khó"
          className="select"
          name="filterDifficulty"
          value={filters.difficulty}
          onChange={(event) => setFilters({ ...filters, difficulty: event.target.value })}
        >
          <option value="">Tất cả độ khó</option>
          <option value="EASY">Dễ</option>
          <option value="MEDIUM">Trung bình</option>
          <option value="HARD">Khó</option>
        </select>
        <Button type="submit" variant="secondary">
          <Search aria-hidden="true" size={16} />
          Lọc
        </Button>
      </form>

      {questions.length ? (
        <div className="grid gap-4">
          {questionGroups.map((subjectGroup) => (
            <section key={subjectGroup.subject.id} className="panel overflow-hidden">
              <div className="flex flex-col gap-3 border-b border-[var(--line)] bg-[#f5faf2] px-4 py-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-[#e4f4ee] p-2 text-[var(--mint)]">
                    <BookOpen aria-hidden="true" size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black">{subjectGroup.subject.name}</h2>
                    <p className="muted text-sm">
                      {subjectGroup.chapters.length} chương · {subjectGroup.chapters.reduce((total, chapter) => total + chapter.questions.length, 0)} câu hỏi
                    </p>
                  </div>
                </div>
                <span className="chip">Ngân hàng câu hỏi</span>
              </div>

              <div className="grid gap-4 p-4">
                {subjectGroup.chapters.map((chapterGroup) => (
                  <section key={chapterGroup.chapter?.id || "unknown"} className="rounded-xl border border-[var(--line)] bg-white/80">
                    <div className="flex flex-col gap-2 border-b border-[var(--line)] bg-[#fbfcf8] px-4 py-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-2">
                        <Layers aria-hidden="true" className="text-[var(--blueprint)]" size={18} />
                        <h3 className="font-black">
                          {chapterGroup.chapter ? `${chapterGroup.chapter.orderIndex}. ${chapterGroup.chapter.name}` : "Chưa rõ chương"}
                        </h3>
                      </div>
                      <span className="chip w-fit">{chapterGroup.questions.length} câu</span>
                    </div>

                    <div className="divide-y divide-[var(--line)]">
                      {chapterGroup.questions.map((question) => (
                        <article key={question.id} className="grid gap-4 px-4 py-4 xl:grid-cols-[1.15fr_1fr_auto]">
                          <div className="min-w-0">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf4ff] text-[var(--blueprint)]">
                                <FileQuestion aria-hidden="true" size={16} />
                              </span>
                              <span className="chip">{difficultyLabels[question.difficulty]}</span>
                            </div>
                            <p className="break-words font-black leading-7">{question.content}</p>
                          </div>

                          <div className="grid gap-2 sm:grid-cols-2">
                            {question.answers.map((answer) => (
                              <div
                                key={answer.label}
                                className={`rounded-lg border px-3 py-2 text-sm ${
                                  answer.isCorrect
                                    ? "border-[#82c6b5] bg-[#f2fbf7] font-black text-[var(--mint)]"
                                    : "border-[var(--line)] bg-white"
                                }`}
                              >
                                <span className="font-black">{answer.label}.</span> {answer.content}
                              </div>
                            ))}
                          </div>

                          <div className="flex items-start justify-end gap-2">
                            <Button
                              aria-label={`Sửa câu hỏi ${question.content.slice(0, 40)}`}
                              isIconOnly
                              variant="tertiary"
                              onPress={() => {
                                setEditingId(question.id);
                                setForm({
                                  content: question.content,
                                  subjectId: question.subjectId,
                                  chapterId: question.chapterId,
                                  difficulty: question.difficulty,
                                  answers: labels.map((label) => {
                                    const answer = question.answers.find((item) => item.label === label);
                                    return { label, content: answer?.content || "", isCorrect: Boolean(answer?.isCorrect) };
                                  })
                                });
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                            >
                              <Pencil aria-hidden="true" size={16} />
                            </Button>
                            <Button aria-label={`Xóa câu hỏi ${question.content.slice(0, 40)}`} isIconOnly variant="danger" onPress={() => remove(question.id)}>
                              <Trash2 aria-hidden="true" size={16} />
                            </Button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="empty-state">Chưa có câu hỏi phù hợp. Thêm câu hỏi mới hoặc thay đổi bộ lọc.</div>
      )}
      <PaginationControls label="câu hỏi" page={page} pageSize={pageSize} totalItems={questions.length} onPageChange={setPage} />
    </AppShell>
  );
}
