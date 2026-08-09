"use client"

import { useState, useEffect, useRef } from "react"
import { Pause, Play, CheckCircle, SkipForward, X, Zap, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MOTIVATIONAL_QUOTES } from "@/lib/nerve-data"
import { useNerveStore } from "@/lib/nerve-store"
import { cn } from "@/lib/utils"
import Link from "next/link"

const TOTAL_SECONDS = 25 * 60 // 25 minutes

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export default function FocusPage() {
  const { tasks, toggleTaskComplete } = useNerveStore()
  const focusTask = tasks.find((t) => t.status === "in-progress") ?? tasks[0] ?? {
    id: "default",
    title: "Start a Task",
    estimatedTime: "25m",
    xp: 50,
    project: "Nerve",
    status: "todo",
  }

  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS)
  const [running, setRunning] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [quoteIndex] = useState(() => Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length))
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
            return 0
          }
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
  }, [running])

  const progress = ((TOTAL_SECONDS - secondsLeft) / TOTAL_SECONDS) * 100
  const circumference = 2 * Math.PI * 140

  const handleComplete = () => {
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (focusTask.id !== "default" && focusTask.status !== "completed") {
      toggleTaskComplete(focusTask.id)
    }
    setCompleted(true)
  }

  const handleReset = () => {
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    setSecondsLeft(TOTAL_SECONDS)
    setCompleted(false)
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
              {running ? "Deep Focus" : secondsLeft === TOTAL_SECONDS ? "Ready" : "Paused"}
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
