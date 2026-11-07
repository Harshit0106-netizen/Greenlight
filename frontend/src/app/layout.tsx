import type { Metadata, Viewport } from "next";
import { site, THEME_KEY } from "@/config/site";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: `${site.name} — Brand intelligence`, template: `%s · ${site.name}` },
  description: site.description,
  icons: { icon: "/logo.svg" }
};
export const viewport: Viewport = { themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f6f7fb" }, { media: "(prefers-color-scheme: dark)", color: "#0a0d15" }] };

// Applies the saved theme before first paint to avoid a flash of the wrong theme.
const themeScript = `try{var t=JSON.parse(localStorage.getItem("${THEME_KEY}"));if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>{children}</body>
    </html>
  );
}
