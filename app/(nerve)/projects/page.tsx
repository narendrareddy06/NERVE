"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, MoreHorizontal, Archive, Pencil, Trash2, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProgressBar, PriorityBadge, StatusBadge, SectionHeader, EmptyState } from "@/components/nerve/ui"
import { useNerveStore } from "@/lib/nerve-store"
import { type Project, type Priority, type ProjectStatus } from "@/lib/nerve-data"
import { cn } from "@/lib/utils"

const FILTERS: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Paused", value: "paused" },
  { label: "Completed", value: "completed" },
]

const ICON_OPTIONS = ["🚀","💼","🎓","💪","⚡","🎨","📚","🏗️","🧬","🎵","🌱","💡"]
const COLOR_OPTIONS = ["#2563EB","#10B981","#8B5CF6","#F59E0B","#EF4444","#06B6D4","#EC4899","#F97316"]

function ProjectModal({
  project,
  onClose,
  onSave,
}: {
  project?: Partial<Project>
  onClose: () => void
  onSave: (p: Project) => void
}) {
  const [name, setName] = useState(project?.name ?? "")
  const [icon, setIcon] = useState(project?.icon ?? "🚀")
  const [color, setColor] = useState(project?.color ?? "#2563EB")
  const [priority, setPriority] = useState<Priority>(project?.priority ?? "medium")
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? "active")
  const [description, setDescription] = useState(project?.description ?? "")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-[#FFFFFF] border border-slate-200 rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-[#0F172A] mb-5">{project?.id ? "Edit Project" : "New Project"}</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2 block">Project Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Startup Launch"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#64748B] outline-none focus:border-[#2563EB]/50 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2 block">Icon</label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((i) => (
                <button
                  key={i}
                  onClick={() => setIcon(i)}
                  className={cn(
                    "w-9 h-9 rounded-xl text-lg flex items-center justify-center border transition-all",
                    icon === i ? "border-[#2563EB]/60 bg-[#2563EB]/10" : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                  )}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2 block">Color</label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-7 h-7 rounded-full transition-all border-2",
                    color === c ? "border-white scale-110" : "border-transparent opacity-70 hover:opacity-100"
                  )}
                  style={{ background: c }}
                />
              ))}
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
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]/50"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?"
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
                id: project?.id ?? String(Date.now()),
                name: name || "Untitled Project",
                icon,
                color,
                priority,
                status,
                description,
                progress: project?.progress ?? 0,
                goalsCount: project?.goalsCount ?? 0,
                activeTasksCount: project?.activeTasksCount ?? 0,
              })
            }
            className="flex-1 nerve-gradient-blue text-white border-0 rounded-xl font-semibold hover:opacity-90"
          >
            {project?.id ? "Save Changes" : "Create Project"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const router = useRouter()
  const { projects, updateProject, deleteProject } = useNerveStore()
  const [filter, setFilter] = useState("all")
  const [showModal, setShowModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | undefined>()
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  const filtered = projects.filter((p) => filter === "all" || p.status === filter)

  const handleSave = (p: Project) => {
    updateProject(p)
    setShowModal(false)
    setEditingProject(undefined)
  }

  const handleDelete = (id: string) => {
    deleteProject(id)
    setMenuOpen(null)
  }

  const handleArchive = (id: string) => {
    const project = projects.find((p) => p.id === id)
    if (project) {
      updateProject({ ...project, status: "completed" })
    }
    setMenuOpen(null)
  }

  return (
    <div className="max-w-5xl mx-auto">
      <SectionHeader
        title="Projects"
        subtitle="Everything you&apos;re working on, in one place."
        action={
          <Button
            onClick={() => { setEditingProject(undefined); setShowModal(true) }}
            className="nerve-gradient-blue text-white border-0 gap-2 rounded-xl nerve-glow-blue hover:opacity-90 font-semibold"
          >
            <Plus className="w-4 h-4" /> New Project
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex gap-2 mb-7">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "px-4 py-1.5 rounded-xl text-sm font-medium transition-all",
              filter === f.value
                ? "bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20"
                : "text-[#64748B] hover:text-[#0F172A] bg-slate-50 border border-slate-200"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<span className="text-2xl">📂</span>}
          title="No projects yet"
          description="Create your first project to start organizing your goals and tasks."
          action={
            <Button onClick={() => setShowModal(true)} className="nerve-gradient-blue text-white border-0 rounded-xl gap-2 font-semibold hover:opacity-90">
              <Plus className="w-4 h-4" /> New Project
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <div
              key={project.id}
              className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-5 card-hover group relative cursor-pointer"
              onClick={() => router.push(`/projects/${project.id}`)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: `${project.color}18`, border: `1px solid ${project.color}30` }}
                  >
                    {project.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0F172A] leading-tight">{project.name}</h3>
                    <StatusBadge status={project.status} />
                  </div>
                </div>
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setMenuOpen(menuOpen === project.id ? null : project.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition-all"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {menuOpen === project.id && (
                    <div className="absolute right-0 top-8 z-20 w-40 bg-white border border-slate-200 rounded-xl shadow-2xl py-1 overflow-hidden">
                      <button
                        onClick={() => { setEditingProject(project); setShowModal(true); setMenuOpen(null) }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#0F172A] hover:bg-slate-100 transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5 text-[#64748B]" /> Edit
                      </button>
                      <button
                        onClick={() => handleArchive(project.id)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#0F172A] hover:bg-slate-100 transition-all"
                      >
                        <Archive className="w-3.5 h-3.5 text-[#64748B]" /> Archive
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#EF4444] hover:bg-[#EF4444]/10 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-xs text-[#64748B] mb-4 leading-relaxed line-clamp-2">{project.description}</p>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-[#64748B]">Progress</span>
                  <span className="text-xs font-semibold text-[#0F172A]">{project.progress}%</span>
                </div>
                <ProgressBar value={project.progress} color={project.color} />
              </div>

              {/* Meta */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <div className="flex items-center gap-3 text-xs text-[#64748B]">
                  <span>{project.goalsCount} goals</span>
                  <span>·</span>
                  <span>{project.activeTasksCount} tasks</span>
                </div>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={project.priority} />
                  <ChevronRight className="w-3.5 h-3.5 text-[#64748B] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(showModal || editingProject) && (
        <ProjectModal
          project={editingProject}
          onClose={() => { setShowModal(false); setEditingProject(undefined) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
