"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  return (
    <button onClick={toggle} aria-label={dark ? "Switch to light theme" : "Switch to dark theme"} title={dark ? "Light theme" : "Dark theme"}
      className="rounded-xl p-2.5 text-muted transition hover:bg-soft hover:text-ink">
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
