"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { buttonClass, ghostButtonClass, inputClass, PageHeader, Panel } from "@/components/ui";

export default function SettingsPage() {
  const { session, workspace, launchDate, setLaunchDate, resetTemplate, signOut } = useStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetState, setResetState] = useState<"idle" | "busy" | "done">("idle");

  async function doReset() {
    setResetState("busy");
    await resetTemplate();
    setConfirmReset(false);
    setResetState("done");
  }

  return (
    <>
      <PageHeader title="Settings" subtitle={workspace.name} />
      <Panel title="Launch date">
        <div className="grid max-w-sm gap-2">
          <input id="launch-date" type="date" className={inputClass} value={launchDate} onChange={(e) => setLaunchDate(e.target.value)} />
          <p className="text-xs text-muted">The countdown uses this date. To shift every task&apos;s due date to match, reset the template below.</p>
        </div>
      </Panel>
      <Panel title="Fluoride-free launch template">
        <div className="grid gap-3">
          <p className="max-w-prose text-sm text-muted">
            Replaces all tasks with the 37-task, 9-phase starter plan, with due dates counted back from your launch date. Tasks you added or edited will be lost.
          </p>
          {confirmReset ? (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              Replace all tasks?
              <button className={buttonClass} onClick={doReset} disabled={resetState === "busy"}>
                {resetState === "busy" ? "Replacing…" : "Replace tasks"}
              </button>
              <button className={ghostButtonClass} onClick={() => setConfirmReset(false)}>Cancel</button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button className={ghostButtonClass} onClick={() => { setConfirmReset(true); setResetState("idle"); }}>Reset to template</button>
              {resetState === "done" && <span className="text-sm text-ok">Template restored.</span>}
            </div>
          )}
        </div>
      </Panel>
      <Panel title="Account">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">Signed in as <span className="text-fg">{session.user.email}</span>. Your tasks are saved to your account.</p>
          <button className={ghostButtonClass} onClick={signOut}>Sign out</button>
        </div>
      </Panel>
    </>
  );
}
