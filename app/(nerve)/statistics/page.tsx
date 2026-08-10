"use client"

import { useMemo } from "react"
import { Clock, CheckSquare, Zap, Flame, TrendingUp } from "lucide-react"
import { ProgressBar, SectionHeader } from "@/components/nerve/ui"
import { useNerveStore } from "@/lib/nerve-store"

function getWeekDates(d: Date) {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const start = new Date(d.setDate(diff))
  return [...Array(7)].map((_, i) => {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    return date
  })
}

function ActivitySquare({ level }: { level: number }) {
  const colors = [
    "bg-slate-50 border border-slate-100",
    "bg-[#2563EB]/20 border border-[#2563EB]/10",
    "bg-[#2563EB]/40 border border-[#2563EB]/20",
    "bg-[#2563EB]/70 border border-[#2563EB]/40",
    "bg-[#2563EB] border border-[#2563EB]/60",
  ]
  return (
    <div className={`w-full aspect-square rounded-md ${colors[level]} transition-all`} />
  )
}

export default function StatisticsPage() {
  const { tasks, projects, userXp, streak } = useNerveStore()

  // 1. Calculations for dynamic week data
  const weekDates = useMemo(() => getWeekDates(new Date()), [])
  const dateKeys = useMemo(() => {
    return weekDates.map((date) => {
      const yyyy = date.getFullYear()
      const mm = String(date.getMonth() + 1).padStart(2, "0")
      const dd = String(date.getDate()).padStart(2, "0")
      return `${yyyy}-${mm}-${dd}`
    })
  }, [weekDates])

  const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  const WEEK_FOCUS = useMemo(() => {
    return dateKeys.map((key) => {
      const dayTasks = tasks.filter((t) => t.scheduledDate === key)
      const seconds = dayTasks.reduce((sum, t) => sum + (t.actualTime ?? 0), 0)
      return parseFloat((seconds / 3600).toFixed(1))
    })
  }, [tasks, dateKeys])

  const WEEK_XP = useMemo(() => {
    return dateKeys.map((key) => {
      const dayTasks = tasks.filter((t) => t.scheduledDate === key && t.status === "completed")
      return dayTasks.reduce((sum, t) => sum + t.xp, 0)
    })
  }, [tasks, dateKeys])

  const MAX_FOCUS = useMemo(() => {
    const m = Math.max(...WEEK_FOCUS)
    return m === 0 ? 1 : m
  }, [WEEK_FOCUS])

  const MAX_XP = useMemo(() => {
    const m = Math.max(...WEEK_XP)
    return m === 0 ? 100 : m
  }, [WEEK_XP])

  // 2. Metrics for cards
  const completedTasks = useMemo(() => tasks.filter((t) => t.status === "completed").length, [tasks])
  const totalTasks = tasks.length

  const totalFocusSeconds = useMemo(() => tasks.reduce((sum, t) => sum + (t.actualTime ?? 0), 0), [tasks])
  const totalFocusTimeStr = useMemo(() => {
    const hrs = Math.floor(totalFocusSeconds / 3600)
    const mins = Math.round((totalFocusSeconds % 3600) / 60)
    if (hrs === 0) return `${mins}m`
    return `${hrs}h ${mins}m`
  }, [totalFocusSeconds])

  // 3. Heatmap logic for last 35 days
  const ACTIVITY_DATA = useMemo(() => {
    return [...Array(35)].map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (34 - i))
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, "0")
      const dd = String(d.getDate()).padStart(2, "0")
      const dateKey = `${yyyy}-${mm}-${dd}`
      
      const completedCount = tasks.filter((t) => t.scheduledDate === dateKey && t.status === "completed").length
      let level = 0
      if (completedCount === 1) level = 1
      else if (completedCount === 2) level = 2
      else if (completedCount === 3) level = 3
      else if (completedCount > 3) level = 4
      
      return { day: i, level }
    })
  }, [tasks])

  // 4. Summaries
  const avgFocusStr = useMemo(() => {
    const totalHrs = WEEK_FOCUS.reduce((sum, v) => sum + v, 0)
    return `${(totalHrs / 7).toFixed(1)}h/day`
  }, [WEEK_FOCUS])

  const bestDayStr = useMemo(() => {
    let maxIdx = 0
    let maxVal = -1
    WEEK_FOCUS.forEach((val, i) => {
      if (val > maxVal) {
        maxVal = val
        maxIdx = i
      }
    })
    return maxVal === 0 ? "None" : `${WEEK_LABELS[maxIdx]} ${maxVal}h`
  }, [WEEK_FOCUS])

  const completionRatePctStr = useMemo(() => {
    if (totalTasks === 0) return "0%"
    return `${Math.round((completedTasks / totalTasks) * 100)}%`
  }, [completedTasks, totalTasks])

  return (
    <div className="max-w-4xl mx-auto">
      <SectionHeader
        title="Statistics"
        subtitle="Your performance at a glance."
      />

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
        {[
          { label: "Total Focus Time", value: totalFocusTimeStr, sub: "All-time", icon: <Clock className="w-4 h-4" />, accent: "#2563EB" },
          { label: "Tasks Completed", value: `${completedTasks}/${totalTasks}`, sub: "This week", icon: <CheckSquare className="w-4 h-4" />, accent: "#10B981" },
          { label: "XP Earned", value: userXp.toLocaleString(), sub: "Total balance", icon: <Zap className="w-4 h-4" />, accent: "#8B5CF6" },
          { label: "Current Streak", value: `${streak} day${streak !== 1 ? 's' : ''}`, sub: "Active count", icon: <Flame className="w-4 h-4" />, accent: "#F59E0B" },
        ].map((s) => (
          <div key={s.label} className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">{s.label}</span>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: `${s.accent}18` }}
              >
                <span style={{ color: s.accent }}>{s.icon}</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-[#0F172A]">{s.value}</p>
            <p className="text-xs text-[#64748B] mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Focus Time chart */}
        <div className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Clock className="w-4 h-4 text-[#2563EB]" />
            <h2 className="text-sm font-semibold text-[#0F172A]">Focus Time — This Week</h2>
          </div>
          <div className="flex items-end gap-2 h-36">
            {WEEK_FOCUS.map((val, i) => {
              const height = (val / MAX_FOCUS) * 100
              const isToday = new Date().getDay() === (i === 6 ? 0 : i + 1)
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center justify-end" style={{ height: "120px" }}>
                    <div
                      className="w-full rounded-t-lg transition-all duration-500 hover:opacity-90 cursor-pointer relative group"
                      style={{
                        height: `${height}%`,
                        background: isToday ? "linear-gradient(180deg, #2563EB 0%, #1D4ED8 100%)" : "rgba(37,99,235,0.25)",
                        minHeight: "4px",
                      }}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white text-[#0F172A] text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-slate-200 shadow-md">
                        {val}h
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-[#64748B]">{WEEK_LABELS[i]}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* XP chart */}
        <div className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Zap className="w-4 h-4 text-[#8B5CF6]" />
            <h2 className="text-sm font-semibold text-[#0F172A]">XP Earned — This Week</h2>
          </div>
          <div className="flex items-end gap-2 h-36">
            {WEEK_XP.map((val, i) => {
              const height = (val / MAX_XP) * 100
              const isToday = new Date().getDay() === (i === 6 ? 0 : i + 1)
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center justify-end" style={{ height: "120px" }}>
                    <div
                      className="w-full rounded-t-lg transition-all duration-500 hover:opacity-90 cursor-pointer relative group"
                      style={{
                        height: `${height}%`,
                        background: isToday ? "linear-gradient(180deg, #8B5CF6 0%, #6D28D9 100%)" : "rgba(139,92,246,0.25)",
                        minHeight: "4px",
                      }}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white text-[#0F172A] text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-slate-200 shadow-md">
                        {val} XP
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-[#64748B]">{WEEK_LABELS[i]}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Project Progress */}
        <div className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-[#10B981]" />
            <h2 className="text-sm font-semibold text-[#0F172A]">Project Progress</h2>
          </div>
          <div className="space-y-4">
            {projects.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#64748B]">
                No projects active. Create a project to view progress metrics.
              </div>
            ) : (
              projects.map((p) => (
                <div key={p.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base leading-none">{p.icon}</span>
                      <span className="text-sm font-medium text-[#0F172A]">{p.name}</span>
                    </div>
                    <span className="text-sm font-bold text-[#0F172A]">{p.progress}%</span>
                  </div>
                  <ProgressBar value={p.progress} color={p.color} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Activity heatmap */}
        <div className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Flame className="w-4 h-4 text-[#F59E0B]" />
            <h2 className="text-sm font-semibold text-[#0F172A]">Activity — Last 35 Days</h2>
          </div>
          <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
            {ACTIVITY_DATA.map((d) => (
              <ActivitySquare key={d.day} level={d.level} />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-4">
            <span className="text-xs text-[#64748B]">Less</span>
            {[0,1,2,3,4].map((l) => (
              <div key={l} className="w-4 h-4">
                <ActivitySquare level={l} />
              </div>
            ))}
            <span className="text-xs text-[#64748B]">More</span>
          </div>

          {/* Weekly summary */}
          <div className="mt-5 pt-4 border-t border-slate-200">
            <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-3">Weekly Summary</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Avg Focus", value: avgFocusStr },
                { label: "Best Day", value: bestDayStr },
                { label: "Completion", value: completionRatePctStr },
              ].map((s) => (
                <div key={s.label} className="text-center bg-slate-50 rounded-xl p-2.5">
                  <p className="text-sm font-bold text-[#0F172A]">{s.value}</p>
                  <p className="text-[10px] text-[#64748B] mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
