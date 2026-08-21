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

function formatDateKey(date: Date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

export default function DailyPlannerPage() {
  const { tasks, updateTask, projects } = useNerveStore()
  const [date, setDate] = useState(new Date())
  const [dragging, setDragging] = useState<{ taskId: string; from: string | "unscheduled" } | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [quickAddBlock, setQuickAddBlock] = useState<string | null>(null)
  const [quickAddText, setQuickAddText] = useState("")

  const prevDay = () => { const d = new Date(date); d.setDate(d.getDate() - 1); setDate(d) }
  const nextDay = () => { const d = new Date(date); d.setDate(d.getDate() + 1); setDate(d) }

  const dateStr = useMemo(() => formatDateKey(date), [date])

  // Map task objects dynamically to their scheduled blocks on the active date
  const plan = useMemo(() => {
    const map: Record<string, Task[]> = {}
    BLOCKS.forEach((block) => {
      map[block.id] = tasks.filter(
        (t) => t.scheduledDate === dateStr && t.scheduledBlock === block.id
      )
    })
    return map
  }, [tasks, dateStr])

  // Unscheduled tasks for today: active tasks scheduled for today that are NOT in a block
  const unscheduled = useMemo(() => {
    return tasks.filter((t) => {
      return t.scheduledDate === dateStr && t.status !== "completed" && !t.scheduledBlock
    })
  }, [tasks, dateStr])

  const handleDragStart = (taskId: string, from: string | "unscheduled") => {
    setDragging({ taskId, from })
  }

  const handleDrop = (to: string) => {
    if (!dragging) return
    const { taskId } = dragging

    const targetTask = tasks.find((t) => t.id === taskId)
    if (!targetTask) return

    if (to === "unscheduled") {
      updateTask({
        ...targetTask,
        scheduledBlock: undefined,
      })
    } else {
      updateTask({
        ...targetTask,
        scheduledDate: dateStr,
        scheduledBlock: to as any,
      })
    }

    setDragging(null)
    setDragOver(null)
  }

  const moveTaskDirectly = (taskId: string, to: string) => {
    const targetTask = tasks.find((t) => t.id === taskId)
    if (!targetTask) return

    if (to === "unscheduled") {
      updateTask({
        ...targetTask,
        scheduledBlock: undefined,
      })
    } else {
      updateTask({
        ...targetTask,
        scheduledDate: dateStr,
        scheduledBlock: to as any,
      })
    }
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
      scheduledDate: dateStr,
      scheduledBlock: blockId as any,
    }
    
    updateTask(newTask)
    setQuickAddText("")
    setQuickAddBlock(null)
  }

  const todayAllTasks = useMemo(() => {
    return tasks.filter((t) => t.scheduledDate === dateStr)
  }, [tasks, dateStr])

  const totalTasks = todayAllTasks.length
  const totalXP = todayAllTasks.reduce((sum, t) => sum + (t.status === "completed" ? 0 : t.xp), 0)

  return (
    <div className="max-w-5xl mx-auto">
      <SectionHeader
        title="Daily Planner"
        subtitle="Block your time. Own your day."
      />

      {/* Date Navigation */}
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
        {/* Time Blocks */}
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
                {/* Block Header */}
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

                {/* Quick Add Input */}
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

                {/* Tasks List */}
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
                        className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 cursor-grab hover:bg-slate-100 transition-all group"
                      >
                        {/* Grip handle for drag and drop (touchAction: "none" enables touch dragging on mobile via polyfill) */}
                        <GripVertical 
                          style={{ touchAction: "none" }}
                          className="w-3.5 h-3.5 text-[#64748B]/40 mt-0.5 shrink-0 cursor-grab active:cursor-grabbing" 
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#0F172A] truncate">{task.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-[#64748B] flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />{task.estimatedTime}
                            </span>
                            {project && (
                              <span className="text-xs font-semibold" style={{ color: project.color }}>
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

        {/* Unscheduled Tasks Sidebar (1 Column) */}
        <div>
          <div
            className={cn(
              "bg-[#FFFFFF] border rounded-2xl p-4 min-h-[500px] flex flex-col transition-all duration-150",
              dragOver === "unscheduled" ? "border-[#2563EB]/30 bg-blue-50/5" : "border-slate-200"
            )}
            onDragOver={(e) => { e.preventDefault(); setDragOver("unscheduled") }}
            onDragLeave={() => setDragOver(null)}
            onDrop={() => handleDrop("unscheduled")}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Unscheduled Pool</h3>
              <span className="bg-slate-100 text-[#64748B] px-2 py-0.5 rounded-full text-xs font-semibold">
                {unscheduled.length}
              </span>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto max-h-[550px] pr-1">
              {unscheduled.length === 0 && (
                <p className="text-xs text-[#64748B]/60 text-center py-4">All tasks scheduled!</p>
              )}
              {unscheduled.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => handleDragStart(task.id, "unscheduled")}
                  className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5 cursor-grab hover:bg-slate-100 transition-all shadow-sm hover:shadow"
                >
                  {/* Grip handle for drag and drop (touchAction: "none" enables touch dragging on mobile via polyfill) */}
                  <GripVertical 
                    style={{ touchAction: "none" }}
                    className="w-3.5 h-3.5 text-[#64748B]/40 mt-0.5 shrink-0 cursor-grab active:cursor-grabbing" 
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-[#0F172A] leading-snug line-clamp-2">{task.title}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-[#64748B] flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />{task.estimatedTime}
                      </span>
                      <PriorityBadge priority={task.priority} />
                    </div>
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
