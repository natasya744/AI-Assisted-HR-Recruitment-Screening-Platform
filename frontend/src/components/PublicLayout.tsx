import { Link, Outlet } from "react-router-dom";
import { FileCheck2 } from "lucide-react";

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50/70 font-sans text-neutral-900 antialiased selection:bg-neutral-950 selection:text-white">
      <header className="sticky top-0 z-40 border-b border-neutral-200/90 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="group flex items-center gap-3 transition-opacity hover:opacity-85"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-neutral-950 text-white shadow-xs">
              <FileCheck2 className="size-4.5" />
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold tracking-tight text-neutral-950">
                  TalentAI
                </span>
                <span className="rounded border border-neutral-200 bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-600">
                  Careers
                </span>
              </div>
              <span className="text-[11px] text-neutral-500">
                Candidate Application Portal
              </span>
            </div>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <footer className="mt-auto border-t border-neutral-200 bg-white py-5 text-xs text-neutral-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-900">TalentAI Recruitment</span>
            <span className="text-neutral-300">·</span>
            <span>Candidate Application Portal</span>
          </div>
          <span className="text-[11px] text-neutral-400">
            Your information is handled confidentially.
          </span>
        </div>
      </footer>
    </div>
  );
}
