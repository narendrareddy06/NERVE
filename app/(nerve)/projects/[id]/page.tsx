"use client"

import { useState, useMemo, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft, Plus, Check, Lock, ChevronDown, ChevronUp,
  Pencil, Trash2, Target, Trophy, Calendar, Zap,
  CheckCircle2, Flag, Sparkles
} from "lucide-react"
import { useNerveStore } from "@/lib/nerve-store"
import { type Task, type Goal, type Milestone, type Priority } from "@/lib/nerve-data"
import { PriorityBadge, ProgressBar } from "@/components/nerve/ui"
import { cn } from "@/lib/utils"

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const PRIORITY_OPTIONS: Priority[] = ["low", "medium", "high", "critical"]

function formatDate(iso?: string) {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function MilestoneCelebration({ milestone, onDismiss }: { milestone: Milestone; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onDismiss} style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      {Array.from({ length: 28 }).map((_, i) => (
        <div key={i} className="absolute w-2.5 h-2.5 rounded-sm" style={{
          left: `${3 + (i * 3.4)}%`, top: "-10px",
          background: ["#4F46E5","#10B981","#F59E0B","#EF4444","#06B6D4","#EC4899"][i % 6],
          animation: `celebfall ${1.4 + (i % 3) * 0.4}s ${(i % 5) * 0.12}s linear forwards`,
          transform: `rotate(${i * 37}deg)`,
        }} />
      ))}
      <div className="relative bg-white rounded-3xl p-10 shadow-2xl flex flex-col items-center gap-4 text-center max-w-sm mx-4" style={{ animation: "popin 0.4s cubic-bezier(.175,.885,.32,1.275) both" }}>
        <div className="text-6xl">🏆</div>
        <h2 className="text-2xl font-black text-[#0F172A]">Stage Complete!</h2>
        <p className="text-lg font-bold text-[#4F46E5]">{milestone.name}</p>
        {(milestone.xpReward ?? 0) > 0 && (
          <div className="flex items-center gap-2 bg-[#4F46E5]/10 text-[#4F46E5] px-4 py-2 rounded-full font-bold text-sm">
            <Zap className="w-4 h-4" /> +{milestone.xpReward} XP Bonus!
          </div>
        )}
        {milestone.rewardLabel && <p className="text-sm text-[#64748B]">{milestone.rewardLabel}</p>}
        <p className="text-xs text-[#94A3B8]">Tap anywhere to continue</p>
      </div>
      <style>{`
        @keyframes celebfall { 0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(100vh) rotate(720deg);opacity:0} }
        @keyframes popin { 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }
      `}</style>
    </div>
  )
}

function MilestoneModal({ milestone, projectId, projectTasks, onClose, onSave }: {
  milestone?: Partial<Milestone>; projectId: string; projectTasks: Task[]
  onClose: () => void; onSave: (m: Milestone) => void
}) {
  const [name, setName] = useState(milestone?.name ?? "")
  const [description, setDescription] = useState(milestone?.description ?? "")
  const [xpReward, setXpReward] = useState(String(milestone?.xpReward ?? 0))
  const [rewardLabel, setRewardLabel] = useState(milestone?.rewardLabel ?? "")
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>(milestone?.requiredTaskIds ?? [])

  const toggleTask = (id: string) => setSelectedTaskIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleSave = () => {
    if (!name.trim()) return
    onSave({
      id: milestone?.id ?? uid(), projectId, goalId: milestone?.goalId,
      name: name.trim(), description: description.trim() || undefined,
      order: milestone?.order ?? 0, status: milestone?.status ?? "locked",
      requiredTaskIds: selectedTaskIds, xpReward: parseInt(xpReward) || 0,
      rewardLabel: rewardLabel.trim() || undefined, completedAt: milestone?.completedAt
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-[#0F172A] mb-5">{milestone?.id ? "Edit Milestone" : "New Milestone"}</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-1.5 block">Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Foundation Complete" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#4F46E5]/50 transition-colors" />
          </div>
          <div>
            <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-1.5 block">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="What does completing this stage achieve?" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#4F46E5]/50 transition-colors resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-1.5 block">Bonus XP</label>
              <input type="number" value={xpReward} onChange={e => setXpReward(e.target.value)} placeholder="0" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#4F46E5]/50 transition-colors" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-1.5 block">Reward Label</label>
              <input value={rewardLabel} onChange={e => setRewardLabel(e.target.value)} placeholder="e.g. Phase 1 Done" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#4F46E5]/50 transition-colors" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2 block">Required Tasks ({selectedTaskIds.length} selected)</label>
            <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-3 bg-slate-50">
              {projectTasks.length === 0 ? (
                <p className="text-xs text-[#94A3B8] text-center py-2">No project tasks yet.</p>
              ) : projectTasks.map(t => (
                <label key={t.id} className="flex items-center gap-2.5 cursor-pointer hover:bg-white rounded-lg p-1.5 transition-colors">
                  <input type="checkbox" checked={selectedTaskIds.includes(t.id)} onChange={() => toggleTask(t.id)} className="rounded" />
                  <span className={cn("text-xs flex-1", t.status === "completed" ? "text-[#64748B] line-through" : "text-[#0F172A]")}>{t.title}</span>
                  <PriorityBadge priority={t.priority} />
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-[#64748B] hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={!name.trim()} className="flex-1 px-4 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-bold transition-colors disabled:opacity-50">
            {milestone?.id ? "Save Changes" : "Create Stage"}
          </button>
        </div>
      </div>
    </div>
  )
}

function GoalModal({ goal, projectId, onClose, onSave }: {
  goal?: Partial<Goal>; projectId: string; onClose: () => void; onSave: (g: Goal) => void
}) {
  const [name, setName] = useState(goal?.name ?? "")
  const [description, setDescription] = useState(goal?.description ?? "")
  const [deadline, setDeadline] = useState(goal?.deadline ?? "")
  const [priority, setPriority] = useState<Priority>(goal?.priority ?? "medium")

  const handleSave = () => {
    if (!name.trim()) return
    onSave({ id: goal?.id ?? uid(), projectId, name: name.trim(), description: description.trim(), deadline, priority, progress: goal?.progress ?? 0, tasksCount: goal?.tasksCount ?? 0, completionPct: goal?.completionPct ?? 0 })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-[#0F172A] mb-5">{goal?.id ? "Edit Goal" : "New Goal"}</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-1.5 block">Goal Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ship MVP v1.0" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#4F46E5]/50 transition-colors" />
          </div>
          <div>
            <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-1.5 block">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#4F46E5]/50 transition-colors resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-1.5 block">Deadline</label>
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#4F46E5]/50 transition-colors" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-1.5 block">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value as Priority)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#4F46E5]/50 transition-colors">
                {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-[#64748B] hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={!name.trim()} className="flex-1 px-4 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-bold transition-colors disabled:opacity-50">
            {goal?.id ? "Save Changes" : "Create Goal"}
          </button>
        </div>
      </div>
    </div>
  )
}

function InlineTaskCreate({ projectId, goalId, projectName, goalName, onSave, onCancel }: {
  projectId: string; goalId?: string; projectName: string; goalName?: string
  onSave: (t: Task) => void; onCancel: () => void
}) {
  const [title, setTitle] = useState("")
  const [priority, setPriority] = useState<Priority>("medium")
  const [estimatedTime, setEstimatedTime] = useState("1h")
  const [xp, setXp] = useState("50")

  const handleSave = () => {
    if (!title.trim()) return
    onSave({ id: uid(), title: title.trim(), priority, estimatedTime, xp: parseInt(xp) || 50, status: "todo", projectId, goalId, project: projectName, goal: goalName })
    onCancel()
  }

  return (
    <div className="bg-slate-50 border border-[#4F46E5]/20 rounded-xl p-3 space-y-2">
      <input value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") onCancel() }} autoFocus placeholder="Task title..." className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4F46E5]/50" />
      <div className="flex gap-2">
        <select value={priority} onChange={e => setPriority(e.target.value as Priority)} className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none">
          {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <input value={estimatedTime} onChange={e => setEstimatedTime(e.target.value)} placeholder="1h" className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none text-center" />
        <input type="number" value={xp} onChange={e => setXp(e.target.value)} placeholder="XP" className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none text-center" />
        <button onClick={handleSave} disabled={!title.trim()} className="px-3 py-1.5 bg-[#4F46E5] text-white rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-[#4338CA] transition-colors">Add</button>
        <button onClick={onCancel} className="px-2 py-1.5 text-[#64748B] text-xs">✕</button>
      </div>
    </div>
  )
}

function MilestoneCard({ milestone, tasks, projectColor, onToggleTask, onEdit, onDelete, onMarkIncomplete, isExpanded, onToggleExpand }: {
  milestone: Milestone; tasks: Task[]; projectColor: string
  onToggleTask: (taskId: string) => void; onEdit: () => void; onDelete: () => void
  onMarkIncomplete: () => void
  isExpanded: boolean; onToggleExpand: () => void
}) {
  const requiredTasks = tasks.filter(t => milestone.requiredTaskIds.includes(t.id))
  const completedCount = requiredTasks.filter(t => t.status === "completed").length
  const totalCount = requiredTasks.length
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const cardBg = milestone.status === "completed" ? "bg-[#10B981]/5 border-[#10B981]/25"
    : milestone.status === "active" ? "bg-[#4F46E5]/5 border-[#4F46E5]/25"
    : "bg-slate-50 border-slate-200"

  return (
    <div className={cn("rounded-2xl border transition-all", cardBg)}>
      <div
        className={cn("flex items-center gap-3 p-4", milestone.status !== "locked" ? "cursor-pointer" : "opacity-70")}
        onClick={milestone.status !== "locked" ? onToggleExpand : undefined}
      >
        <div className="w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-bold"
          style={milestone.status === "completed" ? { background: "#10B981", borderColor: "#10B981", color: "white" }
            : milestone.status === "active" ? { background: `${projectColor}15`, borderColor: projectColor, color: projectColor }
            : { background: "#F1F5F9", borderColor: "#CBD5E1", color: "#94A3B8" }}>
          {milestone.status === "completed" ? <Check className="w-3.5 h-3.5" /> : milestone.status === "locked" ? <Lock className="w-3 h-3" /> : milestone.order + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#64748B]">Stage {milestone.order + 1}</span>
            {milestone.status === "completed" && <span className="text-xs text-[#10B981] font-semibold">✓ Complete</span>}
            {milestone.status === "locked" && <span className="text-xs text-[#94A3B8]">Locked</span>}
          </div>
          <h3 className="text-sm font-bold text-[#0F172A] leading-tight">{milestone.name}</h3>
          {milestone.description && <p className="text-xs text-[#64748B] mt-0.5 truncate">{milestone.description}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {(milestone.xpReward ?? 0) > 0 && (
            <span className="text-xs font-semibold text-[#4F46E5] bg-[#4F46E5]/10 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Zap className="w-3 h-3" />+{milestone.xpReward}
            </span>
          )}
          {totalCount > 0 && <span className="text-xs text-[#64748B]">{completedCount}/{totalCount}</span>}
          {milestone.status === "completed" && (
            <button
              onClick={e => { e.stopPropagation(); onMarkIncomplete() }}
              title="Mark incomplete"
              className="px-2 py-1 rounded-lg text-xs font-medium text-[#F59E0B] bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 border border-[#F59E0B]/20 transition-all whitespace-nowrap"
            >
              Undo
            </button>
          )}
          <button onClick={e => { e.stopPropagation(); onEdit() }} className="w-6 h-6 rounded-lg flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-white/60 transition-all">
            <Pencil className="w-3 h-3" />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete() }} className="w-6 h-6 rounded-lg flex items-center justify-center text-[#EF4444]/60 hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-all">
            <Trash2 className="w-3 h-3" />
          </button>
          {milestone.status !== "locked" && (isExpanded ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />)}
        </div>
      </div>

      {totalCount > 0 && (
        <div className="px-4 pb-2">
          <ProgressBar value={progress} color={milestone.status === "completed" ? "#10B981" : projectColor} />
        </div>
      )}

      {isExpanded && milestone.status !== "locked" && (
        <div className="px-4 pb-4 border-t border-inherit mt-1 pt-3 space-y-2">
          {requiredTasks.length === 0 ? (
            <p className="text-xs text-[#94A3B8] text-center py-2">No tasks assigned. Edit to add tasks.</p>
          ) : requiredTasks.map(task => (
            <div key={task.id} className="flex items-center gap-3 group/t bg-white rounded-xl px-3 py-2.5 border border-slate-100 hover:border-slate-200 transition-all">
              <button onClick={() => onToggleTask(task.id)} className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all", task.status === "completed" ? "bg-[#10B981] border-[#10B981] text-white" : "border-slate-300 hover:border-[#4F46E5]")}>
                {task.status === "completed" && <Check className="w-3 h-3" />}
              </button>
              <span className={cn("text-sm flex-1 min-w-0 truncate", task.status === "completed" ? "line-through text-[#94A3B8]" : "text-[#0F172A]")}>{task.title}</span>
              <div className="flex items-center gap-2 shrink-0">
                <PriorityBadge priority={task.priority} />
                {task.estimatedTime && <span className="text-xs text-[#64748B]">{task.estimatedTime}</span>}
                {task.scheduledDate && (
                  <span className="text-xs text-[#4F46E5] bg-[#4F46E5]/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Calendar className="w-3 h-3" />{formatDate(task.scheduledDate)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const {
    projects, goals, tasks, milestones,
    updateGoal, updateTask, deleteTask, toggleTaskComplete,
    updateMilestone, deleteMilestone,
    pendingMilestone, clearPendingMilestone,
  } = useNerveStore()

  const project = projects.find(p => p.id === projectId)
  const projectGoals = goals.filter(g => g.projectId === projectId)
  const projectTasks = tasks.filter(t => t.projectId === projectId)
  const projectMilestones = milestones.filter(m => m.projectId === projectId).sort((a, b) => a.order - b.order)

  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(
    () => projectMilestones.find(m => m.status === "active")?.id ?? null
  )
  const [showMilestoneModal, setShowMilestoneModal] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | undefined>()
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>()
  const [showAddTask, setShowAddTask] = useState(false)
  const [taskFilter, setTaskFilter] = useState<"all" | "todo" | "completed">("all")

  useEffect(() => {
    const active = projectMilestones.find(m => m.status === "active")
    if (active && !expandedMilestone) setExpandedMilestone(active.id)
  }, [milestones])

  const primaryGoal = projectGoals[0]
  const filteredTasks = useMemo(() => {
    if (taskFilter === "todo") return projectTasks.filter(t => t.status !== "completed")
    if (taskFilter === "completed") return projectTasks.filter(t => t.status === "completed")
    return projectTasks
  }, [projectTasks, taskFilter])

  const completedTasks = projectTasks.filter(t => t.status === "completed").length
  const scheduledTasks = projectTasks.filter(t => t.scheduledDate).length
  const totalXp = projectTasks.reduce((s, t) => s + (t.status === "completed" ? t.xp : 0), 0)

  const motivationalMessage = useMemo(() => {
    if (projectMilestones.length === 0) return null
    const completedCount = projectMilestones.filter(m => m.status === "completed").length
    const totalCount = projectMilestones.length
    
    if (completedCount === totalCount) {
      return "🎉 Outstanding! All stages completed. You've fully conquered this project! 🏆"
    }

    const activeMilestone = projectMilestones.find(m => m.status === "active")

    if (completedCount > 0) {
      const completedIndicesText = projectMilestones
        .map((m, idx) => m.status === "completed" ? `Stage ${idx + 1}` : null)
        .filter(Boolean)
        .join(" & ")
      
      if (activeMilestone) {
        return `🔥 ${completedIndicesText} complete! Moving to the next phase: "${activeMilestone.name}" — let's crush it! 💪`
      }
      return `⚡ ${completedIndicesText} complete! Ready for the final push! 🚀`
    }

    if (activeMilestone) {
      return `⚡ Stage 1 active: "${activeMilestone.name}" — let's get started on tasks to unlock the next phase! 🚀`
    }
    
    return "💡 Work on the current active stage to start progress."
  }, [projectMilestones])

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-[#64748B]">Project not found.</p>
        <button onClick={() => router.push("/projects")} className="text-[#4F46E5] text-sm font-semibold hover:underline">
          Back to Projects
        </button>
      </div>
    )
  }

  const handleSaveMilestone = (m: Milestone) => {
    if (!milestones.find(x => x.id === m.id)) {
      const maxOrder = projectMilestones.reduce((max, x) => Math.max(max, x.order), -1)
      m = { ...m, order: maxOrder + 1, status: projectMilestones.length === 0 ? "active" : "locked" }
    }
    updateMilestone(m)
    setShowMilestoneModal(false)
    setEditingMilestone(undefined)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      {pendingMilestone && pendingMilestone.projectId === projectId && (
        <MilestoneCelebration milestone={pendingMilestone} onDismiss={clearPendingMilestone} />
      )}

      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => router.push("/projects")} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-[#64748B] hover:bg-slate-200 transition-all shrink-0 mt-1">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ background: `${project.color}15`, border: `1.5px solid ${project.color}35` }}>
            {project.icon}
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#0F172A]">{project.name}</h1>
            <p className="text-sm text-[#64748B] mt-0.5">{project.description}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: <CheckCircle2 className="w-4 h-4" />, label: "Tasks Done", value: `${completedTasks}/${projectTasks.length}`, color: "#10B981" },
          { icon: <Calendar className="w-4 h-4" />, label: "Scheduled", value: String(scheduledTasks), color: "#4F46E5" },
          { icon: <Zap className="w-4 h-4" />, label: "XP Earned", value: String(totalXp), color: "#F59E0B" },
          { icon: <Target className="w-4 h-4" />, label: "Progress", value: `${project.progress}%`, color: project.color },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${s.color}15`, color: s.color }}>{s.icon}</div>
            <div>
              <p className="text-xs text-[#64748B]">{s.label}</p>
              <p className="text-lg font-black text-[#0F172A]">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Goal Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#4F46E5]" />
            <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">Goal / Outcome</h2>
          </div>
          <div className="flex gap-2">
            {primaryGoal && (
              <button onClick={() => { setEditingGoal(primaryGoal); setShowGoalModal(true) }} className="px-3 py-1.5 text-xs font-medium text-[#64748B] bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-1.5 hover:bg-slate-100 transition-all">
                <Pencil className="w-3 h-3" /> Edit
              </button>
            )}
            <button onClick={() => { setEditingGoal(undefined); setShowGoalModal(true) }} className="px-3 py-1.5 text-xs font-bold text-[#4F46E5] bg-[#4F46E5]/10 hover:bg-[#4F46E5]/20 rounded-xl flex items-center gap-1.5 transition-all">
              <Plus className="w-3 h-3" /> Add Goal
            </button>
          </div>
        </div>
        {projectGoals.length === 0 ? (
          <p className="text-sm text-[#94A3B8] text-center py-4">No goal set yet. Define your outcome above.</p>
        ) : projectGoals.map(goal => {
          const gt = projectTasks.filter(t => t.goalId === goal.id)
          const done = gt.filter(t => t.status === "completed").length
          const pct = gt.length > 0 ? Math.round((done / gt.length) * 100) : goal.completionPct
          return (
            <div key={goal.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-2 last:mb-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">{goal.name}</h3>
                  {goal.description && <p className="text-xs text-[#64748B] mt-0.5">{goal.description}</p>}
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <PriorityBadge priority={goal.priority} />
                  {goal.deadline && (
                    <span className="text-xs text-[#64748B] flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                      <Flag className="w-3 h-3" /> {formatDate(goal.deadline)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ProgressBar value={pct} color={project.color} />
                <span className="text-xs font-bold text-[#0F172A] shrink-0">{pct}%</span>
              </div>
              <p className="text-xs text-[#94A3B8] mt-1.5">{done}/{gt.length} tasks complete</p>
            </div>
          )
        })}
      </div>

      {/* Milestones */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#F59E0B]" />
            <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">Milestones & Stages</h2>
            <span className="text-xs text-[#64748B] bg-slate-100 px-2 py-0.5 rounded-full">
              {projectMilestones.filter(m => m.status === "completed").length}/{projectMilestones.length} done
            </span>
          </div>
          <button
            onClick={() => { setEditingMilestone(undefined); setShowMilestoneModal(true) }}
            className="px-3 py-1.5 text-xs font-bold text-[#4F46E5] bg-[#4F46E5]/10 hover:bg-[#4F46E5]/20 rounded-xl flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3 h-3" /> Add Stage
          </button>
        </div>

        {projectMilestones.length === 0 ? (
          <div className="text-center py-8 text-[#94A3B8]">
            <Trophy className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No stages yet. Break your project into milestones!</p>
          </div>
        ) : (
          <>
            {motivationalMessage && (
              <div className="mb-4 bg-[#4F46E5]/5 border border-[#4F46E5]/10 rounded-2xl p-3.5 flex items-center gap-3 animate-fade-in shadow-sm">
                <Sparkles className="w-4 h-4 text-[#F59E0B] shrink-0 animate-pulse" />
                <p className="text-xs font-semibold text-[#4F46E5] leading-relaxed">
                  {motivationalMessage}
                </p>
              </div>
            )}

            <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1">
              {projectMilestones.map((m, i) => (
                <div key={m.id} className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => m.status !== "locked" && setExpandedMilestone(expandedMilestone === m.id ? null : m.id)}
                    title={m.name}
                    className={cn("w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all",
                      m.status === "completed" ? "bg-[#10B981] border-[#10B981] text-white" :
                      m.status === "active" ? "text-white border-[#4F46E5]" :
                      "bg-slate-100 border-slate-200 text-[#94A3B8] cursor-not-allowed")}
                    style={m.status === "active" ? { background: "#4F46E5", boxShadow: "0 4px 14px #4F46E540" } : undefined}
                  >
                    {m.status === "completed" ? <Check className="w-4 h-4" /> : m.status === "locked" ? <Lock className="w-3 h-3" /> : i + 1}
                  </button>
                  {i < projectMilestones.length - 1 && (
                    <div className={cn("w-8 h-0.5 transition-colors", m.status === "completed" ? "bg-[#10B981]" : "bg-slate-200")} />
                  )}
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {projectMilestones.map(m => (
                <MilestoneCard
                  key={m.id} milestone={m} tasks={tasks} projectColor={project.color}
                  onToggleTask={toggleTaskComplete}
                  onEdit={() => { setEditingMilestone(m); setShowMilestoneModal(true) }}
                  onDelete={() => { if (confirm(`Delete stage "${m.name}"?`)) deleteMilestone(m.id) }}
                  onMarkIncomplete={() => {
                    updateMilestone({
                      ...m,
                      status: "active",
                      completedAt: undefined
                    })
                  }}
                  isExpanded={expandedMilestone === m.id}
                  onToggleExpand={() => setExpandedMilestone(expandedMilestone === m.id ? null : m.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* All Tasks */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />
            <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">All Tasks</h2>
            <span className="text-xs text-[#64748B] bg-slate-100 px-2 py-0.5 rounded-full">{projectTasks.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 rounded-xl p-0.5">
              {(["all", "todo", "completed"] as const).map(f => (
                <button key={f} onClick={() => setTaskFilter(f)} className={cn("px-3 py-1 rounded-lg text-xs font-medium transition-all", taskFilter === f ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B]")}>
                  {f === "all" ? "All" : f === "todo" ? "Active" : "Done"}
                </button>
              ))}
            </div>
            <button onClick={() => setShowAddTask(v => !v)} className="px-3 py-1.5 text-xs font-bold text-[#2563EB] bg-[#2563EB]/10 hover:bg-[#2563EB]/20 rounded-xl flex items-center gap-1.5 transition-all">
              <Plus className="w-3 h-3" /> Add Task
            </button>
          </div>
        </div>

        {showAddTask && (
          <div className="mb-3">
            <InlineTaskCreate
              projectId={projectId} goalId={primaryGoal?.id}
              projectName={project.name} goalName={primaryGoal?.name}
              onSave={t => { updateTask(t); setShowAddTask(false) }}
              onCancel={() => setShowAddTask(false)}
            />
          </div>
        )}

        {filteredTasks.length === 0 ? (
          <p className="text-sm text-[#94A3B8] text-center py-6">
            {taskFilter === "all" ? "No tasks yet. Add one above!" : `No ${taskFilter} tasks.`}
          </p>
        ) : (
          <div className="space-y-1.5">
            {filteredTasks.map(task => {
              const goalName = goals.find(g => g.id === task.goalId)?.name
              return (
                <div key={task.id} className="flex items-center gap-3 group bg-slate-50 hover:bg-white rounded-xl px-3 py-2.5 border border-transparent hover:border-slate-200 transition-all">
                  <button onClick={() => toggleTaskComplete(task.id)} className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all", task.status === "completed" ? "bg-[#10B981] border-[#10B981] text-white" : "border-slate-300 hover:border-[#4F46E5]")}>
                    {task.status === "completed" && <Check className="w-3 h-3" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium truncate", task.status === "completed" ? "line-through text-[#94A3B8]" : "text-[#0F172A]")}>{task.title}</p>
                    {goalName && <p className="text-xs text-[#64748B] truncate">{goalName}</p>}
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <PriorityBadge priority={task.priority} />
                    {task.estimatedTime && <span className="text-xs text-[#64748B]">{task.estimatedTime}</span>}
                    {task.scheduledDate ? (
                      <span className="text-xs text-[#4F46E5] bg-[#4F46E5]/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatDate(task.scheduledDate)}
                      </span>
                    ) : (
                      <span className="text-xs text-[#94A3B8] bg-slate-100 px-2 py-0.5 rounded-full">Unscheduled</span>
                    )}
                    <button onClick={() => { if (confirm(`Delete "${task.title}"?`)) deleteTask(task.id) }} className="w-5 h-5 rounded flex items-center justify-center text-[#EF4444]/60 hover:text-[#EF4444] transition-all">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-xs font-bold text-[#F59E0B] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">+{task.xp}xp</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showMilestoneModal && (
        <MilestoneModal
          milestone={editingMilestone} projectId={projectId} projectTasks={projectTasks}
          onClose={() => { setShowMilestoneModal(false); setEditingMilestone(undefined) }}
          onSave={handleSaveMilestone}
        />
      )}
      {showGoalModal && (
        <GoalModal
          goal={editingGoal} projectId={projectId}
          onClose={() => { setShowGoalModal(false); setEditingGoal(undefined) }}
          onSave={g => { updateGoal(g); setShowGoalModal(false); setEditingGoal(undefined) }}
        />
      )}
    </div>
  )
}
