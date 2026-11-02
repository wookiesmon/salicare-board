"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { buildTemplate, DEFAULT_LAUNCH_DATE, type Status, type Task } from "./data";

// Data lives in this browser's localStorage until Supabase is connected (step 3).
const STORAGE_KEY = "salicare-board:v1";

type State = { launchDate: string; tasks: Task[] };

type Store = State & {
  ready: boolean;
  addTask: (t: Omit<Task, "id">) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  moveTask: (id: string, status: Status) => void;
  deleteTask: (id: string) => void;
  setLaunchDate: (iso: string) => void;
  resetTemplate: () => void;
};

const StoreContext = createContext<Store | null>(null);

function initialState(): State {
  return { launchDate: DEFAULT_LAUNCH_DATE, tasks: buildTemplate(DEFAULT_LAUNCH_DATE) };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from storage
      if (raw) setState(JSON.parse(raw));
    } catch {
      // Storage unavailable or corrupt: keep the template.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota or privacy-mode errors.
    }
  }, [state, ready]);

  const addTask = useCallback((t: Omit<Task, "id">) => {
    setState((s) => ({ ...s, tasks: [...s.tasks, { ...t, id: crypto.randomUUID() }] }));
  }, []);

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setState((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  }, []);

  const moveTask = useCallback((id: string, status: Status) => updateTask(id, { status }), [updateTask]);

  const deleteTask = useCallback((id: string) => {
    setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
  }, []);

  const setLaunchDate = useCallback((iso: string) => {
    setState((s) => ({ ...s, launchDate: iso }));
  }, []);

  const resetTemplate = useCallback(() => {
    setState((s) => ({ ...s, tasks: buildTemplate(s.launchDate) }));
  }, []);

  return (
    <StoreContext.Provider
      value={{ ...state, ready, addTask, updateTask, moveTask, deleteTask, setLaunchDate, resetTemplate }}
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
