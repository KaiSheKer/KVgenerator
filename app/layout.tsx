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
      <body className={`${inter.className} text-foreground antialiased`} suppressHydrationWarning>
        <ErrorBoundary>
          <AppProvider>
            <div className="min-h-screen">
              <header className="border-b border-border/60 bg-background/55 backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-gradient-to-r from-primary to-accent" />
                    <h1 className="text-lg font-semibold tracking-wide">KV Generator Studio</h1>
                  </div>
                  <p className="text-xs text-muted-foreground">AI Poster Pipeline</p>
                </div>
              </header>

              <main className="mx-auto w-full max-w-[1440px] p-6 lg:p-8">
                <div className="studio-shell p-4 lg:p-5">
                  {children}
                </div>
              </main>

              <footer className="pb-6">
                <div className="mx-auto px-6 text-center text-xs text-muted-foreground">
                  © 2026 KV Generator. Crafted for portfolio showcase.
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
