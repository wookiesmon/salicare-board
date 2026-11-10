"use client";

import { useCallback, useEffect, useState } from "react";
import { useStore } from "./store";
import { supabase } from "./supabase";

export type Supplier = {
  id: string;
  name: string;
  category: "oem" | "raw" | "cap" | "tube" | "carton" | "design" | "logistics" | "other";
  status: "candidate" | "quoting" | "selected" | "contracted" | "dropped";
  contact_name: string | null;
  contact: string | null;
  moq: string | null;
  lead_time: string | null;
  notes: string | null;
  doc_url: string | null;
};

export type Quote = {
  id: string;
  supplier_id: string;
  item: string;
  quantity: number | null;
  unit_price: number | null;
  tooling_cost: number | null;
  currency: "KRW" | "USD" | "EUR" | "CNY";
  quoted_on: string | null;
  valid_until: string | null;
  notes: string | null;
  doc_url: string | null;
};

export type RegulatoryItem = {
  id: string;
  title: string;
  market: "KR" | "US" | "EU" | "JP" | "CN" | "other";
  kind: "product_approval" | "trademark" | "label" | "test" | "business_license" | "other";
  status: "preparing" | "filed" | "in_review" | "supplement" | "approved" | "rejected";
  filed_on: string | null;
  expected_on: string | null;
  reference_no: string | null;
  notes: string | null;
  doc_url: string | null;
};

export const SUPPLIER_CATEGORIES: Record<Supplier["category"], string> = {
  oem: "제조 OEM",
  raw: "원료",
  tube: "튜브",
  cap: "캡",
  carton: "단상자·박스",
  design: "디자인",
  logistics: "물류 3PL",
  other: "기타",
};

export const SUPPLIER_STATUSES: Record<Supplier["status"], string> = {
  candidate: "후보",
  quoting: "견적 중",
  selected: "선정",
  contracted: "계약 완료",
  dropped: "제외",
};

export const CURRENCIES: Quote["currency"][] = ["KRW", "USD", "EUR", "CNY"];

export const REG_MARKETS: Record<RegulatoryItem["market"], string> = {
  KR: "한국",
  US: "미국",
  EU: "EU",
  JP: "일본",
  CN: "중국",
  other: "기타",
};

export const REG_KINDS: Record<RegulatoryItem["kind"], string> = {
  product_approval: "품목 승인",
  trademark: "상표",
  label: "표시기재",
  test: "시험",
  business_license: "사업자·허가",
  other: "기타",
};

export const REG_STATUSES: Record<RegulatoryItem["status"], string> = {
  preparing: "준비 중",
  filed: "제출",
  in_review: "심사 중",
  supplement: "보완 요청",
  approved: "승인",
  rejected: "반려",
};

type Table = "suppliers" | "quotes" | "regulatory_items";

/** Loads one workspace-scoped table and keeps a local copy in sync with edits. */
export function useRecords<T extends { id: string }>(table: Table, orderBy: string) {
  const { workspace, reportError } = useStore();
  const [rows, setRows] = useState<T[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let live = true;
    supabase
      .from(table)
      .select("*")
      .eq("workspace_id", workspace.id)
      .order(orderBy)
      .then(({ data, error }) => {
        if (!live) return;
        if (error) reportError(`load ${table}`, error.message);
        else setRows(data as T[]);
        setReady(true);
      });
    return () => {
      live = false;
    };
  }, [table, orderBy, workspace.id, reportError]);

  const add = useCallback(
    async (values: Omit<T, "id">) => {
      const { data, error } = await supabase
        .from(table)
        .insert({ ...values, workspace_id: workspace.id })
        .select()
        .single();
      if (error) return reportError("save", error.message);
      setRows((r) => [...r, data as T]);
    },
    [table, workspace.id, reportError],
  );

  const update = useCallback(
    async (id: string, patch: Partial<T>) => {
      setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
      const { error } = await supabase.from(table).update(patch as Record<string, unknown>).eq("id", id);
      if (error) reportError("save", error.message);
    },
    [table, reportError],
  );

  const remove = useCallback(
    async (id: string) => {
      setRows((r) => r.filter((x) => x.id !== id));
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) reportError("delete", error.message);
    },
    [table, reportError],
  );

  return { rows, ready, add, update, remove, setRows };
}

export function formatMoney(value: number | null, currency: Quote["currency"]): string {
  if (value === null || value === undefined) return "–";
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "KRW" ? 0 : 2,
  }).format(Number(value));
}
