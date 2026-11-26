import { Link, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  UserPlus,
  Briefcase,
  Sparkles,
  FileCheck2,
  LogOut,
  LogIn,
  User,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Layout() {
  const location = useLocation();
  const { user, signOut, isAuthenticated } = useAuth();

  const navItems = [
    { label: "Overview", href: "/", icon: Sparkles, exact: true },
    ...(isAuthenticated
      ? [
        { label: "HR Dashboard", href: "/hr", icon: LayoutDashboard },
        { label: "Job Management", href: "/hr/jobs", icon: Briefcase },
      ]
      : []),
  ];

  const isActive = (itemHref: string, exact?: boolean) => {
    if (exact || itemHref === "/") {
      return location.pathname === itemHref;
    }
    return location.pathname.startsWith(itemHref);
  };

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50/70 font-sans text-neutral-900 antialiased selection:bg-neutral-950 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-neutral-200/90 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Platform Info */}
          <div className="flex items-center gap-6">
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
                    Recruit
                  </span>
                </div>
                <span className="text-[11px] text-neutral-500">
                  AI-Assisted Recruitment & Screening
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 border-l border-neutral-200 pl-6">
              {navItems.map((item) => {
                const active = isActive(item.href, item.exact);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                      active
                        ? "bg-neutral-100 text-neutral-950 font-semibold"
                        : "text-neutral-500 hover:bg-neutral-100/70 hover:text-neutral-950"
                    )}
                  >
                    <Icon className={cn("size-3.5", active ? "text-neutral-950" : "text-neutral-400")} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2.5">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs text-neutral-600">
                  <User className="size-3.5 text-neutral-500" />
                  <span className="font-medium text-neutral-800 max-w-[160px] truncate">{user}</span>
                </span>
                <button
                  onClick={signOut}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  <LogOut className="size-3.5" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                <LogIn className="size-3.5" />
                <span className="hidden sm:inline">HR Login</span>
              </Link>
            )}

            <Link
              to="/apply"
              className={cn(buttonVariants({ variant: "default", size: "sm" }))}
            >
              <UserPlus className="size-3.5" />
              <span>Apply Now</span>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden border-t border-neutral-200/80 px-4 py-2 overflow-x-auto gap-1.5 bg-neutral-50">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  active
                    ? "bg-neutral-950 text-white"
                    : "text-neutral-600 hover:bg-neutral-200/60"
                )}
              >
                <Icon className="size-3" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-200 bg-white py-5 text-xs text-neutral-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-900">TalentAI Recruitment Platform</span>
            <span className="text-neutral-300">·</span>
            <span>Human-in-the-Loop Screening Engine</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-neutral-400">
            <FileCheck2 className="size-3.5 text-neutral-500" />
            <span>Supabase Storage & OpenAI Extraction</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
