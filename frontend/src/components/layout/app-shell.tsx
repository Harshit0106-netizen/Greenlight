"use client";
import { useEffect, useState, type ReactNode } from "react";
import { site } from "@/config/site";
import { ToastProvider } from "@/components/ui";
import { useTheme } from "@/lib/theme";
import { CommandPalette } from "./command-palette";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  useTheme(); // keeps <html data-theme> in sync with the stored preference

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen(o => !o); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-page text-ink">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[256px] lg:block"><Sidebar /></aside>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button aria-label="Close navigation" className="absolute inset-0 animate-fade-in bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <aside className="relative h-full w-[280px] animate-fade-in shadow-2xl"><Sidebar onNavigate={() => setMobileOpen(false)} /></aside>
          </div>
        )}
        <div className="lg:pl-[256px]">
          <Topbar onMenu={() => setMobileOpen(true)} onSearch={() => setPaletteOpen(true)} />
          <main className="mx-auto min-h-[calc(100vh-130px)] max-w-[1480px] px-4 py-7 md:px-8 md:py-9">{children}</main>
          <footer className="border-t border-line px-6 py-5 text-center text-[11px] text-muted">
            {site.name.toUpperCase()} · {site.tagline} · Demo workspace
          </footer>
        </div>
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      </div>
    </ToastProvider>
  );
}
