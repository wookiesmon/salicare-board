"use client";

import { useState } from "react";
import { ExternalLink, Plus } from "lucide-react";
import { formatDate, PHASES, STATUSES, type Status } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useTaskPanel } from "@/components/task-panel";
import { buttonClass, inputClass, OverduePill, PageHeader, PriorityPill, StatusPill } from "@/components/ui";
import { cn } from "@/lib/utils";

export default function ListPage() {
  const { tasks, updateTask } = useStore();
  const { openTask, openNew } = useTaskPanel();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "open" | Status>("open");

  const q = query.trim().toLowerCase();
  const filtered = tasks.filter(
    (t) =>
      (status === "all" || (status === "open" ? t.status !== "done" : t.status === status)) &&
      (!q || t.title.toLowerCase().includes(q) || t.notes?.toLowerCase().includes(q)),
  );

  return (
    <>
      <PageHeader title="List" subtitle={`${filtered.length} tasks, grouped by phase`}>
        <input id="list-search" aria-label="Search tasks" className={cn(inputClass, "w-48")} placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select id="list-status" aria-label="Filter by status" className={cn(inputClass, "w-auto")} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="open">Open tasks</option>
          <option value="all">All tasks</option>
          {STATUSES.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <button className={buttonClass} onClick={() => openNew()}>
          <Plus className="size-4" /> New task
        </button>
      </PageHeader>

      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="bg-sunk text-left font-mono text-[11px] tracking-wider text-muted uppercase">
              <th className="w-10 px-3 py-2 font-medium"><span className="sr-only">Done</span></th>
              <th className="px-3 py-2 font-medium">Task</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Due</th>
              <th className="px-3 py-2 font-medium">Doc</th>
            </tr>
          </thead>
          {PHASES.map((p) => {
            const rows = filtered.filter((t) => t.phaseId === p.id).sort((a, b) => a.due.localeCompare(b.due));
            if (!rows.length) return null;
            return (
              <tbody key={p.id} className="border-t border-line">
                <tr>
                  <td colSpan={5} className="px-3 pt-3 pb-1 text-xs font-semibold">
                    <span className="font-mono text-accent">{p.code}</span> {p.name} <span className="font-normal text-muted">· {rows.length}</span>
                  </td>
                </tr>
                {rows.map((t) => (
                  <tr key={t.id} className="hover:bg-sunk/60">
                    <td className="px-3 py-1.5">
                      <input
                        id={`done-${t.id}`}
                        type="checkbox"
                        aria-label={`Mark "${t.title}" done`}
                        className="size-4 accent-[var(--accent)]"
                        checked={t.status === "done"}
                        onChange={(e) => updateTask(t.id, { status: e.target.checked ? "done" : "todo" })}
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <button onClick={() => openTask(t.id)} className={cn("text-left hover:text-accent", t.status === "done" && "text-muted line-through")}>
                        {t.title}
                      </button>{" "}
                      <PriorityPill priority={t.priority} /> <OverduePill task={t} />
                    </td>
                    <td className="px-3 py-1.5"><StatusPill status={t.status} /></td>
                    <td className="px-3 py-1.5 font-mono text-xs whitespace-nowrap text-muted">{formatDate(t.due)}</td>
                    <td className="px-3 py-1.5">
                      {t.docUrl && (
                        <a href={t.docUrl} target="_blank" rel="noreferrer" className="text-accent" aria-label="Open linked document">
                          <ExternalLink className="size-4" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            );
          })}
        </table>
        {filtered.length === 0 && <p className="p-6 text-center text-sm text-muted">No tasks match. Try another filter.</p>}
      </div>
    </>
  );
}
