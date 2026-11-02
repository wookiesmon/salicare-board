"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ExternalLink, Trash2, X } from "lucide-react";
import { PHASES, PRIORITY_LABEL, STATUSES, todayISO, type Priority, type Status, type Task } from "@/lib/data";
import { useStore } from "@/lib/store";
import { buttonClass, ghostButtonClass, inputClass } from "./ui";

type PanelState = { mode: "closed" } | { mode: "new"; defaults?: Partial<Task> } | { mode: "edit"; id: string };

type PanelApi = {
  openNew: (defaults?: Partial<Task>) => void;
  openTask: (id: string) => void;
};

const PanelContext = createContext<PanelApi | null>(null);

export function useTaskPanel(): PanelApi {
  const ctx = useContext(PanelContext);
  if (!ctx) throw new Error("useTaskPanel must be used inside TaskPanelProvider");
  return ctx;
}

export function TaskPanelProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PanelState>({ mode: "closed" });
  const openNew = useCallback((defaults?: Partial<Task>) => setState({ mode: "new", defaults }), []);
  const openTask = useCallback((id: string) => setState({ mode: "edit", id }), []);
  const close = useCallback(() => setState({ mode: "closed" }), []);

  // "C" opens quick-add from anywhere, like Linear.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "Escape") close();
      if ((e.key === "c" || e.key === "C") && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        openNew();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openNew, close]);

  return (
    <PanelContext.Provider value={{ openNew, openTask }}>
      {children}
      {state.mode !== "closed" && (
        <TaskSheet key={state.mode === "edit" ? state.id : "new"} state={state} onClose={close} />
      )}
    </PanelContext.Provider>
  );
}

function TaskSheet({ state, onClose }: { state: Exclude<PanelState, { mode: "closed" }>; onClose: () => void }) {
  const { tasks, addTask, updateTask, deleteTask } = useStore();
  const existing = state.mode === "edit" ? tasks.find((t) => t.id === state.id) : undefined;
  const defaults = state.mode === "new" ? state.defaults : undefined;

  const [draft, setDraft] = useState<Omit<Task, "id">>(() => ({
    title: existing?.title ?? defaults?.title ?? "",
    phaseId: existing?.phaseId ?? defaults?.phaseId ?? PHASES[0].id,
    status: existing?.status ?? defaults?.status ?? "todo",
    priority: existing?.priority ?? defaults?.priority ?? "p2",
    due: existing?.due ?? defaults?.due ?? todayISO(),
    notes: existing?.notes ?? "",
    docUrl: existing?.docUrl ?? "",
  }));
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = <K extends keyof typeof draft>(k: K, v: (typeof draft)[K]) => setDraft((d) => ({ ...d, [k]: v }));

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.title.trim()) return;
    const clean = { ...draft, title: draft.title.trim(), docUrl: draft.docUrl?.trim() || undefined };
    if (existing) updateTask(existing.id, clean);
    else addTask(clean);
    onClose();
  }

  const previewUrl = draft.docUrl?.includes("docs.google.com") ? draft.docUrl.replace(/\/edit.*$/, "/preview") : undefined;

  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-black/30" onClick={onClose}>
      <form
        onSubmit={save}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col gap-4 overflow-y-auto border-l border-line bg-surface p-5 shadow-xl"
        aria-label={existing ? "Edit task" : "New task"}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">{existing ? "Edit task" : "New task"}</h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-muted hover:text-fg" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>

        <label className="grid gap-1 text-sm">
          <span className="text-muted">Title</span>
          <input id="task-title" autoFocus className={inputClass} value={draft.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Ask Lab A for fluoride assay results" required />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1 text-sm">
            <span className="text-muted">Phase</span>
            <select id="task-phase" className={inputClass} value={draft.phaseId} onChange={(e) => set("phaseId", e.target.value)}>
              {PHASES.map((p) => (
                <option key={p.id} value={p.id}>{p.code} · {p.name}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted">Status</span>
            <select id="task-status" className={inputClass} value={draft.status} onChange={(e) => set("status", e.target.value as Status)}>
              {STATUSES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted">Priority</span>
            <select id="task-priority" className={inputClass} value={draft.priority} onChange={(e) => set("priority", e.target.value as Priority)}>
              {(Object.keys(PRIORITY_LABEL) as Priority[]).map((p) => (
                <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted">Due date</span>
            <input id="task-due" type="date" className={inputClass} value={draft.due} onChange={(e) => set("due", e.target.value)} required />
          </label>
        </div>

        <label className="grid gap-1 text-sm">
          <span className="text-muted">Google Doc link</span>
          <input id="task-doc" type="url" className={inputClass} value={draft.docUrl} onChange={(e) => set("docUrl", e.target.value)} placeholder="https://docs.google.com/document/d/…" />
        </label>
        {draft.docUrl && (
          <div className="grid gap-2">
            <a href={draft.docUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-accent underline-offset-2 hover:underline">
              Open document <ExternalLink className="size-3.5" />
            </a>
            {previewUrl && (
              <iframe src={previewUrl} title="Document preview" className="h-56 w-full rounded-lg border border-line bg-bg" />
            )}
          </div>
        )}

        <label className="grid gap-1 text-sm">
          <span className="text-muted">Notes</span>
          <textarea id="task-notes" rows={4} className={inputClass} value={draft.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Supplier contact, quote numbers, decisions…" />
        </label>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          {existing ? (
            confirmDelete ? (
              <span className="flex items-center gap-2 text-sm">
                Delete this task?
                <button type="button" className="font-semibold text-bad" onClick={() => { deleteTask(existing.id); onClose(); }}>Delete</button>
                <button type="button" className="text-muted" onClick={() => setConfirmDelete(false)}>Keep</button>
              </span>
            ) : (
              <button type="button" className="inline-flex items-center gap-1 text-sm text-muted hover:text-bad" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="size-4" /> Delete
              </button>
            )
          ) : <span />}
          <div className="flex gap-2">
            <button type="button" className={ghostButtonClass} onClick={onClose}>Cancel</button>
            <button type="submit" className={buttonClass}>{existing ? "Save" : "Add task"}</button>
          </div>
        </div>
      </form>
    </div>
  );
}
