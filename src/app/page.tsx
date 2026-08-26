import { AppShell } from "@/components/AppShell";
import { ShareButton } from "@/components/ShareButton";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg shadow-emerald-500/25">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-zinc-950">
                <path d="M13 2 4.5 13.5H11L9.5 22 19 9.5h-6.5L13 2Z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight tracking-tight text-zinc-50">
                DraftIQ
              </h1>
              <p className="text-[11px] leading-tight text-zinc-500">
                Draft board · saved on your device
              </p>
            </div>
          </div>
          <ShareButton />
        </div>
      </header>
      <main className="flex-1">
        <AppShell />
      </main>
      <footer className="border-t border-zinc-800 py-4 text-center text-[11px] text-zinc-600">
        DraftIQ · Built for mobile · boards via FantasyPros + Sleeper
      </footer>
    </div>
  );
}
