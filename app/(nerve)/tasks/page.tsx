"use client"

import { useState } from "react"
import { Plus, MoreHorizontal, Pencil, Trash2, Clock, Zap, PlayCircle, CheckCircle2, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PriorityBadge, StatusBadge, SectionHeader } from "@/components/nerve/ui"
import { useNerveStore } from "@/lib/nerve-store"
import { type Task, type Priority, type TaskStatus, type Project, type Goal } from "@/lib/nerve-data"
import { cn } from "@/lib/utils"
import Link from "next/link"

const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "To Do", value: "todo" },
  { label: "In Progress", value: "in-progress" },
  { label: "Completed", value: "completed" },
]

function formatActualTime(seconds?: number) {
  if (!seconds || seconds <= 0) return "0m"
  const mins = Math.round(seconds / 60)
  if (mins === 0) return "< 1m"
  if (mins < 60) return `${mins}m`
  const hrs = (mins / 60).toFixed(1)
  return `${hrs}h`
}

function wouldCreateCircularDependency(
  taskId: string | undefined,
  potentialDependsOnId: string,
  tasks: Task[]
): boolean {
  if (!taskId) return false
  if (taskId === potentialDependsOnId) return true

  // DFS to check if potentialDependsOnId transitively depends on taskId
  const visited = new Set<string>()
  const queue: string[] = [potentialDependsOnId]

  while (queue.length > 0) {
    const currentId = queue.shift()!
    if (currentId === taskId) return true
    if (visited.has(currentId)) continue
    visited.add(currentId)

    const currentTask = tasks.find((t) => t.id === currentId)
    if (currentTask && currentTask.dependsOnTaskId) {
      queue.push(currentTask.dependsOnTaskId)
    }
  }

  return false
}

function TaskModal({
  task,
  projects,
  goals,
  onClose,
  onSave,
}: {
  task?: Partial<Task>
  projects: Project[]
  goals: Goal[]
  onClose: () => void
  onSave: (t: Task) => void
}) {
  const { tasks } = useNerveStore()
  const [title, setTitle] = useState(task?.title ?? "")
  const [estimatedTime, setEstimatedTime] = useState(task?.estimatedTime ?? "")
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "medium")
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "todo")
  const [xp, setXp] = useState(task?.xp ?? 50)
  const [projectId, setProjectId] = useState(task?.projectId ?? (projects[0]?.id ?? ""))
  const [goalId, setGoalId] = useState(task?.goalId ?? "")
  const [notes, setNotes] = useState(task?.notes ?? "")
  const [dependsOnTaskId, setDependsOnTaskId] = useState(task?.dependsOnTaskId ?? "")

  const selectedProject = projects.find((p) => p.id === projectId)
  const projectGoals = goals.filter((g) => g.projectId === projectId)
  const selectedGoal = projectGoals.find((g) => g.id === goalId)

  const eligiblePrerequisites = tasks.filter((t) => {
    if (goalId) {
      if (t.goalId !== goalId) return false
    } else {
      if (t.projectId !== projectId) return false
    }
    if (task?.id && t.id === task.id) return false
    return !wouldCreateCircularDependency(task?.id, t.id, tasks)
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-[#FFFFFF] border border-slate-200 rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-[#0F172A] mb-5">{task?.id ? "Edit Task" : "New Task"}</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2 block">Task Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Design onboarding flow"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#64748B] outline-none focus:border-[#2563EB]/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2 block">Estimated Time</label>
              <input
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                placeholder="e.g. 1.5h"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#64748B] outline-none focus:border-[#2563EB]/50"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2 block">XP Reward</label>
              <input
                type="number"
                value={xp}
                onChange={(e) => setXp(Number(e.target.value))}
                placeholder="50"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#64748B] outline-none focus:border-[#2563EB]/50"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2 block">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]/50"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2 block">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]/50"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2 block">Project</label>
            <select
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value)
                setGoalId("") // reset goal when project changes
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]/50"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2 block">Goal (optional)</label>
            <select
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]/50"
            >
              <option value="">No Goal (General Task)</option>
              {projectGoals.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2 block">Prerequisite Task (optional)</label>
            <select
              value={dependsOnTaskId}
              onChange={(e) => setDependsOnTaskId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]/50"
            >
              <option value="">No Prerequisite (Unblocked)</option>
              {eligiblePrerequisites.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.project})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2 block">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional context..."
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#64748B] outline-none focus:border-[#2563EB]/50 resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1 border-slate-200 text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50 rounded-xl">
            Cancel
          </Button>
          <Button
            onClick={() =>
              onSave({
                id: task?.id ?? String(Date.now()),
                title: title || "Untitled Task",
                estimatedTime: estimatedTime || "1h",
                priority,
                status,
                xp,
                projectId,
                goalId: goalId || undefined,
                project: selectedProject?.name ?? "",
                goal: selectedGoal?.name ?? undefined,
                notes: notes || undefined,
                dependsOnTaskId: dependsOnTaskId || undefined,
                actualTime: task?.actualTime ?? 0,
              })
            }
            className="flex-1 nerve-gradient-blue text-white border-0 rounded-xl font-semibold hover:opacity-90"
          >
            {task?.id ? "Save Changes" : "Create Task"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function TasksPage() {
  const { tasks, toggleTaskComplete, updateTask, deleteTask, projects, goals } = useNerveStore()
  const [statusFilter, setStatusFilter] = useState("all")
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>()
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  const filtered = tasks.filter((t) => statusFilter === "all" || t.status === statusFilter)

  const handleSave = (t: Task) => {
    updateTask(t)
    setShowModal(false)
    setEditingTask(undefined)
  }

  const handleDelete = (id: string) => {
    deleteTask(id)
    setMenuOpen(null)
  }

  const toggleComplete = (id: string) => {
    toggleTaskComplete(id)
  }

  const quickStart = (id: string) => {
    const task = tasks.find((t) => t.id === id)
    if (task) {
      updateTask({ ...task, status: "in-progress" })
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <SectionHeader
        title="Tasks"
        subtitle="Your full task queue, organised and ready."
        action={
          <Button
            onClick={() => { setEditingTask(undefined); setShowModal(true) }}
            className="nerve-gradient-blue text-white border-0 gap-2 rounded-xl nerve-glow-blue hover:opacity-90 font-semibold"
          >
            <Plus className="w-4 h-4" /> New Task
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex gap-2 mb-7">
        {STATUS_FILTERS.map((f) => (
          <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                "px-4 py-1.5 rounded-xl text-sm font-medium transition-all",
                statusFilter === f.value
                  ? "bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20"
                  : "text-[#64748B] hover:text-[#0F172A] bg-slate-50 border border-slate-200"
              )}
            >
              {f.label}
            </button>
          ))}
        <div className="ml-auto text-xs text-[#64748B] self-center">
          {filtered.length} task{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((task) => {
          const project = projects.find((p) => p.id === task.projectId)
          const isCompleted = task.status === "completed"

          return (
            <div
              key={task.id}
              className={cn(
                "bg-[#FFFFFF] border rounded-2xl px-4 py-4 group transition-all duration-150",
                isCompleted ? "border-slate-200 opacity-60" : "border-slate-200 card-hover"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Drag handle */}
                <div className="mt-1 hidden md:block opacity-0 group-hover:opacity-100 transition-opacity cursor-grab text-[#64748B]">
                  <GripVertical className="w-4 h-4" />
                </div>

                {/* Checkbox */}
                <button
                  onClick={() => toggleComplete(task.id)}
                  className={cn(
                    "mt-0.5 w-5 h-5 rounded-md border shrink-0 flex items-center justify-center transition-all",
                    isCompleted
                      ? "border-[#10B981] bg-[#10B981]/10"
                      : "border-slate-300 hover:border-[#2563EB]/50"
                  )}
                >
                  {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={cn("text-sm font-semibold", isCompleted ? "text-[#64748B] line-through" : "text-[#0F172A]")}>
                        {task.title}
                      </p>
                      {task.notes && (
                        <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">{task.notes}</p>
                      )}
                      {task.goal && (
                        <p className="text-[11px] text-[#2563EB] mt-1 font-medium bg-[#2563EB]/5 px-2 py-0.5 rounded-md inline-block">
                          🎯 Goal: {task.goal}
                        </p>
                      )}
                      {task.dependsOnTaskId && (
                        (() => {
                          const prereq = tasks.find((t) => t.id === task.dependsOnTaskId)
                          if (!prereq) return null
                          const isPrereqCompleted = prereq.status === "completed"
                          return (
                            <div className="mt-1">
                              {isPrereqCompleted ? (
                                <span className="text-[10px] text-[#10B981] font-semibold bg-[#10B981]/5 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                                  🔓 Prerequisite completed: {prereq.title}
                                </span>
                              ) : (
                                <span className="text-[10px] text-[#EF4444] font-semibold bg-[#EF4444]/5 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                                  🔒 Depends on: {prereq.title}
                                </span>
                              )}
                            </div>
                          )
                        })()
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={task.status} />
                      <div className="relative">
                        <button
                          onClick={() => setMenuOpen(menuOpen === task.id ? null : task.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {menuOpen === task.id && (
                          <div className="absolute right-0 top-8 z-20 w-36 bg-white border border-slate-200 rounded-xl shadow-2xl py-1">
                            <button
                              onClick={() => { setEditingTask(task); setShowModal(true); setMenuOpen(null) }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#0F172A] hover:bg-slate-100"
                            >
                              <Pencil className="w-3.5 h-3.5 text-[#64748B]" /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(task.id)}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#EF4444] hover:bg-[#EF4444]/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1.5 mt-2.5">
                    <div className="flex items-center gap-1 text-xs text-[#64748B]">
                      <Clock className="w-3 h-3" />
                      {isCompleted ? (
                        <span>Est: {task.estimatedTime} · Act: {formatActualTime(task.actualTime)}</span>
                      ) : (
                        <span>{task.estimatedTime}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[#8B5CF6] font-semibold">
                      <Zap className="w-3 h-3" />
                      +{task.xp} XP
                    </div>
                    {project && (
                      <div
                        className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md"
                        style={{ background: `${project.color}15`, color: project.color }}
                      >
                        <span>{project.icon}</span>
                        <span>{project.name}</span>
                      </div>
                    )}
                    <PriorityBadge priority={task.priority} />
                  </div>

                  {/* Mobile Quick actions */}
                  {!isCompleted && (
                    <div className="flex md:hidden items-center gap-2 mt-3 pt-2 border-t border-slate-100">
                      <Link href="/focus" onClick={() => quickStart(task.id)} className="flex-1">
                        <button className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 text-xs font-semibold hover:bg-[#2563EB]/20 transition-all">
                          <PlayCircle className="w-3.5 h-3.5" /> Focus
                        </button>
                      </Link>
                      <button
                        onClick={() => toggleComplete(task.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 text-xs font-semibold hover:bg-[#10B981]/20 transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Done
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick actions */}
                {!isCompleted && (
                  <div className="hidden md:flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                    <Link href="/focus" onClick={() => quickStart(task.id)}>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 text-xs font-medium hover:bg-[#2563EB]/20 transition-all">
                        <PlayCircle className="w-3.5 h-3.5" /> Focus
                      </button>
                    </Link>
                    <button
                      onClick={() => toggleComplete(task.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 text-xs font-medium hover:bg-[#10B981]/20 transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Done
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {(showModal || editingTask) && (
        <TaskModal
          task={editingTask}
          projects={projects}
          goals={goals}
          onClose={() => { setShowModal(false); setEditingTask(undefined) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
