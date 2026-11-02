"use client";

import { addDays, formatDate, isOverdue, todayISO, type Task } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useTaskPanel } from "@/components/task-panel";
import { PageHeader, Panel, PhasePill, PriorityPill, StatusPill } from "@/components/ui";

export default function MyTasksPage() {
  const { tasks, updateTask } = useStore();
  const { openTask } = useTaskPanel();
  const today = todayISO();
  const weekEnd = addDays(today, 7);

  const open = tasks.filter((t) => t.status !== "done").sort((a, b) => a.due.localeCompare(b.due));
  const groups: { title: string; items: Task[] }[] = [
    { title: "Overdue", items: open.filter((t) => isOverdue(t, today)) },
    { title: "Today", items: open.filter((t) => t.due === today) },
    { title: "This week", items: open.filter((t) => t.due > today && t.due <= weekEnd) },
    { title: "Later", items: open.filter((t) => t.due > weekEnd) },
  ];

  return (
    <>
      <PageHeader title="My Tasks" subtitle={`${open.length} open tasks`} />
      {groups.map((g) =>
        g.items.length ? (
          <Panel key={g.title} title={g.title} aside={String(g.items.length)}>
            <ul className="divide-y divide-dashed divide-line">
              {g.items.map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-2 text-sm">
                  <input
                    id={`mine-${t.id}`}
                    type="checkbox"
                    aria-label={`Mark "${t.title}" done`}
                    className="size-4 accent-[var(--accent)]"
                    onChange={() => updateTask(t.id, { status: "done" })}
                  />
                  <PhasePill phaseId={t.phaseId} />
                  <button onClick={() => openTask(t.id)} className="min-w-0 flex-1 truncate text-left hover:text-accent">{t.title}</button>
                  <PriorityPill priority={t.priority} />
                  <span className="hidden sm:inline"><StatusPill status={t.status} /></span>
                  <span className="font-mono text-xs whitespace-nowrap text-muted">{formatDate(t.due)}</span>
                </li>
              ))}
            </ul>
          </Panel>
        ) : null,
      )}
      {open.length === 0 && <p className="text-sm text-muted">Everything is done. Time to launch.</p>}
    </>
  );
}
