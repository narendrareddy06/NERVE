"use client"

import { useState } from "react"
import { Plus, MoreHorizontal, Pencil, Trash2, Target, Calendar, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProgressBar, PriorityBadge, SectionHeader } from "@/components/nerve/ui"
import { useNerveStore } from "@/lib/nerve-store"
import { type Goal, type Priority, type Project } from "@/lib/nerve-data"
import { cn } from "@/lib/utils"

function GoalModal({
  goal,
  projects,
  onClose,
  onSave,
}: {
  goal?: Partial<Goal>
  projects: Project[]
  onClose: () => void
  onSave: (g: Goal) => void
}) {
  const [name, setName] = useState(goal?.name ?? "")
  const [priority, setPriority] = useState<Priority>(goal?.priority ?? "medium")
  const [projectId, setProjectId] = useState(goal?.projectId ?? (projects[0]?.id ?? ""))
  const [deadline, setDeadline] = useState(goal?.deadline ?? "")
  const [description, setDescription] = useState(goal?.description ?? "")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-[#FFFFFF] border border-slate-200 rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-[#0F172A] mb-5">{goal?.id ? "Edit Goal" : "New Goal"}</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2 block">Goal Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ship MVP v1.0"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#64748B] outline-none focus:border-[#2563EB]/50"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2 block">Project</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]/50"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
              ))}
            </select>
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
              <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2 block">Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]/50"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does success look like?"
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
                id: goal?.id ?? String(Date.now()),
                name: name || "Untitled Goal",
                projectId,
                priority,
                deadline,
                description,
                progress: goal?.progress ?? 0,
                tasksCount: goal?.tasksCount ?? 0,
                completionPct: goal?.completionPct ?? 0,
              })
            }
            className="flex-1 nerve-gradient-blue text-white border-0 rounded-xl font-semibold hover:opacity-90"
          >
            {goal?.id ? "Save Changes" : "Create Goal"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function GoalsPage() {
  const { goals, updateGoal, deleteGoal, projects } = useNerveStore()
  const [showModal, setShowModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>()
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [expandedProject, setExpandedProject] = useState<string | null>(null)

  // Expand the first project that has goals, defensively
  useState(() => {
    const firstWithGoals = projects.find((p) => goals.some((g) => g.projectId === p.id))
    if (firstWithGoals) {
      setExpandedProject(firstWithGoals.id)
    } else if (projects[0]) {
      setExpandedProject(projects[0].id)
    }
  })

  const handleSave = (g: Goal) => {
    updateGoal(g)
    setShowModal(false)
    setEditingGoal(undefined)
  }

  const handleDelete = (id: string) => {
    deleteGoal(id)
    setMenuOpen(null)
  }

  const formatDate = (d: string) => {
    if (!d) return "No deadline"
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <SectionHeader
        title="Goals"
        subtitle="Milestones that move your projects forward."
        action={
          <Button
            onClick={() => { setEditingGoal(undefined); setShowModal(true) }}
            className="nerve-gradient-blue text-white border-0 gap-2 rounded-xl nerve-glow-blue hover:opacity-90 font-semibold"
          >
            <Plus className="w-4 h-4" /> New Goal
          </Button>
        }
      />

      <div className="space-y-4">
        {projects.map((project) => {
          const projectGoals = goals.filter((g) => g.projectId === project.id)
          const isExpanded = expandedProject === project.id

          return (
            <div key={project.id} className="bg-[#FFFFFF] border border-slate-200 rounded-2xl overflow-hidden">
              {/* Project header */}
              <button
                className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-all"
                onClick={() => setExpandedProject(isExpanded ? null : project.id)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
                    style={{ background: `${project.color}18`, border: `1px solid ${project.color}30` }}
                  >
                    {project.icon}
                  </div>
                  <span className="text-sm font-bold text-[#0F172A]">{project.name}</span>
                  <span className="text-xs text-[#64748B] bg-slate-50 px-2 py-0.5 rounded-lg">
                    {projectGoals.length} goal{projectGoals.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-[#64748B] transition-transform duration-200",
                    isExpanded ? "rotate-180" : ""
                  )}
                />
              </button>

              {/* Goals list */}
              {isExpanded && (
                <div className="border-t border-slate-200 divide-y divide-white/[0.04]">
                  {projectGoals.length === 0 ? (
                    <p className="text-xs text-[#64748B] p-5 italic">No goals defined for this project yet.</p>
                  ) : (
                    projectGoals.map((goal) => (
                      <div key={goal.id} className="p-5 hover:bg-slate-50 transition-all group">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center shrink-0 mt-0.5">
                              <Target className="w-3.5 h-3.5 text-[#2563EB]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-sm font-semibold text-[#0F172A] mb-1">{goal.name}</h3>
                              <p className="text-xs text-[#64748B] leading-relaxed">{goal.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-3 shrink-0">
                            <PriorityBadge priority={goal.priority} />
                            <div className="relative">
                              <button
                                onClick={() => setMenuOpen(menuOpen === goal.id ? null : goal.id)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                              {menuOpen === goal.id && (
                                <div className="absolute right-0 top-8 z-20 w-36 bg-white border border-slate-200 rounded-xl shadow-2xl py-1">
                                  <button
                                    onClick={() => { setEditingGoal(goal); setShowModal(true); setMenuOpen(null) }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#0F172A] hover:bg-slate-100"
                                  >
                                    <Pencil className="w-3.5 h-3.5 text-[#64748B]" /> Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(goal.id)}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#EF4444] hover:bg-[#EF4444]/10"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="ml-10">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-[#64748B]">{goal.completionPct}% complete</span>
                            <span className="text-xs text-[#64748B]">{goal.tasksCount} tasks</span>
                          </div>
                          <ProgressBar value={goal.completionPct} color={project.color} className="mb-3" />
                          <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Due {formatDate(goal.deadline)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    <button
                      onClick={() => { setEditingGoal({ projectId: project.id } as Goal); setShowModal(true) }}
                      className="flex items-center gap-2 text-xs text-[#64748B] hover:text-[#2563EB] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add goal to {project.name}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {(showModal || editingGoal) && (
        <GoalModal
          goal={editingGoal}
          projects={projects}
          onClose={() => { setShowModal(false); setEditingGoal(undefined) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
