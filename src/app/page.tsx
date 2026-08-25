import { AppShell } from "@/components/AppShell";
import { ShareButton } from "@/components/ShareButton";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-bold leading-tight text-zinc-50">DraftIQ</h1>
            <p className="text-[11px] text-zinc-500">Fantasy draft assistant · saved on your device</p>
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
