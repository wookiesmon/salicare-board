"use client";

import { useState } from "react";
import { ExternalLink, Plus } from "lucide-react";
import { daysBetween, formatDate, todayISO } from "@/lib/data";
import { REG_KINDS, REG_MARKETS, REG_STATUSES, useRecords, type RegulatoryItem } from "@/lib/records";
import { RecordSheet, type Field } from "@/components/record-sheet";
import { buttonClass, PageHeader, Pill } from "@/components/ui";

const STATUS_TONE: Record<RegulatoryItem["status"], "muted" | "info" | "warn" | "ok" | "bad"> = {
  preparing: "muted",
  filed: "info",
  in_review: "info",
  supplement: "warn",
  approved: "ok",
  rejected: "bad",
};

const FIELDS: Field[] = [
  { key: "title", label: "Item", required: true, placeholder: "e.g. 의약외품 승인: SALICARE 온염" },
  { key: "market", label: "Market", type: "select", options: REG_MARKETS, half: true },
  { key: "kind", label: "Type", type: "select", options: REG_KINDS, half: true },
  { key: "status", label: "Status", type: "select", options: REG_STATUSES, half: true },
  { key: "reference_no", label: "Reference / 접수번호", half: true },
  { key: "filed_on", label: "Filed on", type: "date", half: true },
  { key: "expected_on", label: "Expected / due", type: "date", half: true },
  { key: "doc_url", label: "Document link", type: "url" },
  { key: "notes", label: "Notes", type: "textarea" },
];

const DONE: RegulatoryItem["status"][] = ["approved", "rejected"];

export default function RegulatoryPage() {
  const items = useRecords<RegulatoryItem>("regulatory_items", "expected_on");
  const [sheet, setSheet] = useState<{ item?: RegulatoryItem } | null>(null);
  const today = todayISO();

  const open = items.rows.filter((r) => !DONE.includes(r.status));
  const closed = items.rows.filter((r) => DONE.includes(r.status));
  const waiting = items.rows.filter((r) => r.status === "in_review" || r.status === "filed").length;
  const supplements = items.rows.filter((r) => r.status === "supplement").length;
  const approved = items.rows.filter((r) => r.status === "approved").length;

  return (
    <>
      <PageHeader title="Regulatory" subtitle="의약외품 approvals, trademarks, label wording and tests.">
        <button className={buttonClass} onClick={() => setSheet({})}>
          <Plus className="size-4" /> Add item
        </button>
      </PageHeader>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Under review" value={waiting} />
        <Stat label="Supplement requested" value={supplements} tone={supplements ? "warn" : undefined} />
        <Stat label="Approved" value={approved} tone={approved ? "ok" : undefined} />
      </div>

      {!items.ready && <p className="text-sm text-muted">Loading…</p>}
      {items.ready && <ItemTable rows={open} today={today} onOpen={(item) => setSheet({ item })} empty="Nothing open. Add a filing, trademark or test to track it here." />}
      {closed.length > 0 && (
        <>
          <h2 className="font-mono text-[11px] tracking-wider text-muted uppercase">Closed</h2>
          <ItemTable rows={closed} today={today} onOpen={(item) => setSheet({ item })} />
        </>
      )}

      {sheet && (
        <RecordSheet
          title={sheet.item ? "Edit item" : "New regulatory item"}
          fields={FIELDS}
          initial={sheet.item ?? { market: "KR", kind: "product_approval", status: "preparing" }}
          onSave={(v) => (sheet.item ? items.update(sheet.item.id, v as Partial<RegulatoryItem>) : items.add(v as Omit<RegulatoryItem, "id">))}
          onDelete={sheet.item ? () => items.remove(sheet.item!.id) : undefined}
          onClose={() => setSheet(null)}
        />
      )}
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "warn" | "ok" }) {
  const color = tone === "warn" ? "text-warn" : tone === "ok" ? "text-ok" : "";
  return (
    <div className="grid gap-1 rounded-xl border border-line bg-surface p-4">
      <span className="text-xs text-muted">{label}</span>
      <span className={`text-2xl font-semibold tabular-nums ${color}`}>{value}</span>
    </div>
  );
}

function ItemTable({ rows, today, onOpen, empty }: { rows: RegulatoryItem[]; today: string; onOpen: (r: RegulatoryItem) => void; empty?: string }) {
  if (rows.length === 0) return empty ? <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">{empty}</p> : null;
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="bg-sunk text-left font-mono text-[11px] tracking-wider text-muted uppercase">
            <th className="px-3 py-2 font-medium">Item</th>
            <th className="px-3 py-2 font-medium">Market</th>
            <th className="px-3 py-2 font-medium">Type</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Filed</th>
            <th className="px-3 py-2 font-medium">Expected</th>
            <th className="px-3 py-2 font-medium"><span className="sr-only">Document</span></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const open = !DONE.includes(r.status);
            const days = r.expected_on ? daysBetween(today, r.expected_on) : null;
            return (
              <tr key={r.id} className="border-t border-line align-top hover:bg-sunk/60">
                <td className="px-3 py-2">
                  <button onClick={() => onOpen(r)} className="text-left font-medium hover:text-accent">{r.title}</button>
                  {r.notes && <p className="mt-0.5 line-clamp-2 text-xs text-muted">{r.notes}</p>}
                  {r.reference_no && <p className="mt-0.5 font-mono text-xs text-muted">#{r.reference_no}</p>}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">{REG_MARKETS[r.market]}</td>
                <td className="px-3 py-2 whitespace-nowrap">{REG_KINDS[r.kind]}</td>
                <td className="px-3 py-2"><Pill tone={STATUS_TONE[r.status]}>{REG_STATUSES[r.status]}</Pill></td>
                <td className="px-3 py-2 font-mono text-xs whitespace-nowrap text-muted">{r.filed_on ? formatDate(r.filed_on) : "–"}</td>
                <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">
                  {r.expected_on ? (
                    <span className={open && days !== null && days < 0 ? "text-bad" : "text-muted"}>
                      {formatDate(r.expected_on)}
                      {open && days !== null && <span className="ml-1">({days < 0 ? `${-days}d late` : days === 0 ? "today" : `D-${days}`})</span>}
                    </span>
                  ) : "–"}
                </td>
                <td className="px-3 py-2">
                  {r.doc_url && (
                    <a href={r.doc_url} target="_blank" rel="noreferrer" className="text-accent" aria-label="Open document">
                      <ExternalLink className="size-4" />
                    </a>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
