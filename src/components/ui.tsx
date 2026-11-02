import { cn } from "@/lib/utils";
import { isOverdue, phaseOf, PRIORITY_LABEL, STATUSES, type Priority, type Status, type Task } from "@/lib/data";

type Tone = "accent" | "ok" | "warn" | "bad" | "info" | "muted";

const TONE: Record<Tone, string> = {
  accent: "bg-accent-soft text-accent",
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
  info: "bg-info-soft text-info",
  muted: "bg-sunk text-muted",
};

export function Pill({ tone = "muted", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-px font-mono text-[11px] whitespace-nowrap", TONE[tone], className)}>
      {children}
    </span>
  );
}

const STATUS_TONE: Record<Status, Tone> = { todo: "muted", doing: "info", waiting: "warn", done: "ok" };
const PRIORITY_TONE: Record<Priority, Tone> = { p1: "bad", p2: "muted", p3: "muted" };

export function StatusPill({ status }: { status: Status }) {
  return <Pill tone={STATUS_TONE[status]}>{STATUSES.find((s) => s.id === status)?.label}</Pill>;
}

export function PriorityPill({ priority }: { priority: Priority }) {
  if (priority === "p2") return null;
  return <Pill tone={PRIORITY_TONE[priority]}>{PRIORITY_LABEL[priority]}</Pill>;
}

export function PhasePill({ phaseId }: { phaseId: string }) {
  const p = phaseOf(phaseId);
  return <Pill tone="accent" className="font-medium">{p.code}</Pill>;
}

export function OverduePill({ task }: { task: Task }) {
  return isOverdue(task) ? <Pill tone="bad">Overdue</Pill> : null;
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-sunk" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Panel({ title, aside, children, className }: { title: string; aside?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("min-w-0 rounded-xl border border-line bg-surface p-4", className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {aside && <span className="text-xs text-muted">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

export const inputClass =
  "w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none";

export const buttonClass =
  "inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-accent-fg hover:opacity-90 disabled:opacity-50";

export const ghostButtonClass =
  "inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-fg hover:border-accent hover:text-accent";
