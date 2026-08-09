"use client"

import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight, Plus, Zap, GripVertical } from "lucide-react"
import { PriorityBadge, SectionHeader } from "@/components/nerve/ui"
import { useNerveStore } from "@/lib/nerve-store"
import { type Task } from "@/lib/nerve-data"
import { cn } from "@/lib/utils"

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

function getWeekStart(d: Date) {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

function getWeekDates(start: Date): Date[] {
  return [...Array(7)].map((_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

function formatWeekRange(dates: Date[]) {
  const first = dates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })
  const last = dates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  return `${first} — ${last}`
}

export default function WeeklyPlannerPage() {
  const today = new Date()
  const { tasks, weeklyPlan, setWeeklyPlan, projects } = useNerveStore()
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [dragging, setDragging] = useState<{ taskId: string; fromDay: number } | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  const weekDates = getWeekDates(new Date(weekStart))

  const prevWeek = () => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() - 7)
    setWeekStart(d)
  }

  const nextWeek = () => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 7)
    setWeekStart(d)
  }

  const isToday = (d: Date) =>
    d.toDateString() === today.toDateString()

  // Map task IDs in weeklyPlan to task objects
  const weekPlan = useMemo(() => {
    const map: Record<number, Task[]> = {}
    for (let i = 0; i < 7; i++) {
      const ids = weeklyPlan[i] ?? []
      map[i] = ids.map((id) => tasks.find((t) => t.id === id)).filter(Boolean) as Task[]
    }
    return map
  }, [weeklyPlan, tasks])

  const handleDrop = (toDay: number) => {
    if (!dragging) return
    const { taskId, fromDay } = dragging
    if (fromDay === toDay) return

    const nextWeekly = { ...weeklyPlan }
    nextWeekly[fromDay] = (nextWeekly[fromDay] ?? []).filter((id) => id !== taskId)
    nextWeekly[toDay] = [...(nextWeekly[toDay] ?? []).filter((id) => id !== taskId), taskId]

    setWeeklyPlan(nextWeekly)
    setDragging(null)
    setDragOver(null)
  }

  const totalTasks = Object.values(weekPlan).flat().length
  const totalXP = Object.values(weekPlan).flat().reduce((s, t) => s + t.xp, 0)

  return (
    <div className="max-w-6xl mx-auto">
      <SectionHeader
        title="Weekly Planner"
        subtitle="See the full week. Move fast, stay balanced."
      />

      {/* Week nav */}
      <div className="flex items-center justify-between mb-7 bg-[#FFFFFF] border border-slate-200 rounded-2xl px-5 py-4">
        <button onClick={prevWeek} className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition-all">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <p className="text-base font-bold text-[#0F172A]">{formatWeekRange(weekDates)}</p>
          <p className="text-xs text-[#64748B] mt-0.5">{totalTasks} tasks planned · {totalXP} XP</p>
        </div>
        <button onClick={nextWeek} className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition-all">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-7 gap-3">
        {DAYS.map((day, i) => {
          const date = weekDates[i]
          const dayTasks = weekPlan[i] ?? []
          const today = isToday(date)
          const isDragTarget = dragOver === i

          return (
            <div
              key={i}
              className={cn(
                "bg-[#FFFFFF] border rounded-2xl p-3 min-h-[280px] flex flex-col transition-all duration-150",
                today ? "border-[#2563EB]/30" : "border-slate-200",
                isDragTarget ? "bg-[#2563EB]/5 border-[#2563EB]/30" : ""
              )}
              onDragOver={(e) => { e.preventDefault(); setDragOver(i) }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => handleDrop(i)}
            >
              {/* Day header */}
              <div className="mb-3 text-center">
                <p className={cn("text-xs font-semibold uppercase tracking-wider", today ? "text-[#2563EB]" : "text-[#64748B]")}>
                  {day}
                </p>
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold mx-auto mt-1",
                  today ? "bg-[#2563EB] text-white" : "text-[#0F172A]"
                )}>
                  {date.getDate()}
                </div>
                {dayTasks.length > 0 && (
                  <div className="flex items-center justify-center gap-1 mt-1.5">
                    <Zap className="w-2.5 h-2.5 text-[#8B5CF6]" />
                    <span className="text-[10px] text-[#8B5CF6] font-semibold">
                      {dayTasks.reduce((s, t) => s + t.xp, 0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Tasks */}
              <div className="flex-1 space-y-1.5">
                {dayTasks.map((task) => {
                  const project = projects.find((p) => p.id === task.projectId)
                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => setDragging({ taskId: task.id, fromDay: i })}
                      className="group flex items-start gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-2 cursor-grab hover:bg-slate-100 transition-all"
                    >
                      <GripVertical className="w-3 h-3 text-[#64748B]/40 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium text-[#0F172A] leading-snug line-clamp-2">
                          {task.title}
                        </p>
                        {project && (
                          <p className="text-[10px] mt-0.5 truncate" style={{ color: project.color }}>
                            {project.icon} {project.name}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}

                {dayTasks.length === 0 && !isDragTarget && (
                  <div className="flex items-center justify-center h-16 border border-dashed border-slate-200 rounded-xl">
                    <Plus className="w-3.5 h-3.5 text-[#64748B]/40" />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Workload summary */}
      <div className="mt-6 bg-[#FFFFFF] border border-slate-200 rounded-2xl p-5">
        <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-4">Workload Overview</h3>
        <div className="grid grid-cols-7 gap-3">
          {DAYS.map((day, i) => {
            const count = (weekPlan[i] ?? []).length
            const maxTasks = 5
            const height = Math.max(4, (count / maxTasks) * 48)
            const today = isToday(weekDates[i])
            return (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-full h-12 flex items-end justify-center">
                  <div
                    className="w-full rounded-t-lg transition-all duration-500"
                    style={{
                      height: `${height}px`,
                      background: today ? "#2563EB" : count > 3 ? "#EF4444" : count > 1 ? "#10B981" : "rgba(255,255,255,0.08)",
                    }}
                  />
                </div>
                <span className={cn("text-[11px] font-medium", today ? "text-[#2563EB]" : "text-[#64748B]")}>{day}</span>
                <span className="text-[10px] text-[#64748B]">{count}t</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
