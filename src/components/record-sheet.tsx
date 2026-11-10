"use client";

import { useEffect, useState } from "react";
import { Trash2, X } from "lucide-react";
import { buttonClass, ghostButtonClass, inputClass } from "./ui";

export type Field = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "select" | "date" | "number" | "url";
  options?: Record<string, string>;
  required?: boolean;
  placeholder?: string;
  half?: boolean;
};

type Values = Record<string, string | number | null>;

/** A side panel form for adding or editing any record, driven by a field list. */
export function RecordSheet({
  title,
  fields,
  initial,
  onSave,
  onDelete,
  onClose,
}: {
  title: string;
  fields: Field[];
  initial: Values;
  onSave: (values: Values) => void | Promise<void>;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [values, setValues] = useState<Values>(initial);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    // Empty inputs are stored as null; number fields become numbers.
    const clean: Values = {};
    for (const f of fields) {
      const v = values[f.key];
      if (v === "" || v === undefined || v === null) clean[f.key] = null;
      else if (f.type === "number") clean[f.key] = Number(v);
      else clean[f.key] = typeof v === "string" ? v.trim() : v;
    }
    await onSave(clean);
    setBusy(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-black/30" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col gap-4 overflow-y-auto border-l border-line bg-surface p-5 shadow-xl"
        aria-label={title}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-muted hover:text-fg" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {fields.map((f) => {
            const id = `rec-${f.key}`;
            const value = values[f.key] ?? "";
            const set = (v: string) => setValues((s) => ({ ...s, [f.key]: v }));
            const span = f.half ? "" : "col-span-2";
            return (
              <label key={f.key} className={`grid gap-1 text-sm ${span}`}>
                <span className="text-muted">{f.label}</span>
                {f.type === "textarea" ? (
                  <textarea id={id} rows={4} className={inputClass} value={value} placeholder={f.placeholder} onChange={(e) => set(e.target.value)} />
                ) : f.type === "select" ? (
                  <select id={id} className={inputClass} value={value} onChange={(e) => set(e.target.value)}>
                    {Object.entries(f.options ?? {}).map(([k, label]) => (
                      <option key={k} value={k}>{label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={id}
                    type={f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "url" ? "url" : "text"}
                    step={f.type === "number" ? "any" : undefined}
                    min={f.type === "number" ? 0 : undefined}
                    required={f.required}
                    className={inputClass}
                    value={value}
                    placeholder={f.placeholder}
                    onChange={(e) => set(e.target.value)}
                  />
                )}
              </label>
            );
          })}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          {onDelete ? (
            confirmDelete ? (
              <span className="flex items-center gap-2 text-sm">
                Delete?
                <button type="button" className="font-semibold text-bad" onClick={() => { onDelete(); onClose(); }}>Delete</button>
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
            <button type="submit" className={buttonClass} disabled={busy}>{busy ? "Saving…" : "Save"}</button>
          </div>
        </div>
      </form>
    </div>
  );
}
