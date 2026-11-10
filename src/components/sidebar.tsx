"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, CheckSquare, Columns3, Factory, GanttChart, Home, List, Plus, Settings, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTaskPanel } from "./task-panel";

const MAIN = [
  { href: "/", label: "Home", icon: Home },
  { href: "/tasks", label: "My Tasks", icon: CheckSquare },
  { href: "/board", label: "Board", icon: Columns3 },
  { href: "/list", label: "List", icon: List },
];

const RECORDS = [
  { href: "/suppliers", label: "Suppliers", icon: Factory },
  { href: "/regulatory", label: "Regulatory", icon: ShieldCheck },
];

const SOON = [
  { label: "Timeline", icon: GanttChart },
  { label: "Calendar", icon: CalendarDays },
];

// The phone tab bar leaves out List to fit; it is reachable from the desktop sidebar.
const MOBILE = [MAIN[0], MAIN[1], MAIN[2], ...RECORDS, { href: "/settings", label: "Settings", icon: Settings }];

export function Sidebar() {
  const path = usePathname();
  const { openNew } = useTaskPanel();
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col gap-1 border-r border-line bg-sunk px-3 py-4 md:flex">
        <Link href="/" className="mb-4 flex items-center gap-2 px-2 text-[15px] font-semibold">
          <span className="size-5 rounded-md bg-gradient-to-br from-accent to-[#7fe0cf]" aria-hidden />
          Salicare
        </Link>
        <button
          onClick={() => openNew()}
          className="mb-3 flex items-center justify-between rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-fg hover:opacity-90"
        >
          <span className="flex items-center gap-2">
            <Plus className="size-4" aria-hidden /> New task
          </span>
          <kbd className="rounded border border-accent-fg/40 px-1 font-mono text-[10px]">C</kbd>
        </button>
        {MAIN.map(({ href, label, icon: Icon }) => {
          const on = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-muted hover:text-fg",
                on && "border border-line bg-surface font-semibold text-fg",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </Link>
          );
        })}
        <p className="mt-5 px-2 pb-1 font-mono text-[10.5px] tracking-widest text-muted uppercase">Records</p>
        {RECORDS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-muted hover:text-fg",
              path.startsWith(href) && "border border-line bg-surface font-semibold text-fg",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        ))}
        <p className="mt-5 px-2 pb-1 font-mono text-[10.5px] tracking-widest text-muted uppercase">Coming next</p>
        {SOON.map(({ label, icon: Icon }) => (
          <span key={label} className="flex items-center gap-2.5 px-2 py-1.5 text-sm text-muted/70">
            <Icon className="size-4" aria-hidden />
            {label}
          </span>
        ))}
        <Link
          href="/settings"
          className={cn(
            "mt-auto flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-muted hover:text-fg",
            path.startsWith("/settings") && "border border-line bg-surface font-semibold text-fg",
          )}
        >
          <Settings className="size-4" aria-hidden />
          Settings
        </Link>
      </aside>

      {/* Mobile: floating add button above the tab bar */}
      <button
        onClick={() => openNew()}
        aria-label="New task"
        className="fixed right-[max(16px,env(safe-area-inset-right))] bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 flex size-14 items-center justify-center rounded-full bg-accent text-accent-fg shadow-lg md:hidden"
      >
        <Plus className="size-6" aria-hidden />
      </button>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
        {MOBILE.map(({ href, label, icon: Icon }) => {
          const on = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link key={href} href={href} className={cn("flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[10.5px] text-muted", on && "text-accent")}>
              <Icon className="size-5" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
