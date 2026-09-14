import { Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  UserPlus,
  Briefcase,
  Sparkles,
  CheckCircle2,
  FileCheck2,
} from "lucide-react";

export default function Layout() {
  const location = useLocation();

  const navItems = [
    { label: "Overview", href: "/", icon: Sparkles, exact: true },
    { label: "Apply Position", href: "/apply", icon: UserPlus },
    { label: "HR Dashboard", href: "/hr", icon: LayoutDashboard },
    { label: "Job Management", href: "/hr/jobs", icon: Briefcase },
  ];

  const isActive = (itemHref: string, exact?: boolean) => {
    if (exact || itemHref === "/") {
      return location.pathname === itemHref;
    }
    return location.pathname.startsWith(itemHref);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/60 font-sans text-slate-800 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo & Platform Info */}
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="group flex items-center gap-2.5 transition-transform hover:scale-[1.01]"
            >
              <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 text-white shadow-md shadow-indigo-500/20">
                <FileCheck2 className="size-5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                  TalentAI <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100/80">Recruit</span>
                </span>
                <span className="text-[11px] font-medium text-slate-400">
                  AI-Assisted Recruitment & Screening
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5 ml-4 pl-4 border-l border-slate-200">
              {navItems.map((item) => {
                const active = isActive(item.href, item.exact);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                      active
                        ? "bg-indigo-50 text-indigo-700 shadow-xs border border-indigo-100"
                        : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                    }`}
                  >
                    <Icon className={`size-3.5 ${active ? "text-indigo-600" : "text-slate-400"}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-2.5 py-1 text-[11px] font-medium text-emerald-700 shadow-2xs">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
              </span>
              AI Screening Active
            </div>

            <Link
              to="/apply"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 transition-all hover:shadow-md"
            >
              <UserPlus className="size-3.5" />
              <span>Apply Now</span>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden border-t border-slate-100 px-4 py-2 overflow-x-auto gap-2 bg-slate-50/50">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium ${
                  active
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:bg-slate-200/60"
                }`}
              >
                <Icon className="size-3" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white/70 py-6 text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">TalentAI Recruitment Platform</span>
            <span className="text-slate-300">·</span>
            <span>Human-in-the-Loop Screening Engine</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1 text-[11px]">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              Supabase Storage & Azure AI Document Intelligence
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}