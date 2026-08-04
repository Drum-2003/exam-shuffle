"use client";

import { Button } from "../../../components/ui";
import { CheckCircle2, Download, FileSpreadsheet, FileUp, Upload, X } from "lucide-react";
import { DragEvent, FormEvent, KeyboardEvent, useRef, useState } from "react";
import { AppShell } from "../../../components/AppShell";
import { Notice } from "../../../components/Notice";
import { PageHeader } from "../../../components/PageHeader";
import { apiFetch, downloadFile } from "../../../lib/api";
import { useRequireAuth } from "../../../lib/auth";

export default function ImportQuestionsPage() {
  const ready = useRequireAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [rowErrors, setRowErrors] = useState<Array<{ row: number; errors: string[] }>>([]);

  function formatFileSize(value: number) {
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / 1024 / 1024).toFixed(1)} MB`;
  }

  function pickFile(selectedFile?: File | null) {
    setMessage("");
    setError("");
    setRowErrors([]);
    if (!selectedFile) return;

    const extension = selectedFile.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls"].includes(extension || "")) {
      setError("Vui lòng chọn file Excel định dạng .xlsx hoặc .xls.");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFile(selectedFile);
  }

  function clearFile() {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    pickFile(event.dataTransfer.files[0]);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openFilePicker();
    }
  }

  async function downloadTemplate() {
    setError("");
    setTemplateLoading(true);
    try {
      await downloadFile("/questions/import-template", "template-import-cau-hoi.xlsx");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải file mẫu.");
    } finally {
      setTemplateLoading(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");
    setRowErrors([]);
    if (!file) {
      setError("Vui lòng chọn file Excel.");
      return;
    }

    const data = new FormData();
    data.append("file", file);

    try {
      const result = await apiFetch<{ imported: number }>("/questions/import", { method: "POST", body: data });
      setMessage(`Đã import ${result.imported} câu hỏi.`);
      clearFile();
    } catch (err) {
      const payload = (err as Error & { payload?: { rowErrors?: Array<{ row: number; errors: string[] }> } }).payload;
      setRowErrors(payload?.rowErrors || []);
      setError(err instanceof Error ? err.message : "Không thể import file.");
    }
  }

  if (!ready) return null;

  return (
    <AppShell>
      <PageHeader
        title="Import câu hỏi"
        description="Tải file mẫu, điền câu hỏi theo đúng cột rồi import vào ngân hàng câu hỏi."
        action={
          <Button isPending={templateLoading} variant="tertiary" onPress={downloadTemplate}>
            <Download aria-hidden="true" size={16} />
            Tải mẫu Excel
          </Button>
        }
      />
      {message ? <Notice message={message} tone="success" /> : null}
      {error ? <Notice message={error} tone="error" /> : null}

      <form className="panel w-full p-5" onSubmit={submit}>
        <div className="mb-4 flex items-start gap-3">
          <FileSpreadsheet aria-hidden="true" className="text-[var(--mint)]" size={28} />
          <div>
            <h3 className="text-xl font-black">Tải lên Excel</h3>
            <p className="muted mt-1 text-sm">
              File mẫu dùng tên môn, mã môn và tên chương. Khi import, hệ thống tự tìm hoặc tạo môn/chương tương ứng.
            </p>
          </div>
        </div>
        <div>
          <span className="label">File Excel</span>
          <div
            aria-label="Chọn hoặc kéo thả file Excel"
            className={`group relative grid min-h-[188px] cursor-pointer place-items-center overflow-hidden rounded-xl border-2 border-dashed p-5 text-center transition-all focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[rgba(54,87,168,0.28)] ${
              isDragging
                ? "border-[var(--blueprint)] bg-[#eef5ff] shadow-[0_18px_40px_rgba(49,94,168,0.14)]"
                : file
                  ? "border-[#82c6b5] bg-[#f2fbf7]"
                  : "border-[var(--line-strong)] bg-[#fbfcf8] hover:border-[#82c6b5] hover:bg-[#f4faf6]"
            }`}
            role="button"
            tabIndex={0}
            onClick={openFilePicker}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setIsDragging(false);
              }
            }}
            onDrop={handleDrop}
            onKeyDown={handleKeyDown}
          >
            <input
              ref={fileInputRef}
              accept=".xlsx,.xls"
              className="sr-only"
              id="questionFile"
              name="questionFile"
              type="file"
              onChange={(event) => pickFile(event.target.files?.[0])}
            />
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#82c6b5] to-transparent" />
            {file ? (
              <div className="flex w-full max-w-xl flex-col items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#dff4eb] text-[var(--mint)]">
                  <CheckCircle2 aria-hidden="true" size={30} />
                </div>
                <div className="min-w-0">
                  <div className="break-all text-lg font-black text-[var(--ink)]">{file.name}</div>
                  <div className="muted mt-1 text-sm">{formatFileSize(file.size)} · Sẵn sàng import</div>
                </div>
                <button
                  className="pointer-events-auto inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--line)] bg-white px-3 text-sm font-black transition-colors hover:bg-[#fff4f4] hover:text-[var(--danger)] focus-visible:ring-3 focus-visible:ring-[rgba(54,87,168,0.28)]"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    clearFile();
                  }}
                >
                  <X aria-hidden="true" size={15} />
                  Bỏ file
                </button>
              </div>
            ) : (
              <div className="flex max-w-lg flex-col items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#e4f4ee] text-[var(--mint)] transition-transform group-hover:-translate-y-0.5">
                  <FileUp aria-hidden="true" size={34} />
                </div>
                <div>
                  <div className="text-xl font-black text-[var(--ink)]">
                    Kéo thả file Excel vào đây
                  </div>
                  <div className="muted mt-1 text-sm">hoặc bấm để chọn file từ máy tính</div>
                </div>
                <div className="rounded-full border border-[var(--line)] bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-[var(--blueprint)]">
                  .xlsx / .xls
                </div>
              </div>
            )}
          </div>
        </div>
        <Button className="mt-4" type="submit">
          <Upload aria-hidden="true" size={16} />
          Import câu hỏi
        </Button>
      </form>

      {rowErrors.length ? (
        <div className="panel mt-5 w-full overflow-x-auto p-4">
          <h3 className="mb-3 text-lg font-black">Lỗi theo dòng</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Dòng</th>
                <th>Lỗi</th>
              </tr>
            </thead>
            <tbody>
              {rowErrors.map((item) => (
                <tr key={item.row}>
                  <td className="font-black">{item.row}</td>
                  <td>{item.errors.join(" ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </AppShell>
  );
}
