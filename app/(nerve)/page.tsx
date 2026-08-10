"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Zap,
  Clock,
  CheckSquare,
  TrendingUp,
  PlayCircle,
  Moon,
  Coffee,
  Sun,
  ChevronRight,
  ChevronDown,
  CalendarDays,
  FolderKanban,
  Target,
  Sparkles,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProgressBar, PriorityBadge, StatusBadge } from "@/components/nerve/ui"
import { useNerveStore } from "@/lib/nerve-store"
import { type Project, type Goal, type Task } from "@/lib/nerve-data"
import Link from "next/link"
import { cn } from "@/lib/utils"

const BLOCKS = [
  { id: "morning", label: "Morning", time: "6:00 — 12:00", icon: "🌅", color: "#F59E0B" },
  { id: "afternoon", label: "Afternoon", time: "12:00 — 17:00", icon: "☀️", color: "#2563EB" },
  { id: "evening", label: "Evening", time: "17:00 — 22:00", icon: "🌙", color: "#8B5CF6" },
]

export default function DashboardPage() {
  const { projects, goals, tasks, userXp, toggleTaskComplete } = useNerveStore()
  const [greeting, setGreeting] = useState("Hello")
  const [greetingIcon, setGreetingIcon] = useState<React.ReactNode>(null)
  const [dateStr, setDateStr] = useState("")

  // Navigation states for the interactive project explorer
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null)

  useEffect(() => {
    const today = new Date()
    const hours = today.getHours()
    const greet = hours < 12 ? "Good morning" : hours < 17 ? "Good afternoon" : "Good evening"
    const icon =
      hours < 12 ? (
        <Coffee className="w-5 h-5 text-[#2563EB]" />
      ) : hours < 17 ? (
        <Sun className="w-5 h-5 text-[#F59E0B]" />
      ) : (
        <Moon className="w-5 h-5 text-[#8B5CF6]" />
      )
    const ds = today.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
    setGreeting(greet)
    setGreetingIcon(icon)
    setDateStr(ds)
  }, [])

  // 1. Get today's planned tasks from the global store
  const todayStr = useMemo(() => {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
  }, [])

  const todayTasksList = useMemo(() => {
    return tasks.filter((t) => t.scheduledDate === todayStr)
  }, [tasks, todayStr])

  const todayTasksByBlock = useMemo(() => {
    const map: Record<string, Task[]> = { morning: [], afternoon: [], evening: [], flexible: [] }
    todayTasksList.forEach((task) => {
      if (task.scheduledBlock === "morning" || task.scheduledBlock === "afternoon" || task.scheduledBlock === "evening") {
        map[task.scheduledBlock].push(task)
      } else {
        map.flexible.push(task)
      }
    })
    return map
  }, [todayTasksList])

  const totalTodayTasks = todayTasksList.length
  const completedToday = todayTasksList.filter((t) => t.status === "completed").length
  const todayProgressPct = totalTodayTasks > 0 ? Math.round((completedToday / totalTodayTasks) * 100) : 0

  // 2. Weekly Goals Completion stats
  const totalGoals = goals.length
  const completedGoals = goals.filter((g) => g.completionPct === 100).length
  const weeklyProgressPct = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0

  const hasTasksScheduled = totalTodayTasks > 0

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header greeting */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {greetingIcon}
            <p className="text-sm text-[#64748B] font-medium">{dateStr}</p>
          </div>
          <h1 className="text-3xl font-bold text-[#0F172A] tracking-tight">{greeting}, Alex</h1>
          <p className="text-[#64748B] mt-1 text-sm">Here is your plan for focused execution today.</p>
        </div>
      </div>

      {/* Progress Dashboard (Main stats) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Today's Tasks Progress Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-[0_4px_12px_rgba(15,23,42,0.02)]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Today's Focus Progress</span>
              <span className="text-xs font-semibold text-[#2563EB] bg-[#2563EB]/10 px-2.5 py-0.5 rounded-full">
                {completedToday}/{totalTodayTasks} Tasks
              </span>
            </div>
            <p className="text-3xl font-black text-[#0F172A]">{todayProgressPct}% Complete</p>
          </div>
          <div className="mt-5">
            <ProgressBar value={todayProgressPct} color="#2563EB" height="h-2.5" />
            <p className="text-xs text-[#64748B] mt-2">
              {todayProgressPct === 100 ? "Amazing! All tasks completed today 🚀" : "Complete tasks to increase daily progress."}
            </p>
          </div>
        </div>

        {/* Weekly Goals Progress Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-[0_4px_12px_rgba(15,23,42,0.02)]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">This Week's Goal Progress</span>
              <span className="text-xs font-semibold text-[#8B5CF6] bg-[#8B5CF6]/10 px-2.5 py-0.5 rounded-full">
                {completedGoals}/{totalGoals} Goals
              </span>
            </div>
            <p className="text-3xl font-black text-[#0F172A]">{weeklyProgressPct}% Complete</p>
          </div>
          <div className="mt-5">
            <ProgressBar value={weeklyProgressPct} color="#8B5CF6" height="h-2.5" />
            <p className="text-xs text-[#64748B] mt-2">
              Goal achieves 100% when all its associated tasks are finished.
            </p>
          </div>
        </div>
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: TODAY'S FOCUS LIST (5 columns) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_4px_12px_rgba(15,23,42,0.02)]">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">Today's Schedule</h2>
              <Link href="/daily">
                <Button variant="outline" size="xs" className="rounded-lg text-xs font-semibold">
                  Adjust Plan
                </Button>
              </Link>
            </div>

            {!hasTasksScheduled ? (
              <div className="py-12 text-center">
                <CalendarDays className="w-8 h-8 text-[#94A3B8] mx-auto mb-3" />
                <h3 className="text-sm font-bold text-[#0F172A] mb-1">No tasks scheduled today</h3>
                <p className="text-xs text-[#64748B] max-w-[240px] mx-auto mb-4 leading-relaxed">
                  Start your day by choosing which tasks to complete.
                </p>
                <Link href="/daily">
                  <Button className="nerve-gradient-blue text-white border-0 rounded-xl font-semibold hover:opacity-90">
                    Plan My Day
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {BLOCKS.map((block) => {
                  const blockTasks = todayTasksByBlock[block.id] ?? []
                  if (blockTasks.length === 0) return null

                  return (
                    <div key={block.id} className="space-y-2">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-base">{block.icon}</span>
                        <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">{block.label}</span>
                        <span className="text-[10px] text-[#64748B]">({block.time})</span>
                      </div>
                      <div className="space-y-2">
                        {blockTasks.map((task) => {
                          const isCompleted = task.status === "completed"
                          return (
                            <div
                              key={task.id}
                              className={cn(
                                "flex items-center gap-3 border rounded-xl p-3 transition-all",
                                isCompleted
                                  ? "border-slate-100 bg-slate-50/50 opacity-60"
                                  : "border-slate-200 hover:border-slate-300 bg-white"
                              )}
                            >
                              <button
                                onClick={() => toggleTaskComplete(task.id)}
                                className={cn(
                                  "w-5 h-5 rounded-md border shrink-0 flex items-center justify-center transition-all",
                                  isCompleted
                                    ? "border-[#10B981] bg-[#10B981]/10"
                                    : "border-slate-300 hover:border-[#2563EB]/50"
                                )}
                              >
                                {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />}
                              </button>
                              <div className="min-w-0 flex-1">
                                <p className={cn("text-xs font-semibold truncate", isCompleted ? "text-[#64748B] line-through" : "text-[#0F172A]")}>
                                  {task.title}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-[#64748B]">
                                  <span style={{ color: block.color }}>{task.project}</span>
                                  {task.goal && (
                                    <>
                                      <span>·</span>
                                      <span className="truncate">{task.goal}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="text-[10px] font-bold text-[#8B5CF6] flex items-center gap-0.5">
                                <Zap className="w-2.5 h-2.5" />+{task.xp}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}

                {todayTasksByBlock.flexible && todayTasksByBlock.flexible.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-base">📅</span>
                      <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Flexible / General</span>
                      <span className="text-[10px] text-[#64748B]">(Unblocked today)</span>
                    </div>
                    <div className="space-y-2">
                      {todayTasksByBlock.flexible.map((task) => {
                        const isCompleted = task.status === "completed"
                        return (
                          <div
                            key={task.id}
                            className={cn(
                              "flex items-center gap-3 border rounded-xl p-3 transition-all",
                              isCompleted
                                ? "border-slate-100 bg-slate-50/50 opacity-60"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            )}
                          >
                            <button
                              onClick={() => toggleTaskComplete(task.id)}
                              className={cn(
                                "w-5 h-5 rounded-md border shrink-0 flex items-center justify-center transition-all",
                                isCompleted
                                  ? "border-[#10B981] bg-[#10B981]/10"
                                  : "border-slate-300 hover:border-[#2563EB]/50"
                              )}
                            >
                              {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />}
                            </button>
                            <div className="min-w-0 flex-1">
                              <p className={cn("text-xs font-semibold truncate", isCompleted ? "text-[#64748B] line-through" : "text-[#0F172A]")}>
                                {task.title}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-[#64748B]">
                                <span className="text-blue-500 font-semibold">{task.project}</span>
                                {task.goal && (
                                  <>
                                    <span>·</span>
                                    <span className="truncate">{task.goal}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="text-[10px] font-bold text-[#8B5CF6] flex items-center gap-0.5">
                              <Zap className="w-2.5 h-2.5" />+{task.xp}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: PROJECT -> GOAL -> TASK EXPLORER (7 columns) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_4px_12px_rgba(15,23,42,0.02)]">
            <div className="flex items-center justify-between mb-1.5">
              <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">Projects Explorer</h2>
              <Link href="/projects" className="text-xs text-[#2563EB] hover:underline">
                Manage Projects
              </Link>
            </div>
            <p className="text-xs text-[#64748B] mb-5">Click a project to view goals, and click goals to view tasks.</p>

            <div className="space-y-3">
              {projects.map((project) => {
                const isProjectExpanded = activeProjectId === project.id
                const projectGoals = goals.filter((g) => g.projectId === project.id)

                return (
                  <div
                    key={project.id}
                    className={cn(
                      "border rounded-2xl transition-all overflow-hidden",
                      isProjectExpanded ? "border-[#2563EB]/30 shadow-[0_4px_12px_rgba(37,99,235,0.03)]" : "border-slate-200"
                    )}
                  >
                    {/* Project Header row */}
                    <button
                      onClick={() => {
                        setActiveProjectId(isProjectExpanded ? null : project.id)
                        setActiveGoalId(null) // reset open goal when changing project
                      }}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                          style={{ background: `${project.color}14`, border: `1px solid ${project.color}25` }}
                        >
                          {project.icon}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-[#0F172A] leading-tight truncate">{project.name}</h3>
                          <p className="text-[11px] text-[#64748B] mt-0.5">
                            {project.progress}% Complete · {projectGoals.length} goals
                          </p>
                        </div>
                      </div>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 text-[#64748B] transition-transform duration-200",
                          isProjectExpanded ? "rotate-180 text-[#2563EB]" : ""
                        )}
                      />
                    </button>

                    {/* Goals Accordion Body */}
                    {isProjectExpanded && (
                      <div className="bg-slate-50/50 border-t border-slate-100 p-4 space-y-2.5">
                        {projectGoals.length === 0 ? (
                          <div className="py-4 text-center">
                            <p className="text-xs text-[#64748B] italic">No goals defined yet.</p>
                            <Link href="/goals" className="mt-1.5 inline-block text-[11px] font-semibold text-[#2563EB] hover:underline">
                              + Create Goal
                            </Link>
                          </div>
                        ) : (
                          projectGoals.map((goal) => {
                            const isGoalExpanded = activeGoalId === goal.id
                            const goalTasks = tasks.filter((t) => t.goalId === goal.id)

                            return (
                              <div
                                key={goal.id}
                                className={cn(
                                  "border rounded-xl bg-white transition-all overflow-hidden",
                                  isGoalExpanded ? "border-[#2563EB]/20" : "border-slate-200"
                                )}
                              >
                                {/* Goal Row Header */}
                                <button
                                  onClick={() => setActiveGoalId(isGoalExpanded ? null : goal.id)}
                                  className="w-full flex items-center justify-between p-3.5 text-left hover:bg-slate-50/40 transition-colors"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <Target className={cn("w-4 h-4 shrink-0", goal.completionPct === 100 ? "text-[#10B981]" : "text-[#2563EB]")} />
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center justify-between gap-2 mb-1">
                                        <h4 className="text-xs font-bold text-[#0F172A] truncate">{goal.name}</h4>
                                        <span className="text-[10px] font-bold text-[#64748B] shrink-0">
                                          {goal.completionPct}% done
                                        </span>
                                      </div>
                                      <ProgressBar value={goal.completionPct} color={project.color} className="h-1" />
                                    </div>
                                  </div>
                                  <ChevronRight
                                    className={cn(
                                      "w-3.5 h-3.5 text-[#64748B] ml-3 transition-transform duration-200 shrink-0",
                                      isGoalExpanded ? "rotate-90 text-[#2563EB]" : ""
                                    )}
                                  />
                                </button>

                                {/* Tasks Accordion Body */}
                                {isGoalExpanded && (
                                  <div className="border-t border-slate-100 bg-slate-50/20 p-3 space-y-2">
                                    {goalTasks.length === 0 ? (
                                      <div className="py-2.5 text-center">
                                        <p className="text-xs text-[#64748B] italic">No tasks assigned to this goal.</p>
                                        <Link href="/tasks" className="mt-1 inline-block text-[10px] font-semibold text-[#2563EB] hover:underline">
                                          + Create Task
                                        </Link>
                                      </div>
                                    ) : (
                                      goalTasks.map((task) => {
                                        const isCompleted = task.status === "completed"
                                        return (
                                          <div
                                            key={task.id}
                                            className="flex items-center gap-2.5 bg-white border border-slate-100 rounded-lg px-3 py-2"
                                          >
                                            <button
                                              onClick={() => toggleTaskComplete(task.id)}
                                              className={cn(
                                                "w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-all",
                                                isCompleted
                                                  ? "border-[#10B981] bg-[#10B981]/10"
                                                  : "border-slate-300 hover:border-[#2563EB]/50"
                                              )}
                                            >
                                              {isCompleted && (
                                                <svg className="w-2.5 h-2.5 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                              )}
                                            </button>
                                            <span className={cn("text-xs flex-1 truncate", isCompleted ? "text-[#94A3B8] line-through" : "text-[#334155]")}>
                                              {task.title}
                                            </span>
                                            <PriorityBadge priority={task.priority} />
                                          </div>
                                        )
                                      })
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
