"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { buildTemplate, DEFAULT_LAUNCH_DATE, type Task } from "@/lib/data";
import { createWorkspace, LEGACY_STORAGE_KEY, StoreProvider, useStore, type Workspace } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { Sidebar } from "./sidebar";
import { TaskPanelProvider } from "./task-panel";
import { buttonClass, ghostButtonClass, inputClass } from "./ui";

type Phase = { kind: "loading" } | { kind: "signed-out" } | { kind: "no-workspace"; session: Session } | { kind: "ready"; session: Session; workspace: Workspace };

/** Shows the login screen, then first-time setup, then the app. */
export function AppGate({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });

  const resolve = useCallback(async (session: Session | null) => {
    if (!session) return setPhase({ kind: "signed-out" });
    const { data } = await supabase.from("workspaces").select("id, name, launch_date").order("created_at").limit(1);
    const ws = data?.[0];
    setPhase(
      ws
        ? { kind: "ready", session, workspace: { id: ws.id, name: ws.name, launchDate: ws.launch_date } }
        : { kind: "no-workspace", session },
    );
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => resolve(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") resolve(session);
    });
    return () => sub.subscription.unsubscribe();
  }, [resolve]);

  if (phase.kind === "loading") return <CenterCard><p className="text-sm text-muted">Loading…</p></CenterCard>;
  if (phase.kind === "signed-out") return <LoginScreen />;
  if (phase.kind === "no-workspace") return <SetupScreen session={phase.session} onDone={() => resolve(phase.session)} />;

  return (
    <StoreProvider key={phase.workspace.id} session={phase.session} workspace={phase.workspace}>
      <TaskPanelProvider>
        <div className="flex min-h-dvh">
          <Sidebar />
          <main className="min-w-0 flex-1 px-4 pt-6 pb-24 md:px-8 md:pb-10">
            <div className="mx-auto grid max-w-6xl gap-6">
              <ErrorBanner />
              {children}
            </div>
          </main>
        </div>
      </TaskPanelProvider>
    </StoreProvider>
  );
}

function ErrorBanner() {
  const { error, clearError } = useStore();
  if (!error) return null;
  return (
    <div role="alert" className="flex items-start justify-between gap-3 rounded-lg border border-bad bg-bad-soft px-4 py-3 text-sm text-bad">
      <span>{error}</span>
      <button className="font-semibold" onClick={clearError}>Dismiss</button>
    </div>
  );
}

function CenterCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-sm gap-5 rounded-2xl border border-line bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-2 text-[15px] font-semibold">
          <span className="size-5 rounded-md bg-gradient-to-br from-accent to-[#7fe0cf]" aria-hidden />
          Salicare Launch Board
        </div>
        {children}
      </div>
    </div>
  );
}

function LoginScreen() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "bad" | "ok"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage({ tone: "bad", text: error.message === "Email not confirmed" ? "Confirm your email first: open the link we sent you, then sign in." : error.message });
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
      if (error) setMessage({ tone: "bad", text: error.message });
      else if (!data.session) setMessage({ tone: "ok", text: `Check ${email} for a confirmation link, then come back and sign in.` });
    }
    setBusy(false);
  }

  return (
    <CenterCard>
      <div>
        <h1 className="text-xl font-semibold">{mode === "in" ? "Sign in" : "Create your account"}</h1>
        <p className="mt-1 text-sm text-muted">Your launch plan is saved to your account and syncs across devices.</p>
      </div>
      <form onSubmit={submit} className="grid gap-3">
        <label className="grid gap-1 text-sm">
          <span className="text-muted">Email</span>
          <input id="login-email" type="email" autoComplete="email" required className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-muted">Password</span>
          <input id="login-password" type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} minLength={8} required className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
          {mode === "up" && <span className="text-xs text-muted">At least 8 characters.</span>}
        </label>
        {message && <p className={message.tone === "bad" ? "text-sm text-bad" : "text-sm text-ok"}>{message.text}</p>}
        <button type="submit" className={`${buttonClass} justify-center py-2`} disabled={busy}>
          {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
        </button>
      </form>
      <button className="text-sm text-accent" onClick={() => { setMode(mode === "in" ? "up" : "in"); setMessage(null); }}>
        {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>
    </CenterCard>
  );
}

function readLegacyTasks(): { launchDate: string; tasks: Task[] } | null {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { launchDate: string; tasks: Task[] };
    if (!Array.isArray(parsed.tasks) || parsed.tasks.length === 0) return null;
    return { launchDate: parsed.launchDate, tasks: parsed.tasks.map((t) => ({ ...t, id: crypto.randomUUID() })) };
  } catch {
    return null;
  }
}

function SetupScreen({ session, onDone }: { session: Session; onDone: () => void }) {
  const [legacy] = useState(readLegacyTasks);
  const [name, setName] = useState("Salicare launch");
  const [launchDate, setLaunchDate] = useState(legacy?.launchDate ?? DEFAULT_LAUNCH_DATE);
  const [source, setSource] = useState<"template" | "import">("template");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const tasks = source === "import" && legacy ? legacy.tasks : buildTemplate(launchDate);
    const err = await createWorkspace(name.trim(), launchDate, tasks);
    setBusy(false);
    if (err) return setError(err);
    if (source === "import") {
      try { localStorage.removeItem(LEGACY_STORAGE_KEY); } catch { /* ignore */ }
    }
    onDone();
  }

  return (
    <CenterCard>
      <div>
        <h1 className="text-xl font-semibold">Set up your launch</h1>
        <p className="mt-1 text-sm text-muted">Signed in as {session.user.email}</p>
      </div>
      <form onSubmit={submit} className="grid gap-3">
        <label className="grid gap-1 text-sm">
          <span className="text-muted">Launch name</span>
          <input id="setup-name" required maxLength={120} className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-muted">Target launch date</span>
          <input id="setup-date" type="date" required className={inputClass} value={launchDate} onChange={(e) => setLaunchDate(e.target.value)} />
        </label>
        <fieldset className="grid gap-2 text-sm">
          <legend className="mb-1 text-muted">Starting tasks</legend>
          <label className="flex items-start gap-2">
            <input type="radio" name="source" id="setup-template" className="mt-1 accent-[var(--accent)]" checked={source === "template"} onChange={() => setSource("template")} />
            <span>Fluoride-free toothpaste launch plan<br /><span className="text-xs text-muted">37 tasks in 9 phases, dated back from your launch day</span></span>
          </label>
          {legacy && (
            <label className="flex items-start gap-2">
              <input type="radio" name="source" id="setup-import" className="mt-1 accent-[var(--accent)]" checked={source === "import"} onChange={() => setSource("import")} />
              <span>Import {legacy.tasks.length} tasks saved in this browser<br /><span className="text-xs text-muted">From the earlier version of the app</span></span>
            </label>
          )}
        </fieldset>
        {error && <p className="text-sm text-bad">{error}</p>}
        <button type="submit" className={`${buttonClass} justify-center py-2`} disabled={busy}>{busy ? "Creating…" : "Create launch plan"}</button>
      </form>
      <button className={ghostButtonClass} onClick={() => supabase.auth.signOut()}>Sign out</button>
    </CenterCard>
  );
}
