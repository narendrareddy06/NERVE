"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FolderKanban,
  Target,
  CheckSquare,
  Zap,
  CalendarDays,
  CalendarRange,
  Gift,
  BarChart3,
  Settings,
  Flame,
} from "lucide-react"

import { useNerveStore } from "@/lib/nerve-store"

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Goals", href: "/goals", icon: Target },
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "Focus", href: "/focus", icon: Zap },
  { label: "Daily Plan", href: "/daily", icon: CalendarDays },
  { label: "Weekly Plan", href: "/weekly", icon: CalendarRange },
  { label: "Rewards", href: "/rewards", icon: Gift },
  { label: "Statistics", href: "/statistics", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
]

export function NerveSidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname()
  const { userXp, streak, displayName, username, logout } = useNerveStore()

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
        />
      )}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-[220px] flex flex-col bg-white border-r border-slate-200 z-50 transition-transform duration-300 ease-in-out shrink-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-5 flex items-center justify-between">
          <Link href="/" onClick={onClose} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg nerve-gradient-blue flex items-center justify-center nerve-glow-blue shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-widest text-[#0F172A] uppercase">NERVE</span>
            </div>
          </Link>
          {onClose && (
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 md:hidden text-[#64748B]">
              ✕
            </button>
          )}
        </div>

        {/* XP & Streak strip */}
        <div className="mx-3 mb-4 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full nerve-gradient-xp" />
            <span className="text-xs font-semibold text-[#0F172A]">{userXp.toLocaleString()} XP</span>
          </div>
          <div className="flex items-center gap-1 text-[#F59E0B]">
            <Flame className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">{streak}</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 overflow-y-auto space-y-0.5">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-[#2563EB]/[0.08] text-[#2563EB] border border-[#2563EB]/20"
                    : "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50"
                )}
              >
                <Icon
                  className={cn("w-4 h-4 shrink-0", active ? "text-[#2563EB]" : "")}
                />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-slate-200">
          <div
            onClick={() => {
              if (onClose) onClose()
              logout()
            }}
            title="Click to log out"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50/50 transition-all cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-full nerve-gradient-blue flex items-center justify-center text-xs font-bold text-white shrink-0 group-hover:from-red-600 group-hover:to-red-700">
              {(displayName || "U")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#0F172A] truncate leading-none mb-0.5">{displayName || "User"}</p>
              <p className="text-[10px] text-[#64748B] truncate">@{username || "user"}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
