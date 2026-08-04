import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Lexend } from "next/font/google";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans"
});

const lexend = Lexend({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  weight: ["600", "700", "800"],
  variable: "--font-display"
});

export const metadata: Metadata = {
  title: "Sinh đề trắc nghiệm",
  description: "Ứng dụng xáo trộn câu hỏi trắc nghiệm và sinh đề từ ngân hàng câu hỏi",
  icons: {
    icon: "/logo.png"
  }
};

export const viewport: Viewport = {
  themeColor: "#f4f7f1"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" data-theme="light" suppressHydrationWarning>
      <body className={`${beVietnam.variable} ${lexend.variable}`}>{children}</body>
    </html>
  );
}
