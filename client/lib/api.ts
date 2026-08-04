export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("quizforge_token") || "";
}

export function setToken(token: string) {
  localStorage.setItem("quizforge_token", token);
}

export function clearToken() {
  localStorage.removeItem("quizforge_token");
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const isFormData = init.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers
    }
  });

  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === "string" ? payload : payload.message || "Yêu cầu không thành công.";
    const error = new Error(message) as Error & { payload?: unknown };
    error.payload = payload;
    throw error;
  }

  return payload as T;
}

export async function downloadFile(path: string, filename: string) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  if (!response.ok) throw new Error("Không thể tải file.");

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
