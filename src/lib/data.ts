export type Status = "todo" | "doing" | "waiting" | "done";
export type Priority = "p1" | "p2" | "p3";

export type Phase = {
  id: string;
  code: string;
  name: string;
};

export type Task = {
  id: string;
  title: string;
  phaseId: string;
  status: Status;
  priority: Priority;
  /** ISO date, yyyy-mm-dd */
  due: string;
  notes?: string;
  docUrl?: string;
};

export const STATUSES: { id: Status; label: string }[] = [
  { id: "todo", label: "To do" },
  { id: "doing", label: "In progress" },
  { id: "waiting", label: "Waiting on vendor" },
  { id: "done", label: "Done" },
];

export const PRIORITY_LABEL: Record<Priority, string> = {
  p1: "Urgent",
  p2: "Normal",
  p3: "Low",
};

export const PHASES: Phase[] = [
  { id: "p0", code: "P0", name: "Strategy & brand" },
  { id: "p1", code: "P1", name: "Formulation" },
  { id: "p2", code: "P2", name: "Testing" },
  { id: "p3", code: "P3", name: "Regulatory & claims" },
  { id: "p4", code: "P4", name: "Packaging" },
  { id: "p5", code: "P5", name: "Supply & costing" },
  { id: "p6", code: "P6", name: "Channels" },
  { id: "p7", code: "P7", name: "Marketing launch" },
  { id: "p8", code: "P8", name: "Post-launch" },
];

export const DEFAULT_LAUNCH_DATE = "2027-04-01";

/**
 * The toothpaste launch template. `daysBefore` counts back from launch day;
 * negative values fall after launch.
 */
const TEMPLATE: [phaseId: string, title: string, daysBefore: number, priority: Priority][] = [
  ["p0", "Define positioning, target customer and hero claim", 170, "p1"],
  ["p0", "Competitor teardown: price per oz, claims, packaging", 165, "p2"],
  ["p0", "Trademark and domain check for \"Salicare\"", 160, "p1"],
  ["p0", "Brand identity: logo, palette, voice", 140, "p2"],
  ["p0", "Decide fluoride (OTC drug) or fluoride-free (cosmetic)", 158, "p1"],
  ["p1", "Write product brief: actives, flavour, abrasiveness, SLS-free", 150, "p1"],
  ["p1", "Send RFQ to 3–5 contract manufacturers", 145, "p1"],
  ["p1", "Sign NDA and quality agreement with manufacturer", 130, "p2"],
  ["p1", "Review lab samples (rounds v1–vN)", 115, "p1"],
  ["p1", "Lock final formula, INCI list and spec sheet", 105, "p1"],
  ["p2", "Start accelerated + real-time stability testing", 100, "p1"],
  ["p2", "Tube compatibility test", 95, "p2"],
  ["p2", "Preservative efficacy and microbial tests", 90, "p2"],
  ["p2", "Fluoride assay and availability test (if OTC)", 85, "p2"],
  ["p2", "Consumer in-use panel", 75, "p3"],
  ["p3", "Confirm M021 monograph compliance or MoCRA listing", 80, "p1"],
  ["p3", "Get NDC labeler code and drug listing (if OTC)", 70, "p1"],
  ["p3", "Drug Facts / label legal review", 65, "p1"],
  ["p3", "Build claims substantiation file", 60, "p2"],
  ["p3", "Product liability insurance", 45, "p2"],
  ["p4", "Choose tube (laminate / mono-material) and carton", 110, "p2"],
  ["p4", "Dielines and artwork", 90, "p1"],
  ["p4", "GS1 barcodes for each SKU", 80, "p2"],
  ["p4", "Proof rounds and final approval", 60, "p1"],
  ["p5", "Bill of materials and cost of goods model", 100, "p2"],
  ["p5", "Place purchase order and pay deposit", 55, "p1"],
  ["p5", "QC release specs and Certificate of Analysis review", 25, "p1"],
  ["p5", "3PL / Amazon FBA logistics plan", 35, "p2"],
  ["p6", "Shopify store and product page", 40, "p2"],
  ["p6", "Amazon Brand Registry and listing (check OTC gating)", 30, "p2"],
  ["p6", "Product photography and content", 35, "p3"],
  ["p7", "Pre-launch waitlist and email sequence", 45, "p2"],
  ["p7", "Dentist and influencer seeding", 20, "p2"],
  ["p7", "Launch-day campaign and paid ads", 0, "p1"],
  ["p8", "Set reorder points and inventory alerts", -14, "p2"],
  ["p8", "Monitor reviews and adverse-event reports", -30, "p2"],
];

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return toISO(d);
}

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toISO(new Date());
}

export function daysBetween(fromIso: string, toIso: string): number {
  const a = new Date(fromIso + "T00:00:00").getTime();
  const b = new Date(toIso + "T00:00:00").getTime();
  return Math.round((b - a) / 86_400_000);
}

/** Builds the starter task list, marking tasks already past due as done. */
export function buildTemplate(launchDate: string): Task[] {
  const today = todayISO();
  return TEMPLATE.map(([phaseId, title, daysBefore, priority], i) => {
    const due = addDays(launchDate, -daysBefore);
    const past = due < today;
    return {
      id: `t${i + 1}`,
      title,
      phaseId,
      priority,
      due,
      status: past ? "done" : "todo",
    };
  });
}

export function phaseOf(id: string): Phase {
  return PHASES.find((p) => p.id === id) ?? PHASES[0];
}

export function isOverdue(t: Task, today = todayISO()): boolean {
  return t.status !== "done" && t.due < today;
}

export function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
