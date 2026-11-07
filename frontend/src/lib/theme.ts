"use client";
import { useEffect } from "react";
import { THEME_KEY } from "@/config/site";
import { createPersistentStore } from "./persistent-store";

export type Theme = "light" | "dark";

const store = createPersistentStore<Theme>(THEME_KEY, () => "light", "light");

export function useTheme() {
  const theme = store.use();
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  return { theme, setTheme: (t: Theme) => store.write(t), toggle: () => store.write(theme === "dark" ? "light" : "dark") };
}
