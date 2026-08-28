import { Outlet, Link } from "react-router-dom";

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-700">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-sm font-semibold text-slate-800">
            HR Screening
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/apply" className="text-slate-500 hover:text-slate-800 transition-colors">
              Apply
            </Link>
            <Link to="/hr" className="text-slate-500 hover:text-slate-800 transition-colors">
              HR Dashboard
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}