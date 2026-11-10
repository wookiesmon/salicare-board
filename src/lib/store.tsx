"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { buildTemplate, type Status, type Task } from "./data";
import { supabase } from "./supabase";

// Tasks saved by the first, browser-only version of the app. Offered as an import on first setup.
export const LEGACY_STORAGE_KEY = "salicare-board:v1";

export type Workspace = { id: string; name: string; launchDate: string };

type TaskRow = {
  id: string;
  title: string;
  phase_id: string;
  status: Status;
  priority: Task["priority"];
  due: string;
  notes: string | null;
  doc_url: string | null;
};

const fromRow = (r: TaskRow): Task => ({
  id: r.id,
  title: r.title,
  phaseId: r.phase_id,
  status: r.status,
  priority: r.priority,
  due: r.due,
  notes: r.notes ?? undefined,
  docUrl: r.doc_url ?? undefined,
});

const toRow = (t: Partial<Task>) => {
  const row: Record<string, unknown> = {};
  if (t.title !== undefined) row.title = t.title;
  if (t.phaseId !== undefined) row.phase_id = t.phaseId;
  if (t.status !== undefined) row.status = t.status;
  if (t.priority !== undefined) row.priority = t.priority;
  if (t.due !== undefined) row.due = t.due;
  if ("notes" in t) row.notes = t.notes || null;
  if ("docUrl" in t) row.doc_url = t.docUrl || null;
  return row;
};

type Store = {
  session: Session;
  workspace: Workspace;
  launchDate: string;
  tasks: Task[];
  error: string | null;
  clearError: () => void;
  reportError: (what: string, message: string) => void;
  addTask: (t: Omit<Task, "id">) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  moveTask: (id: string, status: Status) => void;
  deleteTask: (id: string) => void;
  setLaunchDate: (iso: string) => void;
  resetTemplate: () => Promise<void>;
  signOut: () => void;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({
  session,
  workspace: initialWorkspace,
  children,
}: {
  session: Session;
  workspace: Workspace;
  children: React.ReactNode;
}) {
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const wsId = workspace.id;

  const fail = useCallback((what: string, message: string) => {
    setError(`Couldn't ${what}: ${message}. Your change may not be saved. Reload the page to see the latest data.`);
  }, []);

  const loadTasks = useCallback(async () => {
    const { data, error } = await supabase.from("tasks").select("*").eq("workspace_id", wsId).order("due");
    if (error) fail("load tasks", error.message);
    else setTasks((data as TaskRow[]).map(fromRow));
  }, [wsId, fail]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    loadTasks();
  }, [loadTasks]);

  // Changes are applied on screen immediately, then saved; errors show a banner.
  const addTask = useCallback(
    (t: Omit<Task, "id">) => {
      const task = { ...t, id: crypto.randomUUID() };
      setTasks((s) => [...s, task]);
      supabase
        .from("tasks")
        .insert({ id: task.id, workspace_id: wsId, ...toRow(task) })
        .then(({ error }) => error && fail("add the task", error.message));
    },
    [wsId, fail],
  );

  const updateTask = useCallback(
    (id: string, patch: Partial<Task>) => {
      setTasks((s) => s.map((t) => (t.id === id ? { ...t, ...patch } : t)));
      supabase
        .from("tasks")
        .update(toRow(patch))
        .eq("id", id)
        .then(({ error }) => error && fail("save the task", error.message));
    },
    [fail],
  );

  const moveTask = useCallback((id: string, status: Status) => updateTask(id, { status }), [updateTask]);

  const deleteTask = useCallback(
    (id: string) => {
      setTasks((s) => s.filter((t) => t.id !== id));
      supabase
        .from("tasks")
        .delete()
        .eq("id", id)
        .then(({ error }) => error && fail("delete the task", error.message));
    },
    [fail],
  );

  const setLaunchDate = useCallback(
    (iso: string) => {
      if (!iso) return;
      setWorkspace((w) => ({ ...w, launchDate: iso }));
      supabase
        .from("workspaces")
        .update({ launch_date: iso })
        .eq("id", wsId)
        .then(({ error }) => error && fail("save the launch date", error.message));
    },
    [wsId, fail],
  );

  const resetTemplate = useCallback(async () => {
    const fresh = buildTemplate(workspace.launchDate);
    const del = await supabase.from("tasks").delete().eq("workspace_id", wsId);
    if (del.error) return fail("reset tasks", del.error.message);
    const ins = await supabase.from("tasks").insert(fresh.map((t) => ({ id: t.id, workspace_id: wsId, ...toRow(t) })));
    if (ins.error) return fail("reset tasks", ins.error.message);
    setTasks(fresh);
  }, [wsId, workspace.launchDate, fail]);

  const signOut = useCallback(() => {
    supabase.auth.signOut();
  }, []);

  return (
    <StoreContext.Provider
      value={{
        session,
        workspace,
        launchDate: workspace.launchDate,
        tasks,
        error,
        clearError: () => setError(null),
        reportError: fail,
        addTask,
        updateTask,
        moveTask,
        deleteTask,
        setLaunchDate,
        resetTemplate,
        signOut,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

/** Creates a workspace with the given tasks (template or imported). */
export async function createWorkspace(name: string, launchDate: string, tasks: Task[]): Promise<string | null> {
  const { data: id, error } = await supabase.rpc("create_workspace", { ws_name: name, ws_launch_date: launchDate });
  if (error) return error.message;
  const ins = await supabase.from("tasks").insert(tasks.map((t) => ({ id: t.id, workspace_id: id, ...toRow(t) })));
  return ins.error?.message ?? null;
}
