"use client"

import { Clock, CheckSquare, Zap, Flame, TrendingUp } from "lucide-react"
import { ProgressBar, SectionHeader } from "@/components/nerve/ui"
import { SAMPLE_PROJECTS, SAMPLE_TASKS } from "@/lib/nerve-data"

const WEEK_FOCUS = [2.5, 4, 3.5, 5, 3, 1, 2]
const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const WEEK_XP = [120, 280, 210, 380, 150, 60, 40]
const MAX_FOCUS = Math.max(...WEEK_FOCUS)
const MAX_XP = Math.max(...WEEK_XP)

const ACTIVITY_DATA = [...Array(35)].map((_, i) => ({
  day: i,
  level: Math.random() > 0.3 ? Math.floor(Math.random() * 4) + 1 : 0,
}))

function ActivitySquare({ level }: { level: number }) {
  const colors = [
    "bg-slate-50",
    "bg-[#2563EB]/20",
    "bg-[#2563EB]/40",
    "bg-[#2563EB]/70",
    "bg-[#2563EB]",
  ]
  return (
    <div className={`w-4 h-4 rounded-sm ${colors[level]} transition-all`} />
  )
}

export default function StatisticsPage() {
  const completedTasks = SAMPLE_TASKS.filter((t) => t.status === "completed").length
  const totalTasks = SAMPLE_TASKS.length

  return (
    <div className="max-w-4xl mx-auto">
      <SectionHeader
        title="Statistics"
        subtitle="Your performance at a glance."
      />

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
        {[
          { label: "Total Focus Time", value: "24h 40m", sub: "This month", icon: <Clock className="w-4 h-4" />, accent: "#2563EB" },
          { label: "Tasks Completed", value: `${completedTasks}/${totalTasks}`, sub: "This week", icon: <CheckSquare className="w-4 h-4" />, accent: "#10B981" },
          { label: "XP Earned", value: "4,820", sub: "This month", icon: <Zap className="w-4 h-4" />, accent: "#8B5CF6" },
          { label: "Current Streak", value: "12 days", sub: "Best: 18 days", icon: <Flame className="w-4 h-4" />, accent: "#F59E0B" },
        ].map((s) => (
          <div key={s.label} className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[#64748B] uppercase tracking-wider font-medium">{s.label}</span>
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
        <div className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <Clock className="w-4 h-4 text-[#2563EB]" />
            <h2 className="text-sm font-semibold text-[#0F172A]">Focus Time — This Week</h2>
          </div>
          <div className="flex items-end gap-2 h-36">
            {WEEK_FOCUS.map((val, i) => {
              const height = (val / MAX_FOCUS) * 100
              const isToday = i === 4
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
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white text-[#0F172A] text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-slate-200">
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
        <div className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <Zap className="w-4 h-4 text-[#8B5CF6]" />
            <h2 className="text-sm font-semibold text-[#0F172A]">XP Earned — This Week</h2>
          </div>
          <div className="flex items-end gap-2 h-36">
            {WEEK_XP.map((val, i) => {
              const height = (val / MAX_XP) * 100
              const isToday = i === 4
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
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white text-[#0F172A] text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-slate-200">
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
        <div className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-[#10B981]" />
            <h2 className="text-sm font-semibold text-[#0F172A]">Project Progress</h2>
          </div>
          <div className="space-y-4">
            {SAMPLE_PROJECTS.map((p) => (
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
            ))}
          </div>
        </div>

        {/* Activity heatmap */}
        <div className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-5">
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
              <ActivitySquare key={l} level={l} />
            ))}
            <span className="text-xs text-[#64748B]">More</span>
          </div>

          {/* Weekly summary */}
          <div className="mt-5 pt-4 border-t border-slate-200">
            <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-3">Weekly Summary</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Avg Focus", value: "3.1h/day" },
                { label: "Best Day", value: "Thu 5h" },
                { label: "Completion", value: "78%" },
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
