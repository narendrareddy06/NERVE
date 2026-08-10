"use client"

import { useState, useEffect, useRef } from "react"
import { Pause, Play, CheckCircle, SkipForward, X, Zap, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MOTIVATIONAL_QUOTES } from "@/lib/nerve-data"
import { useNerveStore } from "@/lib/nerve-store"
import { cn } from "@/lib/utils"
import Link from "next/link"

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export default function FocusPage() {
  const { tasks, toggleTaskComplete, updateTask } = useNerveStore()
  const focusTask = tasks.find((t) => t.status === "in-progress")

  const [selectedPreset, setSelectedPreset] = useState<'25m' | '45m' | '60m' | '90m' | 'custom'>('25m')
  const [customMinutes, setCustomMinutes] = useState('25')
  const [totalSeconds, setTotalSeconds] = useState(25 * 60)
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [sessionSecondsWorked, setSessionSecondsWorked] = useState(0)
  const [quoteIndex] = useState(() => Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length))
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const getSessionSeconds = (p: string, customMin: string) => {
    if (p === 'custom') {
      const m = parseFloat(customMin)
      return isNaN(m) || m <= 0 ? 25 * 60 : Math.round(m * 60)
    }
    if (p === '45m') return 45 * 60
    if (p === '60m') return 60 * 60
    if (p === '90m') return 90 * 60
    return 25 * 60
  }

  const handlePresetChange = (p: typeof selectedPreset) => {
    if (running) return
    setSelectedPreset(p)
    const secs = getSessionSeconds(p, customMinutes)
    setTotalSeconds(secs)
    setSecondsLeft(secs)
  }

  const handleCustomMinutesChange = (val: string) => {
    if (running) return
    setCustomMinutes(val)
    const secs = getSessionSeconds('custom', val)
    setTotalSeconds(secs)
    setSecondsLeft(secs)
  }

  const saveElapsedTimeToTask = (seconds: number) => {
    if (seconds <= 0 || !focusTask) return
    const currentTask = tasks.find((t) => t.id === focusTask.id)
    if (!currentTask) return

    const newActualTime = (currentTask.actualTime ?? 0) + seconds
    updateTask({
      ...currentTask,
      actualTime: newActualTime,
    })
  }

  // Ref sync for unmount cleanup
  const focusTaskRef = useRef(focusTask)
  const tasksRef = useRef(tasks)
  const updateTaskRef = useRef(updateTask)
  const sessionSecondsWorkedRef = useRef(0)

  useEffect(() => { focusTaskRef.current = focusTask }, [focusTask])
  useEffect(() => { tasksRef.current = tasks }, [tasks])
  useEffect(() => { updateTaskRef.current = updateTask }, [updateTask])
  useEffect(() => { sessionSecondsWorkedRef.current = sessionSecondsWorked }, [sessionSecondsWorked])

  // Unmount cleanup to save any unsaved seconds
  useEffect(() => {
    return () => {
      const currentFocusTask = focusTaskRef.current
      if (sessionSecondsWorkedRef.current > 0 && currentFocusTask && updateTaskRef.current && tasksRef.current) {
        const currentTask = tasksRef.current.find((t) => t.id === currentFocusTask.id)
        if (currentTask) {
          updateTaskRef.current({
            ...currentTask,
            actualTime: (currentTask.actualTime ?? 0) + sessionSecondsWorkedRef.current,
          })
        }
      }
    }
  }, [])

  // Timer Tick Interval
  useEffect(() => {
    if (running && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
            setRunning(false)
            setSessionSecondsWorked((w) => w + 1)
            return 0
          }
          setSessionSecondsWorked((w) => w + 1)
          return s - 1
        })
      }, 1000)
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [running, secondsLeft])

  // Save progress when paused
  useEffect(() => {
    if (!running && sessionSecondsWorked > 0) {
      saveElapsedTimeToTask(sessionSecondsWorked)
      setSessionSecondsWorked(0)
    }
  }, [running, sessionSecondsWorked])

  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100
  const circumference = 2 * Math.PI * 140

  const handleComplete = () => {
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)

    // Save pending progress
    if (sessionSecondsWorked > 0 && focusTask) {
      const currentTask = tasks.find((t) => t.id === focusTask.id)
      if (currentTask) {
        updateTask({
          ...currentTask,
          actualTime: (currentTask.actualTime ?? 0) + sessionSecondsWorked,
        })
      }
      setSessionSecondsWorked(0)
    }

    if (focusTask && focusTask.status !== "completed") {
      toggleTaskComplete(focusTask.id)
    }
    setCompleted(true)
  }

  const handleReset = () => {
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    setSecondsLeft(totalSeconds)
    setCompleted(false)
  }

  const handleSwitchTask = () => {
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)

    // Save pending progress
    if (sessionSecondsWorked > 0 && focusTask) {
      const currentTask = tasks.find((t) => t.id === focusTask.id)
      if (currentTask) {
        updateTask({
          ...currentTask,
          actualTime: (currentTask.actualTime ?? 0) + sessionSecondsWorked,
        })
      }
      setSessionSecondsWorked(0)
    }

    if (focusTask) {
      updateTask({
        ...focusTask,
        status: "todo",
      })
    }
  }

  // Render Selection Screen if no task is in-progress
  if (!focusTask) {
    const activeTasks = tasks.filter((t) => t.status !== "completed")

    return (
      <div className="fixed inset-0 focus-bg flex flex-col z-30 overflow-y-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#3B82F6]" />
            <span className="text-xs font-bold tracking-widest text-white/60 uppercase">NERVE FOCUS</span>
          </div>
          <Link href="/">
            <button className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-[#71717A] hover:text-white hover:bg-white/[0.1] transition-all">
              <X className="w-4 h-4" />
            </button>
          </Link>
        </div>

        {/* Main Selection Area */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full px-6 py-12">
          <h2 className="text-2xl font-bold text-white mb-2 text-center">Select a Task to Focus On</h2>
          <p className="text-sm text-[#71717A] text-center mb-8">Choose an active mission from your planner to start deep focus tracking.</p>

          {activeTasks.length === 0 ? (
            <div className="text-center py-12 bg-white/[0.02] border border-white/[0.06] rounded-2xl w-full p-6">
              <Clock className="w-8 h-8 text-[#71717A] mx-auto mb-3" />
              <p className="text-sm font-bold text-white mb-1">No active tasks</p>
              <p className="text-xs text-[#71717A] mb-4">You have completed all your tasks or haven't created any yet.</p>
              <Link href="/tasks">
                <Button className="nerve-gradient-blue text-white border-0 rounded-xl font-semibold hover:opacity-90">
                  Go to Tasks
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3 w-full max-h-[400px] overflow-y-auto pr-1">
              {activeTasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl transition-all"
                >
                  <div className="min-w-0 flex-1 pr-4">
                    <p className="text-sm font-semibold text-white truncate">{t.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-[#71717A]">
                      <span className="text-blue-400 font-semibold">{t.project}</span>
                      <span>·</span>
                      <span>{t.estimatedTime}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      updateTask({ ...t, status: "in-progress" })
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl border-0 cursor-pointer transition-all"
                  >
                    <Play className="w-3 h-3 fill-white" /> Start
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (completed) {
    return (
      <div className="fixed inset-0 focus-bg flex items-center justify-center z-30">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center mx-auto mb-6 nerve-glow-emerald">
            <CheckCircle className="w-10 h-10 text-[#10B981]" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-2">Task Complete!</h2>
          <p className="text-[#71717A] mb-6 text-lg">{focusTask.title}</p>
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/20">
              <Zap className="w-4 h-4 text-[#8B5CF6]" />
              <span className="text-[#8B5CF6] font-bold text-lg">+{focusTask.xp} XP</span>
            </div>
          </div>
          <div className="flex items-center gap-3 justify-center">
            <Button
              onClick={handleReset}
              variant="outline"
              className="border-white/[0.1] text-white bg-white/[0.05] rounded-xl hover:bg-white/[0.1]"
            >
              Next Session
            </Button>
            <Link href="/">
              <Button className="nerve-gradient-blue text-white border-0 rounded-xl font-semibold hover:opacity-90">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 focus-bg flex flex-col z-30">
      {/* Top bar */}
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#3B82F6]" />
          <span className="text-xs font-bold tracking-widest text-white/60 uppercase">NERVE FOCUS</span>
        </div>
        <Link href="/">
          <button className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-[#71717A] hover:text-white hover:bg-white/[0.1] transition-all">
            <X className="w-4 h-4" />
          </button>
        </Link>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
        {/* Task */}
        <div className="text-center max-w-lg">
          <p className="text-xs font-semibold text-[#3B82F6] uppercase tracking-widest mb-3">Current Mission</p>
          <h1 className="text-3xl font-bold text-white leading-snug text-balance">
            {focusTask.title}
          </h1>
          <div className="flex items-center justify-center gap-3 mt-3 text-sm text-[#71717A]">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> {focusTask.estimatedTime}
            </span>
            <span className="text-white/20">·</span>
            <span className="text-[#8B5CF6] font-semibold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> +{focusTask.xp} XP
            </span>
            <span className="text-white/20">·</span>
            <span>{focusTask.project}</span>
          </div>
          <div className="flex items-center justify-center gap-3 mt-3.5">
            <button
              onClick={handleSwitchTask}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold rounded-xl border border-white/10 cursor-pointer transition-all"
            >
              Switch Task
            </button>
          </div>
        </div>

        {/* Configurable presets */}
        <div className="flex items-center justify-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-1.5 shrink-0 max-w-md w-full">
          {(["25m", "45m", "60m", "90m", "custom"] as const).map((p) => (
            <button
              key={p}
              disabled={running}
              onClick={() => handlePresetChange(p)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all border cursor-pointer",
                running && "opacity-45 cursor-not-allowed",
                selectedPreset === p
                  ? "border-[#3B82F6]/30 bg-[#3B82F6]/10 text-white"
                  : "border-transparent text-[#71717A] hover:text-white"
              )}
            >
              {p === "custom" ? "Custom" : p}
            </button>
          ))}
          {selectedPreset === "custom" && (
            <input
              type="number"
              min={1}
              max={1440}
              value={customMinutes}
              disabled={running}
              onChange={(e) => handleCustomMinutesChange(e.target.value)}
              className="w-14 bg-white/[0.05] border border-white/[0.1] rounded-lg text-center py-1 text-xs font-bold text-white focus:border-[#3B82F6]/50 outline-none placeholder:text-white/20"
              placeholder="Min"
            />
          )}
        </div>

        {/* Timer ring */}
        <div className="relative w-[320px] h-[320px] flex items-center justify-center">
          {/* Outer glow */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: running
                ? "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)"
                : "radial-gradient(circle, rgba(59,130,246,0.03) 0%, transparent 70%)",
              transition: "background 1s ease",
            }}
          />

          {/* SVG ring */}
          <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox="0 0 300 300"
          >
            {/* Track */}
            <circle
              cx="150"
              cy="150"
              r="140"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="3"
            />
            {/* Progress */}
            <circle
              cx="150"
              cy="150"
              r="140"
              fill="none"
              stroke="url(#timerGrad)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress / 100)}
              style={{ transition: running ? "stroke-dashoffset 1s linear" : "none" }}
            />
            <defs>
              <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center */}
          <div className={cn("text-center z-10", running && "pulse-ring")}>
            <p className="text-6xl font-bold text-white tabular-nums tracking-tight leading-none">
              {formatTime(secondsLeft)}
            </p>
            <p className="text-xs text-[#71717A] mt-2 uppercase tracking-widest">
              {running ? "Deep Focus" : secondsLeft === totalSeconds ? "Ready" : "Paused"}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleReset}
            className="w-11 h-11 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-[#71717A] hover:text-white hover:bg-white/[0.1] transition-all"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={() => setRunning((r) => !r)}
            className="w-16 h-16 rounded-full nerve-gradient-blue flex items-center justify-center nerve-glow-blue hover:opacity-90 transition-opacity"
          >
            {running
              ? <Pause className="w-6 h-6 text-white fill-white" />
              : <Play className="w-6 h-6 text-white fill-white ml-0.5" />
            }
          </button>

          <button
            onClick={handleComplete}
            className="w-11 h-11 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center text-[#10B981] hover:bg-[#10B981]/20 transition-all"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Quote */}
        <div className="max-w-md text-center px-4">
          <p className="text-sm text-[#71717A]/80 italic leading-relaxed">
            &ldquo;{MOTIVATIONAL_QUOTES[quoteIndex]}&rdquo;
          </p>
        </div>

        {/* Session progress dots */}
        <div className="flex items-center gap-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "rounded-full transition-all duration-300",
                i === 0 && running
                  ? "w-6 h-2 bg-[#3B82F6]"
                  : i === 0
                  ? "w-6 h-2 bg-white/20"
                  : "w-2 h-2 bg-white/10"
              )}
            />
          ))}
          <span className="text-xs text-[#71717A] ml-1">Session 1 of 4</span>
        </div>
      </div>
    </div>
  )
}
