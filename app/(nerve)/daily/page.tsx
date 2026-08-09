"use client"

import { useState, useMemo } from "react"
import { Plus, Clock, Zap, GripVertical, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PriorityBadge, SectionHeader } from "@/components/nerve/ui"
import { useNerveStore } from "@/lib/nerve-store"
import { type Task } from "@/lib/nerve-data"
import { cn } from "@/lib/utils"

const BLOCKS = [
  {
    id: "morning",
    label: "Morning",
    time: "6:00 — 12:00",
    icon: "🌅",
    color: "#F59E0B",
  },
  {
    id: "afternoon",
    label: "Afternoon",
    time: "12:00 — 17:00",
    icon: "☀️",
    color: "#2563EB",
  },
  {
    id: "evening",
    label: "Evening",
    time: "17:00 — 22:00",
    icon: "🌙",
    color: "#8B5CF6",
  },
]

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
}

export default function DailyPlannerPage() {
  const { tasks, dailyPlan, setDailyPlan, updateTask, projects } = useNerveStore()
  const [date, setDate] = useState(new Date())
  const [dragging, setDragging] = useState<{ taskId: string; from: string | "unscheduled" } | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [quickAddBlock, setQuickAddBlock] = useState<string | null>(null)
  const [quickAddText, setQuickAddText] = useState("")

  const prevDay = () => { const d = new Date(date); d.setDate(d.getDate() - 1); setDate(d) }
  const nextDay = () => { const d = new Date(date); d.setDate(d.getDate() + 1); setDate(d) }

  // Map task IDs inside dailyPlan to actual task objects
  const plan = useMemo(() => {
    const map: Record<string, Task[]> = {}
    BLOCKS.forEach((block) => {
      const ids = dailyPlan[block.id] ?? []
      map[block.id] = ids.map((id) => tasks.find((t) => t.id === id)).filter(Boolean) as Task[]
    })
    return map
  }, [dailyPlan, tasks])

  // Unscheduled tasks are active/todo tasks that are not placed in any block of the daily plan
  const unscheduled = useMemo(() => {
    const scheduledIds = Object.values(dailyPlan).flat()
    return tasks.filter((t) => !scheduledIds.includes(t.id) && t.status !== "completed")
  }, [tasks, dailyPlan])

  const handleDragStart = (taskId: string, from: string | "unscheduled") => {
    setDragging({ taskId, from })
  }

  const handleDrop = (to: string) => {
    if (!dragging) return
    const { taskId, from } = dragging

    const nextDaily = { ...dailyPlan }
    
    // 1. Remove task ID from the previous block if it was in the plan
    if (from !== "unscheduled") {
      nextDaily[from] = (nextDaily[from] ?? []).filter((id) => id !== taskId)
    }

    // 2. Add task ID to the new block if it is within a block (and not dropping back to unscheduled)
    if (to !== "unscheduled") {
      nextDaily[to] = [...(nextDaily[to] ?? []).filter((id) => id !== taskId), taskId]
    }

    setDailyPlan(nextDaily)
    setDragging(null)
    setDragOver(null)
  }

  const handleQuickAdd = (blockId: string) => {
    if (!quickAddText.trim()) { setQuickAddBlock(null); return }
    const newId = String(Date.now())
    const defaultProject = projects[0] ?? { id: "1", name: "Startup Launch" }
    
    const newTask: Task = {
      id: newId,
      title: quickAddText,
      estimatedTime: "1h",
      priority: "medium",
      xp: 50,
      status: "todo",
      projectId: defaultProject.id,
      project: defaultProject.name,
    }
    
    // Add task to global list
    updateTask(newTask)

    // Append to the daily plan block list
    const nextDaily = {
      ...dailyPlan,
      [blockId]: [...(dailyPlan[blockId] ?? []), newId],
    }
    setDailyPlan(nextDaily)

    setQuickAddText("")
    setQuickAddBlock(null)
  }

  const totalTasks = Object.values(plan).flat().length
  const totalXP = Object.values(plan).flat().reduce((sum, t) => sum + t.xp, 0)

  return (
    <div className="max-w-5xl mx-auto">
      <SectionHeader
        title="Daily Planner"
        subtitle="Block your time. Own your day."
      />

      {/* Date nav */}
      <div className="flex items-center justify-between mb-7 bg-[#FFFFFF] border border-slate-200 rounded-2xl px-5 py-4">
        <button onClick={prevDay} className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition-all">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <p className="text-base font-bold text-[#0F172A]">{formatDate(date)}</p>
          <p className="text-xs text-[#64748B] mt-0.5">{totalTasks} tasks · {totalXP} XP available</p>
        </div>
        <button onClick={nextDay} className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition-all">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Time blocks */}
        <div className="lg:col-span-3 space-y-4">
          {BLOCKS.map((block) => {
            const blockTasks = plan[block.id] ?? []
            const isDragTarget = dragOver === block.id

            return (
              <div
                key={block.id}
                className={cn(
                  "bg-[#FFFFFF] border rounded-2xl p-5 transition-all duration-150",
                  isDragTarget ? "border-[#2563EB]/30 bg-[#2563EB]/5" : "border-slate-200"
                )}
                onDragOver={(e) => { e.preventDefault(); setDragOver(block.id) }}
                onDragLeave={() => setDragOver(null)}
                onDrop={() => handleDrop(block.id)}
              >
                {/* Block header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xl leading-none">{block.icon}</span>
                    <div>
                      <p className="text-sm font-bold text-[#0F172A]">{block.label}</p>
                      <p className="text-xs text-[#64748B]">{block.time}</p>
                    </div>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-lg"
                      style={{ background: `${block.color}15`, color: block.color }}
                    >
                      {blockTasks.length} task{blockTasks.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <button
                    onClick={() => setQuickAddBlock(quickAddBlock === block.id ? null : block.id)}
                    className="flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#0F172A] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Quick add
                  </button>
                </div>

                {/* Quick add input */}
                {quickAddBlock === block.id && (
                  <div className="mb-3 flex gap-2">
                    <input
                      autoFocus
                      value={quickAddText}
                      onChange={(e) => setQuickAddText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.nativeEvent.isComposing) handleQuickAdd(block.id)
                        if (e.key === "Escape") { setQuickAddBlock(null); setQuickAddText("") }
                      }}
                      placeholder="Task name... (Enter to add)"
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#0F172A] placeholder:text-[#64748B] outline-none focus:border-[#2563EB]/50"
                    />
                    <Button
                      onClick={() => handleQuickAdd(block.id)}
                      className="nerve-gradient-blue text-white border-0 rounded-xl px-4 text-sm font-semibold hover:opacity-90"
                    >
                      Add
                    </Button>
                  </div>
                )}

                {/* Tasks */}
                <div className="space-y-2 min-h-[40px]">
                  {blockTasks.length === 0 && !isDragTarget && (
                    <p className="text-xs text-[#64748B]/60 text-center py-3">Drag tasks here or quick add</p>
                  )}
                  {blockTasks.map((task) => {
                    const project = projects.find((p) => p.id === task.projectId)
                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => handleDragStart(task.id, block.id)}
                        className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 cursor-grab hover:bg-slate-50 transition-all group"
                      >
                        <GripVertical className="w-3.5 h-3.5 text-[#64748B]/50 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#0F172A] truncate">{task.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-[#64748B] flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />{task.estimatedTime}
                            </span>
                            {project && (
                              <span className="text-xs" style={{ color: project.color }}>
                                {project.icon} {project.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-[#8B5CF6] font-semibold flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5" />{task.xp}
                          </span>
                          <PriorityBadge priority={task.priority} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Unscheduled tasks sidebar */}
        <div>
          <div
            className={cn(
              "bg-[#FFFFFF] border rounded-2xl p-4 transition-all",
              dragOver === "unscheduled" ? "border-[#2563EB]/30" : "border-slate-200"
            )}
            onDragOver={(e) => { e.preventDefault(); setDragOver("unscheduled") }}
            onDragLeave={() => setDragOver(null)}
            onDrop={() => {
              if (!dragging) return
              const { taskId, from } = dragging
              if (from === "unscheduled") return
              
              // Remove task ID from the daily plan to make it unscheduled
              const nextDaily = { ...dailyPlan }
              nextDaily[from] = (nextDaily[from] ?? []).filter((id) => id !== taskId)
              
              setDailyPlan(nextDaily)
              setDragging(null)
              setDragOver(null)
            }}
          >
            <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-3">Unscheduled</h3>
            <div className="space-y-2 min-h-[60px]">
              {unscheduled.length === 0 && (
                <p className="text-xs text-[#64748B]/60 text-center py-4">All tasks scheduled!</p>
              )}
              {unscheduled.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => handleDragStart(task.id, "unscheduled")}
                  className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5 cursor-grab hover:bg-slate-50 transition-all"
                >
                  <GripVertical className="w-3.5 h-3.5 text-[#64748B]/50 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#0F172A] leading-snug">{task.title}</p>
                    <p className="text-[10px] text-[#64748B] mt-0.5 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />{task.estimatedTime}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
