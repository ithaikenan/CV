import "./globals.css";
import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Playoff Monkey — guess the NBA playoffs",
  description:
    "Playoff Monkey: pick scores for every NBA playoff game, climb your leagues, and beat the Monkey.",
  icons: [{ rel: "icon", url: "/monkey.svg" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body">
        <Navbar />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-10 text-center text-xs text-white/40 flex flex-col items-center gap-2">
          <div>Playoff Monkey · playoffmonkey.com</div>
          <a href="/feedback" className="hover:text-banana-500 underline">
            Report a bug · ask us anything
          </a>
        </footer>
      </body>
    </html>
  );
}
