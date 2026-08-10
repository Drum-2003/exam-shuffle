"use client";

import { KeyRound, LogIn, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AppLogo } from "../../components/AppLogo";
import { Notice } from "../../components/Notice";
import { Button, Card } from "../../components/ui";
import { apiFetch, setToken } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("teacher@example.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await apiFetch<{ token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      setToken(result.token);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể đăng nhập. Kiểm tra tài khoản rồi thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-2xl border border-[var(--line)] bg-white/78 shadow-[var(--shadow-soft)] lg:grid-cols-[1fr_440px]">
        <section className="flex min-h-[540px] flex-col justify-between bg-[linear-gradient(135deg,#fbfdf9,#edf5ee)] p-6 sm:p-8 lg:p-10">
          <div>
            <AppLogo size="login" />
            <h1 className="mt-4 max-w-2xl text-balance text-3xl font-black leading-tight text-[var(--ink)] sm:text-4xl">
              Ứng dụng xáo trộn câu hỏi trắc nghiệm và sinh đề từ ngân hàng câu hỏi.
            </h1>
            <p className="muted mt-4 max-w-xl text-pretty text-base sm:text-lg">
              Quản lý môn, chương, câu hỏi; tự động sinh nhiều mã đề với đáp án được lưu cố định.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {["Ngân hàng", "Sinh mã đề", "Bảng đáp án"].map((item) => (
              <div key={item} className="flex min-h-[92px] flex-col justify-between rounded-xl border border-[var(--line)] bg-white/86 px-4 py-3 shadow-sm">
                <div className="flex min-h-[34px] items-center text-xs font-black uppercase leading-5 tracking-[0.14em] text-[var(--blueprint)]">
                  {item}
                </div>
                <div className="h-1.5 rounded-full bg-[linear-gradient(90deg,var(--blueprint),var(--mint))]" />
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center bg-white/50 p-4 sm:p-6 lg:p-8">
          <Card className="w-full">
            <Card.Header>
              <KeyRound aria-hidden="true" size={28} />
              <div className="min-w-0">
                <Card.Title>Đăng nhập giáo viên</Card.Title>
                <Card.Description>Tài khoản demo đã được điền sẵn.</Card.Description>
              </div>
            </Card.Header>
            <Card.Content>
              {error ? <Notice message={error} tone="error" /> : null}
              <form className="space-y-5" onSubmit={submit}>
                <div>
                  <label htmlFor="email">
                    <span className="label">Email hoặc tên đăng nhập</span>
                    <input
                      autoComplete="username"
                      className="input"
                      id="email"
                      name="email"
                      spellCheck={false}
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </label>
                </div>
                <div>
                  <label htmlFor="password">
                    <span className="label">Mật khẩu</span>
                    <input
                      autoComplete="current-password"
                      className="input"
                      id="password"
                      name="password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </label>
                </div>
                <Button fullWidth isPending={loading} type="submit">
                  <LogIn aria-hidden="true" size={16} />
                  Đăng nhập
                </Button>
              </form>
              <div className="mt-5 flex items-start gap-3 rounded-lg border border-[var(--line)] bg-[#f6faf3] p-3 text-sm">
                <ShieldCheck aria-hidden="true" className="mt-0.5 text-[var(--mint)]" size={18} />
                <p className="muted">
                  Demo: <span translate="no">teacher@example.com</span> / <span translate="no">123456</span>
                </p>
              </div>
            </Card.Content>
          </Card>
        </section>
      </div>
    </main>
  );
}
