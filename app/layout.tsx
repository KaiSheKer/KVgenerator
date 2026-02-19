import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/contexts/AppContext";
import { ErrorBoundary } from "@/lib/errors/errorBoundary";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KV Generator - 电商海报生成工具",
  description: "AI 驱动的电商 KV 海报生成工具,5 分钟生成 10 张专业海报",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={inter.className} suppressHydrationWarning>
        <ErrorBoundary>
          <AppProvider>
            <div className="min-h-screen bg-background">
              {/* Header */}
              <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
                <div className="container flex h-16 items-center px-4">
                  <h1 className="text-xl font-bold">KV Generator</h1>
                </div>
              </header>

              {/* Main Content */}
              <main className="container py-8 px-4">
                {children}
              </main>

              {/* Footer */}
              <footer className="border-t py-6">
                <div className="container text-center text-sm text-muted-foreground px-4">
                  © 2026 KV Generator. All rights reserved.
                </div>
              </footer>
            </div>
            <Toaster />
          </AppProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
