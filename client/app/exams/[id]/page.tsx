"use client";

import { Button } from "../../../components/ui";
import { Download, FileText, Table2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../../components/AppShell";
import { Notice } from "../../../components/Notice";
import { PageHeader } from "../../../components/PageHeader";
import { apiFetch, downloadFile } from "../../../lib/api";
import { useRequireAuth } from "../../../lib/auth";
import type { Exam, ExamCode } from "../../../lib/types";

export default function ExamDetailPage() {
  const ready = useRequireAuth();
  const params = useParams<{ id: string }>();
  const [exam, setExam] = useState<Exam | null>(null);
  const [activeCodeId, setActiveCodeId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready || !params.id) return;
    apiFetch<Exam>(`/exams/${params.id}`)
      .then((data) => {
        setExam(data);
        setActiveCodeId(data.codes?.[0]?.id || "");
      })
      .catch((err) => setError(err.message));
  }, [ready, params.id]);

  const activeCode: ExamCode | undefined = useMemo(
    () => exam?.codes?.find((code) => code.id === activeCodeId) || exam?.codes?.[0],
    [exam, activeCodeId]
  );

  async function download(kind: "exam-docx" | "answers-docx" | "exam-pdf") {
    if (!exam || !activeCode) return;
    const codeParam = `?code=${activeCode.code}`;
    const map = {
      "exam-docx": [`/exams/${exam.id}/export/docx${codeParam}`, `de-thi-${exam.id}-ma-${activeCode.code}.docx`],
      "answers-docx": [`/exams/${exam.id}/export/answers/docx${codeParam}`, `dap-an-${exam.id}-ma-${activeCode.code}.docx`],
      "exam-pdf": [`/exams/${exam.id}/export/pdf${codeParam}`, `de-thi-${exam.id}-ma-${activeCode.code}.pdf`]
    } as const;
    try {
      await downloadFile(map[kind][0], map[kind][1]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải file.");
    }
  }

  if (!ready) return null;

  return (
    <AppShell>
      <PageHeader
        title={exam?.title || "Xem trước đề thi"}
        description={exam ? `${exam.subject.name} · ${exam.totalQuestions} câu · ${exam.codes.length} mã đề` : "Đang tải dữ liệu đề thi."}
        action={
          <Link className="rounded-lg border border-[var(--line)] bg-white px-4 py-2 font-bold" href="/exams">
            Quay lại danh sách
          </Link>
        }
      />
      {error ? <Notice message={error} tone="error" /> : null}
      {!exam || !activeCode ? null : (
        <>
          <div className="panel mb-5 flex flex-wrap items-center gap-2 p-4">
            {exam.codes
              .slice()
              .sort((a, b) => a.code - b.code)
              .map((code) => (
                <Button
                  key={code.id}
                  variant={activeCode.id === code.id ? "primary" : "tertiary"}
                  onPress={() => setActiveCodeId(code.id)}
                >
                  Mã {code.code}
                </Button>
              ))}
            <span className="grow" />
            <Button variant="secondary" onPress={() => download("exam-docx")}>
              <FileText aria-hidden="true" size={16} />
              Word mã {activeCode.code}
            </Button>
            <Button variant="secondary" onPress={() => download("answers-docx")}>
              <Table2 aria-hidden="true" size={16} />
              Đáp án mã {activeCode.code}
            </Button>
            <Button variant="tertiary" onPress={() => download("exam-pdf")}>
              <Download aria-hidden="true" size={16} />
              PDF mã {activeCode.code}
            </Button>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
            <section className="space-y-4">
              {activeCode.questions
                .slice()
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((question) => (
                  <article key={question.id} className="panel p-4">
                    <h3 className="font-black">
                      Câu {question.orderIndex}. {question.questionSnapshot}
                    </h3>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {question.answers
                        .slice()
                        .sort((a, b) => a.orderIndex - b.orderIndex)
                        .map((answer) => (
                          <div key={answer.id} className="rounded-lg border border-[var(--line)] bg-white p-3">
                            <strong>{answer.label}.</strong> {answer.content}
                          </div>
                        ))}
                    </div>
                  </article>
                ))}
            </section>

            <aside className="panel h-fit p-4">
              <h3 className="mb-3 text-lg font-black">Bảng đáp án mã {activeCode.code}</h3>
              <div className="grid grid-cols-4 gap-2">
                {activeCode.questions
                  .slice()
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((question) => (
                    <div key={question.id} className="rounded-lg border border-[var(--line)] bg-[#fffefa] p-3 text-center">
                      <div className="muted text-xs">Câu {question.orderIndex}</div>
                      <div className="text-xl font-black text-[var(--mint)]">{question.correctOption}</div>
                    </div>
                  ))}
              </div>
            </aside>
          </div>
        </>
      )}
    </AppShell>
  );
}
