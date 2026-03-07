import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "施工指摘管理 — APS Viewer Issue Tracker",
  description: "Construction site issue management with APS Viewer integration",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
