"use client";

import { Plus } from "lucide-react";
import { addDays, daysBetween, formatDate, isOverdue, PHASES, todayISO } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useTaskPanel } from "@/components/task-panel";
import { buttonClass, PageHeader, Panel, PhasePill, Pill, ProgressBar } from "@/components/ui";

export default function HomePage() {
  const { tasks, launchDate } = useStore();
  const { openNew, openTask } = useTaskPanel();
  const today = todayISO();

  const done = tasks.filter((t) => t.status === "done").length;
  const pct = tasks.length ? (done / tasks.length) * 100 : 0;
  const dDay = daysBetween(today, launchDate);
  const overdue = tasks.filter((t) => isOverdue(t, today)).sort((a, b) => a.due.localeCompare(b.due));
  const weekEndIso = addDays(today, 7);
  const dueSoon = tasks
    .filter((t) => t.status !== "done" && t.due >= today && t.due <= weekEndIso)
    .sort((a, b) => a.due.localeCompare(b.due));
  const nextUp = tasks
    .filter((t) => t.status !== "done" && t.due >= today && t.priority === "p1")
    .sort((a, b) => a.due.localeCompare(b.due))[0];

  return (
    <>
      <PageHeader title="Launch overview" subtitle={`Launch day: ${new Date(launchDate + "T00:00:00").toLocaleDateString(undefined, { dateStyle: "long" })}`}>
        <button className={buttonClass} onClick={() => openNew()}>
          <Plus className="size-4" /> New task <kbd className="ml-1 rounded border border-accent-fg/40 px-1 font-mono text-[10px]">C</kbd>
        </button>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="grid gap-1.5 rounded-xl border border-line bg-surface p-4">
          <span className="text-xs text-muted">Countdown</span>
          <span className="text-3xl font-semibold tabular-nums">{dDay >= 0 ? `D-${dDay}` : `D+${-dDay}`}</span>
          <ProgressBar value={pct} />
          <span className="text-xs text-muted">{done} of {tasks.length} tasks done ({Math.round(pct)}%)</span>
        </div>
        <div className="grid gap-1.5 rounded-xl border border-line bg-surface p-4">
          <span className="text-xs text-muted">Overdue</span>
          <span className={`text-3xl font-semibold tabular-nums ${overdue.length ? "text-bad" : ""}`}>{overdue.length}</span>
          <span className="text-xs text-muted">{overdue.length ? "Needs attention" : "Nothing late. Nice."}</span>
        </div>
        <div className="grid gap-1.5 rounded-xl border border-line bg-surface p-4">
          <span className="text-xs text-muted">Next urgent task</span>
          {nextUp ? (
            <button onClick={() => openTask(nextUp.id)} className="text-left text-base leading-snug font-semibold hover:text-accent">{nextUp.title}</button>
          ) : (
            <span className="text-base font-semibold">None</span>
          )}
          {nextUp && (
            <span className="text-xs text-muted">
              {formatDate(nextUp.due)} · {nextUp.due === today ? "today" : `in ${daysBetween(today, nextUp.due)} days`}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Phase progress" aside="9 phases">
          <div className="grid gap-2.5">
            {PHASES.map((p) => {
              const inPhase = tasks.filter((t) => t.phaseId === p.id);
              const d = inPhase.filter((t) => t.status === "done").length;
              const v = inPhase.length ? (d / inPhase.length) * 100 : 0;
              return (
                <div key={p.id} className="grid grid-cols-[minmax(0,10rem)_1fr_3rem] items-center gap-3 text-sm">
                  <span className="truncate"><span className="font-mono text-xs text-accent">{p.code}</span> {p.name}</span>
                  <ProgressBar value={v} />
                  <span className="text-right font-mono text-xs text-muted tabular-nums">{d}/{inPhase.length}</span>
                </div>
              );
            })}
          </div>
        </Panel>

        <div className="grid content-start gap-4">
          {overdue.length > 0 && (
            <Panel title="Overdue" aside={String(overdue.length)}>
              <TaskRows ids={overdue.slice(0, 6).map((t) => t.id)} />
            </Panel>
          )}
          <Panel title="Due in the next 7 days" aside={String(dueSoon.length)}>
            {dueSoon.length ? (
              <TaskRows ids={dueSoon.slice(0, 8).map((t) => t.id)} />
            ) : (
              <p className="text-sm text-muted">Nothing due this week. Press <kbd className="font-mono">C</kbd> to add a task.</p>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}

function TaskRows({ ids }: { ids: string[] }) {
  const { tasks } = useStore();
  const { openTask } = useTaskPanel();
  const today = todayISO();
  return (
    <ul className="divide-y divide-dashed divide-line">
      {ids.map((id) => {
        const t = tasks.find((x) => x.id === id);
        if (!t) return null;
        return (
          <li key={id}>
            <button onClick={() => openTask(id)} className="flex w-full items-center gap-2 py-2 text-left text-sm hover:text-accent">
              <PhasePill phaseId={t.phaseId} />
              <span className="min-w-0 flex-1 truncate">{t.title}</span>
              {isOverdue(t, today) && <Pill tone="bad">late</Pill>}
              <span className="font-mono text-xs whitespace-nowrap text-muted">{formatDate(t.due)}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
