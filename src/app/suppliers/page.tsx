"use client";

import { useState } from "react";
import { ExternalLink, Plus } from "lucide-react";
import { todayISO, formatDate } from "@/lib/data";
import {
  CURRENCIES,
  formatMoney,
  SUPPLIER_CATEGORIES,
  SUPPLIER_STATUSES,
  useRecords,
  type Quote,
  type Supplier,
} from "@/lib/records";
import { RecordSheet, type Field } from "@/components/record-sheet";
import { buttonClass, PageHeader, Pill } from "@/components/ui";

const STATUS_TONE: Record<Supplier["status"], "muted" | "info" | "accent" | "ok" | "bad"> = {
  candidate: "muted",
  quoting: "info",
  selected: "accent",
  contracted: "ok",
  dropped: "muted",
};

const SUPPLIER_FIELDS: Field[] = [
  { key: "name", label: "Name", required: true },
  { key: "category", label: "Category", type: "select", options: SUPPLIER_CATEGORIES, half: true },
  { key: "status", label: "Status", type: "select", options: SUPPLIER_STATUSES, half: true },
  { key: "contact_name", label: "Contact person", half: true },
  { key: "contact", label: "Phone / email / KakaoTalk", half: true },
  { key: "moq", label: "MOQ", half: true, placeholder: "e.g. 10,000개" },
  { key: "lead_time", label: "Lead time", half: true, placeholder: "e.g. 5–6주" },
  { key: "doc_url", label: "Document link", type: "url", placeholder: "https://drive.google.com/…" },
  { key: "notes", label: "Notes", type: "textarea" },
];

const QUOTE_FIELDS: Field[] = [
  { key: "item", label: "Item", required: true, placeholder: "e.g. 100g 라미네이트 튜브" },
  { key: "quantity", label: "Quantity", type: "number", half: true },
  { key: "currency", label: "Currency", type: "select", options: Object.fromEntries(CURRENCIES.map((c) => [c, c])), half: true },
  { key: "unit_price", label: "Unit price", type: "number", half: true },
  { key: "tooling_cost", label: "Mould / setup cost", type: "number", half: true },
  { key: "quoted_on", label: "Quote date", type: "date", half: true },
  { key: "valid_until", label: "Valid until", type: "date", half: true },
  { key: "doc_url", label: "Quote document link", type: "url" },
  { key: "notes", label: "Notes", type: "textarea" },
];

type Sheet =
  | { kind: "supplier"; supplier?: Supplier }
  | { kind: "quote"; supplierId: string; quote?: Quote }
  | null;

export default function SuppliersPage() {
  const suppliers = useRecords<Supplier>("suppliers", "created_at");
  const quotes = useRecords<Quote>("quotes", "created_at");
  const [sheet, setSheet] = useState<Sheet>(null);
  const [showDropped, setShowDropped] = useState(false);
  const today = todayISO();

  const visible = suppliers.rows.filter((s) => showDropped || s.status !== "dropped");
  const categories = (Object.keys(SUPPLIER_CATEGORIES) as Supplier["category"][]).filter((c) => visible.some((s) => s.category === c));
  const droppedCount = suppliers.rows.length - suppliers.rows.filter((s) => s.status !== "dropped").length;

  return (
    <>
      <PageHeader title="Suppliers" subtitle="Manufacturer, raw material, packaging and logistics partners, with their quotes.">
        {droppedCount > 0 && (
          <label className="flex items-center gap-2 text-sm text-muted">
            <input id="show-dropped" type="checkbox" className="accent-[var(--accent)]" checked={showDropped} onChange={(e) => setShowDropped(e.target.checked)} />
            Show dropped ({droppedCount})
          </label>
        )}
        <button className={buttonClass} onClick={() => setSheet({ kind: "supplier" })}>
          <Plus className="size-4" /> Add supplier
        </button>
      </PageHeader>

      {!suppliers.ready && <p className="text-sm text-muted">Loading…</p>}
      {suppliers.ready && suppliers.rows.length === 0 && (
        <div className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">
          No suppliers yet. Add your manufacturer, salt supplier, tube and cap makers to compare their quotes here.
        </div>
      )}

      {categories.map((cat) => (
        <section key={cat} className="grid gap-3">
          <h2 className="font-mono text-[11px] tracking-wider text-muted uppercase">{SUPPLIER_CATEGORIES[cat]}</h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {visible
              .filter((s) => s.category === cat)
              .map((s) => {
                const qs = quotes.rows.filter((q) => q.supplier_id === s.id);
                return (
                  <article key={s.id} className={`grid min-w-0 content-start gap-3 rounded-xl border border-line bg-surface p-4 ${s.status === "dropped" ? "opacity-60" : ""}`}>
                    <div className="flex items-start justify-between gap-3">
                      <button onClick={() => setSheet({ kind: "supplier", supplier: s })} className="text-left text-base font-semibold hover:text-accent">
                        {s.name}
                      </button>
                      <Pill tone={STATUS_TONE[s.status]}>{SUPPLIER_STATUSES[s.status]}</Pill>
                    </div>

                    {(s.moq || s.lead_time || s.contact_name || s.contact) && (
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        {s.moq && (<><dt className="text-muted">MOQ</dt><dd>{s.moq}</dd></>)}
                        {s.lead_time && (<><dt className="text-muted">Lead time</dt><dd>{s.lead_time}</dd></>)}
                        {s.contact_name && (<><dt className="text-muted">Contact</dt><dd>{s.contact_name}</dd></>)}
                        {s.contact && (<><dt className="text-muted">Reach</dt><dd className="break-words">{s.contact}</dd></>)}
                      </dl>
                    )}
                    {s.notes && <p className="text-sm whitespace-pre-line text-muted">{s.notes}</p>}
                    {s.doc_url && (
                      <a href={s.doc_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
                        Open document <ExternalLink className="size-3.5" />
                      </a>
                    )}

                    <div className="grid gap-2 border-t border-dashed border-line pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">Quotes {qs.length > 0 && <span className="text-muted">· {qs.length}</span>}</span>
                        <button className="inline-flex items-center gap-1 text-xs text-accent hover:underline" onClick={() => setSheet({ kind: "quote", supplierId: s.id })}>
                          <Plus className="size-3.5" /> Add quote
                        </button>
                      </div>
                      {qs.length === 0 ? (
                        <p className="text-xs text-muted">No quotes yet.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[420px] text-xs">
                            <thead>
                              <tr className="text-left text-muted">
                                <th className="py-1 pr-2 font-medium">Item</th>
                                <th className="py-1 pr-2 text-right font-medium">Qty</th>
                                <th className="py-1 pr-2 text-right font-medium">Unit</th>
                                <th className="py-1 pr-2 text-right font-medium">Mould</th>
                                <th className="py-1 font-medium">Valid</th>
                              </tr>
                            </thead>
                            <tbody>
                              {qs.map((q) => {
                                const expired = q.valid_until !== null && q.valid_until < today;
                                return (
                                  <tr key={q.id} className="cursor-pointer border-t border-line hover:bg-sunk/60" onClick={() => setSheet({ kind: "quote", supplierId: s.id, quote: q })}>
                                    <td className="py-1.5 pr-2">{q.item}</td>
                                    <td className="py-1.5 pr-2 text-right tabular-nums">{q.quantity?.toLocaleString() ?? "–"}</td>
                                    <td className="py-1.5 pr-2 text-right tabular-nums">{formatMoney(q.unit_price, q.currency)}</td>
                                    <td className="py-1.5 pr-2 text-right tabular-nums">{formatMoney(q.tooling_cost, q.currency)}</td>
                                    <td className="py-1.5 whitespace-nowrap">
                                      {q.valid_until ? (expired ? <Pill tone="bad">expired</Pill> : formatDate(q.valid_until)) : "–"}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
          </div>
        </section>
      ))}

      {sheet?.kind === "supplier" && (
        <RecordSheet
          title={sheet.supplier ? "Edit supplier" : "New supplier"}
          fields={SUPPLIER_FIELDS}
          initial={sheet.supplier ?? { category: "other", status: "candidate" }}
          onSave={(v) =>
            sheet.supplier
              ? suppliers.update(sheet.supplier.id, v as Partial<Supplier>)
              : suppliers.add(v as Omit<Supplier, "id">)
          }
          onDelete={sheet.supplier ? () => suppliers.remove(sheet.supplier!.id) : undefined}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet?.kind === "quote" && (
        <RecordSheet
          title={sheet.quote ? "Edit quote" : "New quote"}
          fields={QUOTE_FIELDS}
          initial={sheet.quote ?? { currency: "KRW", quoted_on: today }}
          onSave={(v) =>
            sheet.quote
              ? quotes.update(sheet.quote.id, v as Partial<Quote>)
              : quotes.add({ ...(v as Omit<Quote, "id" | "supplier_id">), supplier_id: sheet.supplierId })
          }
          onDelete={sheet.quote ? () => quotes.remove(sheet.quote!.id) : undefined}
          onClose={() => setSheet(null)}
        />
      )}
    </>
  );
}
