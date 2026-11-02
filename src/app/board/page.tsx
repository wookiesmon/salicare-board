"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { formatDate, PHASES, STATUSES, type Status, type Task } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useTaskPanel } from "@/components/task-panel";
import { inputClass, OverduePill, PageHeader, PhasePill, PriorityPill } from "@/components/ui";
import { cn } from "@/lib/utils";

export default function BoardPage() {
  const { tasks, moveTask } = useStore();
  const [phase, setPhase] = useState("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const visible = tasks
    .filter((t) => phase === "all" || t.phaseId === phase)
    .sort((a, b) => a.due.localeCompare(b.due));
  const active = tasks.find((t) => t.id === activeId);

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    if (e.over) moveTask(String(e.active.id), e.over.id as Status);
  }

  return (
    <>
      <PageHeader title="Board" subtitle="Drag cards between columns to change their status.">
        <select id="board-phase" aria-label="Filter by phase" className={cn(inputClass, "w-auto")} value={phase} onChange={(e) => setPhase(e.target.value)}>
          <option value="all">All phases</option>
          {PHASES.map((p) => (
            <option key={p.id} value={p.id}>{p.code} · {p.name}</option>
          ))}
        </select>
      </PageHeader>

      <DndContext sensors={sensors} onDragStart={(e) => setActiveId(String(e.active.id))} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
        <div className="-mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
          <div className="grid min-w-[880px] grid-cols-4 gap-3">
            {STATUSES.map((s) => (
              <Column key={s.id} status={s.id} label={s.label} tasks={visible.filter((t) => t.status === s.id)} phase={phase} />
            ))}
          </div>
        </div>
        <DragOverlay>{active ? <Card task={active} dragging /> : null}</DragOverlay>
      </DndContext>
    </>
  );
}

function Column({ status, label, tasks, phase }: { status: Status; label: string; tasks: Task[]; phase: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const { openNew } = useTaskPanel();
  return (
    <div ref={setNodeRef} className={cn("flex min-h-64 flex-col gap-2 rounded-xl bg-sunk p-2 transition-colors", isOver && "ring-2 ring-accent")}>
      <div className="flex items-center justify-between px-1.5 py-1">
        <span className="font-mono text-[11px] tracking-wider text-muted uppercase">{label} <span className="ml-1">{tasks.length}</span></span>
        <button
          className="rounded p-0.5 text-muted hover:bg-surface hover:text-accent"
          aria-label={`Add task to ${label}`}
          onClick={() => openNew({ status, ...(phase !== "all" && { phaseId: phase }) })}
        >
          <Plus className="size-4" />
        </button>
      </div>
      {tasks.map((t) => (
        <DraggableCard key={t.id} task={t} />
      ))}
      {tasks.length === 0 && <p className="px-2 py-6 text-center text-xs text-muted">Drop a card here</p>}
    </div>
  );
}

function DraggableCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={cn("touch-none", isDragging && "opacity-40")}>
      <Card task={task} />
    </div>
  );
}

function Card({ task, dragging }: { task: Task; dragging?: boolean }) {
  const { openTask } = useTaskPanel();
  return (
    <div
      onClick={() => openTask(task.id)}
      className={cn(
        "grid cursor-grab gap-2 rounded-lg border border-line bg-surface p-2.5 text-sm hover:border-accent",
        dragging && "cursor-grabbing shadow-lg",
      )}
    >
      <span className="leading-snug">{task.title}</span>
      <div className="flex flex-wrap items-center gap-1.5">
        <PhasePill phaseId={task.phaseId} />
        <PriorityPill priority={task.priority} />
        <OverduePill task={task} />
        <span className="ml-auto font-mono text-[11px] text-muted">{formatDate(task.due)}</span>
      </div>
    </div>
  );
}
