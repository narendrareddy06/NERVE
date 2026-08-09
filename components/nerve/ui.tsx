"use client"

import { cn } from "@/lib/utils"
import { PRIORITY_COLORS, PRIORITY_LABELS, type Priority, type ProjectStatus, type TaskStatus } from "@/lib/nerve-data"

interface BadgeProps {
  children: React.ReactNode
  className?: string
  color?: string
}

export function NerveBadge({ children, className, color }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold",
        className
      )}
      style={color ? { background: `${color}18`, color } : undefined}
    >
      {children}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const color = PRIORITY_COLORS[priority]
  return (
    <NerveBadge color={color}>
      {PRIORITY_LABELS[priority]}
    </NerveBadge>
  )
}

export function StatusBadge({ status }: { status: ProjectStatus | TaskStatus | string }) {
  const map: Record<string, { label: string; color: string }> = {
    active: { label: 'Active', color: '#10B981' },
    paused: { label: 'Paused', color: '#F59E0B' },
    completed: { label: 'Completed', color: '#2563EB' },
    'in-progress': { label: 'In Progress', color: '#2563EB' },
    todo: { label: 'To Do', color: '#64748B' },
  }
  const s = map[status] ?? { label: status, color: '#64748B' }
  return <NerveBadge color={s.color}>{s.label}</NerveBadge>
}

interface ProgressBarProps {
  value: number
  className?: string
  color?: string
  height?: string
}

export function ProgressBar({ value, className, color = '#2563EB', height = 'h-1.5' }: ProgressBarProps) {
  return (
    <div className={cn(`w-full rounded-full bg-slate-100 overflow-hidden`, height, className)}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, value)}%`, background: color }}
      />
    </div>
  )
}

interface XPProgressBarProps {
  value: number
  max: number
  className?: string
}

export function XPProgressBar({ value, max, className }: XPProgressBarProps) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className={cn("w-full rounded-full bg-slate-100 overflow-hidden h-2", className)}>
      <div
        className="h-full rounded-full nerve-gradient-xp transition-all duration-700"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon?: React.ReactNode
  accent?: string
  className?: string
}

export function StatCard({ label, value, sub, icon, accent = '#2563EB', className }: StatCardProps) {
  return (
    <div className={cn(
      "bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-3",
      className
    )}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#64748B] uppercase tracking-wider">{label}</span>
        {icon && (
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: `${accent}14` }}
          >
            <span style={{ color: accent }}>{icon}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-[#0F172A] leading-none">{value}</p>
        {sub && <p className="text-xs text-[#64748B] mt-1">{sub}</p>}
      </div>
    </div>
  )
}

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-[#64748B] mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4 text-[#64748B]">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-[#0F172A] mb-2">{title}</h3>
      <p className="text-sm text-[#64748B] max-w-xs leading-relaxed mb-5">{description}</p>
      {action}
    </div>
  )
}
