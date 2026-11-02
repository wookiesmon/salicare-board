"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { buttonClass, ghostButtonClass, inputClass, PageHeader, Panel } from "@/components/ui";

export default function SettingsPage() {
  const { launchDate, setLaunchDate, resetTemplate } = useStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <>
      <PageHeader title="Settings" />
      <Panel title="Launch date">
        <div className="grid max-w-sm gap-2">
          <input id="launch-date" type="date" className={inputClass} value={launchDate} onChange={(e) => setLaunchDate(e.target.value)} />
          <p className="text-xs text-muted">The countdown uses this date. To shift every task&apos;s due date to match, reset the template below.</p>
        </div>
      </Panel>
      <Panel title="Toothpaste launch template">
        <div className="grid gap-3">
          <p className="max-w-prose text-sm text-muted">
            Replaces all tasks with the 36-task, 9-phase starter plan, with due dates counted back from your launch date. Tasks you added or edited will be lost.
          </p>
          {confirmReset ? (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              Replace all tasks?
              <button className={buttonClass} onClick={() => { resetTemplate(); setConfirmReset(false); setDone(true); }}>Replace tasks</button>
              <button className={ghostButtonClass} onClick={() => setConfirmReset(false)}>Cancel</button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button className={ghostButtonClass} onClick={() => { setConfirmReset(true); setDone(false); }}>Reset to template</button>
              {done && <span className="text-sm text-ok">Template restored.</span>}
            </div>
          )}
        </div>
      </Panel>
      <Panel title="Where your data is saved">
        <p className="max-w-prose text-sm text-muted">
          For now, tasks are saved in this browser only. The next step connects a Supabase database so your data syncs across devices and teammates can log in.
        </p>
      </Panel>
    </>
  );
}
