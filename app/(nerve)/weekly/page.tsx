"use client"

import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight, Plus, Zap, GripVertical, Sparkles, Loader2, BrainCircuit, AlertTriangle } from "lucide-react"
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

function formatDateKey(date: Date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

function parseEstimatedMinutes(timeStr?: string): number {
  if (!timeStr) return 60
  const cleaned = timeStr.trim().toLowerCase()
  if (cleaned.endsWith("h")) {
    const hours = parseFloat(cleaned.slice(0, -1))
    return isNaN(hours) ? 60 : hours * 60
  }
  if (cleaned.endsWith("m")) {
    const mins = parseFloat(cleaned.slice(0, -1))
    return isNaN(mins) ? 60 : mins
  }
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 60 : parsed * 60
}

function getTaskDepth(taskId: string, tasksList: Task[], memo: Map<string, number>): number {
  if (memo.has(taskId)) return memo.get(taskId)!
  const task = tasksList.find((t) => t.id === taskId)
  if (!task || !task.dependsOnTaskId || task.status === "completed") {
    memo.set(taskId, 0)
    return 0
  }
  const prereqDepth = getTaskDepth(task.dependsOnTaskId, tasksList, memo)
  const depth = 1 + prereqDepth
  memo.set(taskId, depth)
  return depth
}

export default function WeeklyPlannerPage() {
  const today = new Date()
  const { tasks, projects, goals, updateTask, updateTasks, toggleTaskComplete } = useNerveStore()
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [previewTasks, setPreviewTasks] = useState<Task[] | null>(null)
  const [isAiPlanning, setIsAiPlanning] = useState(false)
  const [aiGenerated, setAiGenerated] = useState(false)
  const [aiReasoning, setAiReasoning] = useState<string>("")
  const [aiError, setAiError] = useState<string>("")

  const currentTasks = previewTasks ?? tasks
  
  // Drag state
  const [dragging, setDragging] = useState<{ taskId: string; from: number | "unscheduled" } | null>(null)
  const [dragOver, setDragOver] = useState<number | "unscheduled" | null>(null)

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

  // Map task objects dynamically to their scheduled dates
  const weekPlan = useMemo(() => {
    const map: Record<number, Task[]> = {}
    weekDates.forEach((date, i) => {
      const dateStr = formatDateKey(date)
      map[i] = currentTasks.filter((t) => t.scheduledDate === dateStr)
    })
    return map
  }, [currentTasks, weekDates])

  // Filter tasks that have not been scheduled yet
  const unscheduledTasks = useMemo(() => {
    return currentTasks.filter((t) => !t.scheduledDate && t.status !== "completed")
  }, [currentTasks])

  const handleDragStart = (taskId: string, from: number | "unscheduled") => {
    setDragging({ taskId, from })
  }

  const handleDrop = (to: number | "unscheduled") => {
    if (!dragging) return
    const { taskId } = dragging

    const targetTask = currentTasks.find((t) => t.id === taskId)
    if (!targetTask) return

    let updatedTask: Task
    if (to === "unscheduled") {
      updatedTask = {
        ...targetTask,
        scheduledDate: undefined,
        scheduledBlock: undefined,
      }
    } else {
      const dateStr = formatDateKey(weekDates[to])
      updatedTask = {
        ...targetTask,
        scheduledDate: dateStr,
      }
    }

    if (previewTasks) {
      const updated = previewTasks.map((t) => (t.id === taskId ? updatedTask : t))
      setPreviewTasks(updated)
    } else {
      updateTask(updatedTask)
    }

    setDragging(null)
    setDragOver(null)
  }

  const autoPlanWeek = () => {
    // 1. Get all active, unscheduled tasks
    const activeUnscheduled = tasks.filter((t) => !t.scheduledDate && t.status !== "completed")
    if (activeUnscheduled.length === 0) return

    // 2. Build map of goals by ID for quick deadline lookup
    const goalMap = new Map(goals.map((g) => [g.id, g]))

    // 3. Heuristic scoring for each task
    const memo = new Map<string, number>()
    const scoredTasks = activeUnscheduled.map((task) => {
      let score = 0

      // Priority points
      if (task.priority === "critical") score += 100
      else if (task.priority === "high") score += 70
      else if (task.priority === "medium") score += 40
      else if (task.priority === "low") score += 10

      // XP value bonus
      score += task.xp * 0.1

      // Goal deadline check
      if (task.goalId) {
        const goal = goalMap.get(task.goalId)
        if (goal && goal.deadline) {
          try {
            const deadlineDate = new Date(goal.deadline)
            const diffTime = deadlineDate.getTime() - today.getTime()
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            if (diffDays >= 0 && diffDays <= 7) {
              score += 150 // Urgent deadline within a week!
            } else if (diffDays > 7 && diffDays <= 14) {
              score += 50 // Moderately near deadline
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }

      const duration = parseEstimatedMinutes(task.estimatedTime)
      const depth = getTaskDepth(task.id, tasks, memo)

      return { task, score, duration, depth }
    })

    // Sort tasks by depth (ascending, prerequisites first) then score (descending)
    scoredTasks.sort((a, b) => {
      if (a.depth !== b.depth) return a.depth - b.depth
      return b.score - a.score
    })

    // 4. Distribute tasks across week days
    let updatedTasks = [...tasks]

    // Load capacities from local storage
    let dailyCapacities: Record<string, number> = { "Mon": 5, "Tue": 5, "Wed": 5, "Thu": 5, "Fri": 5, "Sat": 5, "Sun": 5 }
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("nerve_daily_capacities")
      if (stored) {
        try {
          dailyCapacities = JSON.parse(stored)
        } catch (e) {
          // ignore
        }
      }
    }

    // Create tracking structure for day workloads
    const dayWorkloads = [...Array(7)].map((_, i) => {
      const dayName = DAYS[i]
      const capacityHours = dailyCapacities[dayName] ?? 5
      return {
        index: i,
        dayName,
        dateKey: formatDateKey(weekDates[i]),
        minutes: 0,
        taskCount: 0,
        maxMinutes: capacityHours * 60,
      }
    })

    const MAX_TASKS_PER_DAY = 4

    scoredTasks.forEach(({ task, duration }) => {
      let earliestDayIdx = 0
      if (task.dependsOnTaskId) {
        const prereqTask = updatedTasks.find((t) => t.id === task.dependsOnTaskId)
        if (prereqTask) {
          if (prereqTask.status !== "completed") {
            if (prereqTask.scheduledDate) {
              const prereqDayIdx = weekDates.findIndex((d) => formatDateKey(d) === prereqTask.scheduledDate)
              if (prereqDayIdx !== -1) {
                earliestDayIdx = prereqDayIdx + 1
              } else {
                earliestDayIdx = Infinity // Scheduled in future or past week (rolled over)
              }
            } else {
              earliestDayIdx = Infinity // Prerequisite is unscheduled
            }
          }
        }
      }

      if (earliestDayIdx >= dayWorkloads.length) return // Blocked this week

      let bestDay = null
      let minMinutes = Infinity

      for (let i = earliestDayIdx; i < dayWorkloads.length; i++) {
        const day = dayWorkloads[i]
        const fitsTasks = day.taskCount < MAX_TASKS_PER_DAY
        const fitsMinutes = day.minutes + duration <= day.maxMinutes

        if (fitsTasks && fitsMinutes) {
          if (day.minutes < minMinutes) {
            minMinutes = day.minutes
            bestDay = day
          }
        }
      }

      if (bestDay) {
        bestDay.minutes += duration
        bestDay.taskCount += 1
        
        updatedTasks = updatedTasks.map((t) =>
          t.id === task.id ? { ...t, scheduledDate: bestDay.dateKey } : t
        )
      }
    })

    setPreviewTasks(updatedTasks)
  }

  const handleCancelPreview = () => {
    setPreviewTasks(null)
    setAiGenerated(false)
    setAiReasoning("")
    setAiError("")
  }

  const handleRegeneratePreview = () => {
    autoPlanWeekAI()
  }

  const handleAcceptPreview = () => {
    if (!previewTasks) return
    updateTasks(previewTasks)
    setPreviewTasks(null)
    setAiGenerated(false)
    setAiReasoning("")
    setAiError("")
  }

  const autoPlanWeekAI = async () => {
    setIsAiPlanning(true)
    setAiError("")

    // Load daily capacities from localStorage
    let dailyCapacities: Record<string, number> = { "Mon": 5, "Tue": 5, "Wed": 5, "Thu": 5, "Fri": 5, "Sat": 5, "Sun": 5 }
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("nerve_daily_capacities")
      if (stored) {
        try { dailyCapacities = JSON.parse(stored) } catch { /* ignore */ }
      }
    }

    const weekDateKeys = weekDates.map((d) => formatDateKey(d))

    // ALWAYS use original store `tasks` for the API call.
    // Regenerate should always produce a fresh plan from the base state —
    // never from the preview snapshot (which may have all tasks already scheduled).
    const baseTasks = tasks.filter((t) => t.status !== "completed")
    const hasUnscheduled = baseTasks.some((t) => !t.scheduledDate)

    if (!hasUnscheduled) {
      setAiError("No unscheduled tasks to plan — drag a task to the Unscheduled Pool first.")
      setIsAiPlanning(false)
      return
    }

    try {
      const res = await fetch("/api/ai-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: baseTasks,
          goals,
          projects,
          weekDates: weekDateKeys,
          dailyCapacities,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(err.error ?? `HTTP ${res.status}`)
      }

      const data = await res.json()

      if (data.fallback) {
        throw new Error(data.error ?? "Groq API error")
      }

      if (!data.assignments?.length) {
        setAiError("AI found no tasks to schedule — all tasks may already be on the calendar.")
        setIsAiPlanning(false)
        return
      }

      // Apply AI assignments onto the BASE tasks (not preview), then set as new preview
      const assignMap = new Map<string, string>(
        data.assignments.map((a: { taskId: string; dateKey: string }) => [a.taskId, a.dateKey])
      )

      const updatedTasks = tasks.map((t) => {
        if (assignMap.has(t.id)) {
          return { ...t, scheduledDate: assignMap.get(t.id)! }
        }
        return t
      })

      setPreviewTasks(updatedTasks)
      setAiGenerated(true)
      setAiReasoning(data.reasoning ?? "")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      setAiError(`AI planning failed (${msg}). Falling back to local algorithm.`)
      autoPlanWeek()
      setAiGenerated(false)
    } finally {
      setIsAiPlanning(false)
    }
  }

  const handleToggleComplete = (taskId: string) => {
    if (previewTasks) {
      const nextTasks = previewTasks.map((t) => {
        if (t.id === taskId) {
          const newStatus = t.status === "completed" ? ("todo" as const) : ("completed" as const)
          return { ...t, status: newStatus }
        }
        return t
      })
      setPreviewTasks(nextTasks)
    } else {
      toggleTaskComplete(taskId)
    }
  }

  const totalTasks = Object.values(weekPlan).flat().length
  const totalXP = Object.values(weekPlan).flat().reduce((s, t) => s + (t.status === "completed" ? 0 : t.xp), 0)

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <SectionHeader
        title="Weekly Planner"
        subtitle="See the full week. Move fast, stay balanced."
        action={
          !previewTasks && (
            <button
              onClick={autoPlanWeekAI}
              disabled={unscheduledTasks.length === 0 || isAiPlanning}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all border-0",
                unscheduledTasks.length === 0 || isAiPlanning
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                  : "bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-indigo-500/10 hover:scale-[1.02] active:scale-[0.98]"
              )}
              title={unscheduledTasks.length === 0 ? "No unscheduled tasks available to plan" : "AI-powered weekly planning"}
            >
              {isAiPlanning ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> AI is planning...</>
              ) : (
                <><BrainCircuit className="w-4 h-4" /> Plan My Week</>  
              )}
            </button>
          )
        }
      />

      {aiError && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-5 py-3 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
          <span>{aiError}</span>
          <button onClick={() => setAiError("")} className="ml-auto text-amber-500 hover:text-amber-700 font-bold text-xs cursor-pointer border-0 bg-transparent">✕</button>
        </div>
      )}

      {previewTasks && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-5 shadow-lg flex flex-col gap-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                {aiGenerated ? (
                  <><BrainCircuit className="w-5 h-5" /> <span>AI Weekly Plan Preview</span> <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full">⚡ AI-generated</span></>
                ) : (
                  <><Sparkles className="w-5 h-5 animate-pulse" /> Planner Preview</>
                )}
              </h3>
              <p className="text-sm text-blue-100 mt-0.5">
                Drag tasks to adjust, then accept or regenerate.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleCancelPreview}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all border-0 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRegeneratePreview}
                disabled={isAiPlanning}
                className="bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all border-0 cursor-pointer flex items-center gap-1.5"
              >
                {isAiPlanning ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Regenerating...</> : "Regenerate"}
              </button>
              <button
                onClick={handleAcceptPreview}
                className="bg-white text-blue-600 hover:bg-blue-50 px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-md border-0 cursor-pointer"
              >
                Accept Plan
              </button>
            </div>
          </div>
          {aiReasoning && (
            <div className="bg-white/10 rounded-xl px-4 py-3 text-sm text-blue-50 border border-white/10">
              <span className="font-semibold text-white">AI Strategy: </span>{aiReasoning}
            </div>
          )}
        </div>
      )}

      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-[#FFFFFF] border border-slate-200 rounded-2xl px-5 py-4">
        <button onClick={prevWeek} className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition-all">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <p className="text-base font-bold text-[#0F172A]">{formatWeekRange(weekDates)}</p>
          <p className="text-xs text-[#64748B] mt-0.5">{totalTasks} tasks planned · {totalXP} XP potential</p>
        </div>
        <button onClick={nextWeek} className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition-all">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Two-Column Planning Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Main 7-Day Grid (3 Columns) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-7 gap-3">
            {DAYS.map((day, i) => {
              const date = weekDates[i]
              const dayTasks = weekPlan[i] ?? []
              const todayActive = isToday(date)
              const isDragTarget = dragOver === i

              return (
                <div
                  key={i}
                  className={cn(
                    "bg-[#FFFFFF] border rounded-2xl p-3 min-h-[340px] flex flex-col transition-all duration-150",
                    todayActive ? "border-[#2563EB]/40 bg-blue-50/5" : "border-slate-200",
                    isDragTarget ? "bg-[#2563EB]/5 border-[#2563EB]/30 shadow-inner" : ""
                  )}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(i) }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={() => handleDrop(i)}
                >
                  {/* Day Header */}
                  <div className="mb-3 text-center">
                    <p className={cn("text-xs font-semibold uppercase tracking-wider", todayActive ? "text-[#2563EB]" : "text-[#64748B]")}>
                      {day}
                    </p>
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold mx-auto mt-1",
                      todayActive ? "bg-[#2563EB] text-white" : "text-[#0F172A]"
                    )}>
                      {date.getDate()}
                    </div>
                    {dayTasks.length > 0 && (
                      <div className="flex items-center justify-center gap-1 mt-1.5">
                        <Zap className="w-2.5 h-2.5 text-[#8B5CF6]" />
                        <span className="text-[10px] text-[#8B5CF6] font-semibold">
                          {dayTasks.reduce((s, t) => s + (t.status === "completed" ? 0 : t.xp), 0)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tasks Container */}
                  <div className="flex-1 space-y-1.5">
                    {dayTasks.map((task) => {
                      const project = projects.find((p) => p.id === task.projectId)
                      const isCompleted = task.status === "completed"
                      const isTentative = previewTasks && !tasks.find((t) => t.id === task.id)?.scheduledDate
                      
                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={() => handleDragStart(task.id, i)}
                          className={cn(
                            "group flex items-start gap-1.5 border rounded-xl p-2 cursor-grab transition-all",
                            isCompleted ? "opacity-60 border-slate-100 bg-slate-100/50" :
                            isTentative ? "bg-[#F5F3FF] border-dashed border-[#8B5CF6]/50 hover:bg-[#EDE9FE]" :
                            "bg-slate-50 border-slate-200 hover:bg-slate-100"
                          )}
                        >
                          <GripVertical className="w-3 h-3 text-[#64748B]/40 mt-1 shrink-0 cursor-grab" />
                          
                          {/* Inline Checkbox to Complete Task */}
                          <div className="flex items-center shrink-0 mt-0.5">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleComplete(task.id) }}
                              className={cn(
                                "w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all",
                                isCompleted
                                  ? "bg-emerald-500 border-emerald-500 text-white"
                                  : "border-slate-300 hover:border-slate-400 bg-white"
                              )}
                            >
                              {isCompleted && (
                                <svg className="w-2 h-2 fill-current" viewBox="0 0 20 20">
                                  <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                                </svg>
                              )}
                            </button>
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className={cn(
                              "text-[11px] font-medium text-[#0F172A] leading-snug line-clamp-2",
                              isCompleted ? "line-through text-[#64748B]" : ""
                            )}>
                              {task.title}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              {project && (
                                <p className="text-[9px] truncate font-semibold" style={{ color: project.color }}>
                                  {project.icon} {project.name}
                                </p>
                              )}
                              {isTentative && (
                                <span className="inline-flex items-center gap-0.5 bg-[#8B5CF6]/10 text-[#8B5CF6] text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                  <Sparkles className="w-2 h-2 animate-pulse" /> AI Plan
                                </span>
                              )}
                            </div>
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

          {/* Workload Summary Graph */}
          <div className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-4">Workload Overview</h3>
            <div className="grid grid-cols-7 gap-3">
              {DAYS.map((day, i) => {
                const count = (weekPlan[i] ?? []).length
                const maxTasks = 5
                const height = Math.max(4, (count / maxTasks) * 48)
                const todayActive = isToday(weekDates[i])
                return (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className="w-full h-12 flex items-end justify-center">
                      <div
                        className="w-full rounded-t-lg transition-all duration-500"
                        style={{
                          height: `${height}px`,
                          background: todayActive ? "#2563EB" : count > 3 ? "#EF4444" : count > 1 ? "#10B981" : "#E2E8F0",
                        }}
                      />
                    </div>
                    <span className={cn("text-[11px] font-medium", todayActive ? "text-[#2563EB]" : "text-[#64748B]")}>{day}</span>
                    <span className="text-[10px] text-[#64748B]">{count}t</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Unscheduled Sidebar (1 Column) */}
        <div className="lg:col-span-1">
          <div
            className={cn(
              "bg-[#FFFFFF] border rounded-2xl p-4 min-h-[500px] flex flex-col transition-all duration-150",
              dragOver === "unscheduled" ? "border-[#2563EB]/40 bg-blue-50/5" : "border-slate-200"
            )}
            onDragOver={(e) => { e.preventDefault(); setDragOver("unscheduled") }}
            onDragLeave={() => setDragOver(null)}
            onDrop={() => handleDrop("unscheduled")}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#0F172A]">Unscheduled Pool</h3>
              <span className="bg-slate-100 text-[#64748B] px-2 py-0.5 rounded-full text-xs font-semibold">
                {unscheduledTasks.length}
              </span>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto max-h-[550px] pr-1">
              {unscheduledTasks.map((task) => {
                const project = projects.find((p) => p.id === task.projectId)
                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task.id, "unscheduled")}
                    className="group flex items-start gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-2.5 cursor-grab hover:bg-slate-100 transition-all shadow-sm hover:shadow"
                  >
                    <GripVertical className="w-3.5 h-3.5 text-[#64748B]/40 mt-0.5 shrink-0 cursor-grab" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[#0F172A] leading-snug line-clamp-2">
                        {task.title}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        {project ? (
                          <span className="text-[10px] font-semibold truncate max-w-[80px]" style={{ color: project.color }}>
                            {project.icon} {project.name}
                          </span>
                        ) : (
                          <span />
                        )}
                        <PriorityBadge priority={task.priority} />
                      </div>
                    </div>
                  </div>
                )
              })}

              {unscheduledTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center h-48 border border-dashed border-slate-200 rounded-xl px-4 text-center">
                  <p className="text-xs text-[#64748B]">All tasks scheduled!</p>
                  <p className="text-[10px] text-[#64748B]/60 mt-1">Drag tasks back here to unschedule them.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
