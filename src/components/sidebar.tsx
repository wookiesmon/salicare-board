"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, CheckSquare, Columns3, FlaskConical, GanttChart, Home, List, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const MAIN = [
  { href: "/", label: "Home", icon: Home },
  { href: "/tasks", label: "My Tasks", icon: CheckSquare },
  { href: "/board", label: "Board", icon: Columns3 },
  { href: "/list", label: "List", icon: List },
];

const SOON = [
  { label: "Timeline", icon: GanttChart },
  { label: "Calendar", icon: CalendarDays },
  { label: "Records", icon: FlaskConical },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col gap-1 border-r border-line bg-sunk px-3 py-4 md:flex">
        <Link href="/" className="mb-4 flex items-center gap-2 px-2 text-[15px] font-semibold">
          <span className="size-5 rounded-md bg-gradient-to-br from-accent to-[#7fe0cf]" aria-hidden />
          Salicare
        </Link>
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

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
        {[...MAIN, { href: "/settings", label: "Settings", icon: Settings }].map(({ href, label, icon: Icon }) => {
          const on = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link key={href} href={href} className={cn("flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] text-muted", on && "text-accent")}>
              <Icon className="size-5" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
