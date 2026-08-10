"use client"

import { useState, useEffect } from "react"
import { User, Palette, Gift, Zap, Bell, CalendarDays, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SectionHeader } from "@/components/nerve/ui"
import { cn } from "@/lib/utils"
import { useNerveStore } from "@/lib/nerve-store"

const SETTINGS_SECTIONS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "theme", label: "Theme", icon: Palette },
  { id: "rewards", label: "Reward Settings", icon: Gift },
  { id: "xp", label: "XP Settings", icon: Zap },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "planner", label: "Planner Preferences", icon: CalendarDays },
]

const THEMES = [
  { id: "dark", label: "Dark", preview: "#09090B" },
  { id: "midnight", label: "Midnight", preview: "#050510" },
  { id: "carbon", label: "Carbon", preview: "#141414" },
]

const ACCENT_COLORS = [
  { id: "blue", label: "Electric Blue", color: "#2563EB" },
  { id: "emerald", label: "Emerald", color: "#10B981" },
  { id: "purple", label: "Purple", color: "#8B5CF6" },
  { id: "orange", label: "Orange", color: "#F97316" },
  { id: "pink", label: "Pink", color: "#EC4899" },
]

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "w-10 h-5.5 rounded-full transition-all relative",
        checked ? "bg-[#2563EB]" : "bg-slate-100"
      )}
    >
      <div
        className={cn(
          "absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-all",
          checked ? "left-[22px]" : "left-0.5"
        )}
        style={{ width: "18px", height: "18px" }}
      />
    </button>
  )
}

export default function SettingsPage() {
  const { userId, notificationSettings, updateNotificationSettings } = useNerveStore()
  
  const [activeSection, setActiveSection] = useState("profile")
  const [permission, setPermission] = useState<string>("default")
  const [subscribing, setSubscribing] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const subscribeToPush = async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      alert("Browser push notifications are not supported in this browser.")
      return
    }

    setSubscribing(true)
    try {
      const permissionResult = await Notification.requestPermission()
      setPermission(permissionResult)
      if (permissionResult !== "granted") {
        throw new Error("Permission not granted")
      }

      const reg = await navigator.serviceWorker.register("/sw.js")
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        throw new Error("VAPID public key is missing in environment variables.")
      }

      const padding = "=".repeat((4 - (vapidKey.length % 4)) % 4)
      const base64 = (vapidKey + padding).replace(/\-/g, "+").replace(/_/g, "/")
      const rawData = window.atob(base64)
      const outputArray = new Uint8Array(rawData.length)
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: outputArray
      })

      const res = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          subscription: sub
        })
      })

      if (!res.ok) {
        throw new Error("Failed to store subscription on server")
      }

      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      updateNotificationSettings({
        ...notificationSettings,
        timezone: userTimezone
      })

      alert("Successfully enabled browser push notifications!")
    } catch (e: any) {
      console.error("Push subscription error:", e)
      alert("Error enabling notifications: " + e.message)
    } finally {
      setSubscribing(false)
    }
  }

  const [selectedTheme, setSelectedTheme] = useState("dark")
  const [selectedAccent, setSelectedAccent] = useState("blue")
  const [name, setName] = useState("Alex")
  const [email, setEmail] = useState("alex@nerve.app")
  const [notifications, setNotifications] = useState({
    focusReminders: true,
    dailySummary: true,
    streakAlerts: true,
    xpUpdates: false,
    weeklyReport: true,
  })
  const [xpSettings, setXpSettings] = useState({
    multiplierEnabled: true,
    bonusOnStreak: true,
    xpPerPomodoro: 25,
    taskXpBase: 50,
  })
  const [plannerPrefs, setPlannerPrefs] = useState({
    defaultView: "daily",
    workdayStart: "09:00",
    workdayEnd: "18:00",
    defaultFocusLength: 25,
    breakLength: 5,
  })
  const [dailyCapacities, setDailyCapacities] = useState<Record<string, number>>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("nerve_daily_capacities")
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          // ignore
        }
      }
    }
    return { "Mon": 5, "Tue": 5, "Wed": 5, "Thu": 5, "Fri": 5, "Sat": 5, "Sun": 5 }
  })

  const renderSection = () => {
    switch (activeSection) {
      case "profile":
        return (
          <div className="space-y-5">
            <div className="flex items-center gap-5 mb-6">
              <div className="w-16 h-16 rounded-2xl nerve-gradient-blue flex items-center justify-center text-2xl font-bold text-[#0F172A] shrink-0">
                {name[0] ?? "A"}
              </div>
              <div>
                <p className="text-base font-bold text-[#0F172A]">{name}</p>
                <p className="text-sm text-[#64748B]">{email}</p>
                <button className="text-xs text-[#2563EB] mt-1 hover:underline">Change avatar</button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2 block">Display Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]/50"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2 block">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]/50"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2 block">Timezone</label>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]/50">
                <option>UTC-5 (Eastern Time)</option>
                <option>UTC-8 (Pacific Time)</option>
                <option>UTC+0 (GMT)</option>
                <option>UTC+1 (CET)</option>
              </select>
            </div>
            <Button className="nerve-gradient-blue text-white border-0 rounded-xl font-semibold hover:opacity-90">
              Save Changes
            </Button>
          </div>
        )

      case "theme":
        return (
          <div className="space-y-6">
            <div>
              <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-3 block">App Theme</label>
              <div className="grid grid-cols-3 gap-3">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTheme(t.id)}
                    className={cn(
                      "p-4 rounded-xl border text-center transition-all",
                      selectedTheme === t.id ? "border-[#2563EB]/50 bg-[#2563EB]/10" : "border-slate-200 bg-slate-50 hover:bg-slate-50"
                    )}
                  >
                    <div className="w-full h-10 rounded-lg mb-2" style={{ background: t.preview }} />
                    <p className="text-xs font-semibold text-[#0F172A]">{t.label}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-3 block">Accent Color</label>
              <div className="flex gap-3">
                {ACCENT_COLORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedAccent(c.id)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      selectedAccent === c.id ? "border-white scale-110" : "border-transparent opacity-70 hover:opacity-100"
                    )}
                    style={{ background: c.color }}
                  />
                ))}
              </div>
            </div>
          </div>
        )

      case "xp":
        return (
          <div className="space-y-5">
            {[
              { key: "multiplierEnabled", label: "XP Multiplier", sub: "Earn bonus XP for completing high-priority tasks" },
              { key: "bonusOnStreak", label: "Streak Bonus", sub: "Multiply XP by your streak day count" },
            ].map(({ key, label, sub }) => (
              <div key={key} className="flex items-center justify-between py-3 border-b border-slate-200">
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">{label}</p>
                  <p className="text-xs text-[#64748B] mt-0.5">{sub}</p>
                </div>
                <Toggle
                  checked={xpSettings[key as keyof typeof xpSettings] as boolean}
                  onChange={(v) => setXpSettings((s) => ({ ...s, [key]: v }))}
                />
              </div>
            ))}
            <div>
              <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2 block">Base XP per Task</label>
              <input
                type="number"
                value={xpSettings.taskXpBase}
                onChange={(e) => setXpSettings((s) => ({ ...s, taskXpBase: Number(e.target.value) }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]/50"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2 block">XP per Focus Session</label>
              <input
                type="number"
                value={xpSettings.xpPerPomodoro}
                onChange={(e) => setXpSettings((s) => ({ ...s, xpPerPomodoro: Number(e.target.value) }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]/50"
              />
            </div>
          </div>
        )

      case "notifications":
        return (
          <div className="space-y-5">
            {/* Permission Control */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">Browser Push Notifications</p>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {permission === "granted"
                      ? "✓ Active and receiving planner summaries."
                      : permission === "denied"
                      ? "❌ Blocked in browser. Reset browser settings to enable."
                      : "Not active. Enable to receive daily push updates."}
                  </p>
                </div>
                {permission !== "granted" && (
                  <Button
                    onClick={subscribeToPush}
                    disabled={subscribing}
                    className="nerve-gradient-blue text-white border-0 rounded-lg text-xs font-semibold hover:opacity-90 px-3.5 py-2"
                  >
                    {subscribing ? "Enabling..." : "Enable Pushes"}
                  </Button>
                )}
              </div>
            </div>

            {/* Morning Plan Notification */}
            <div className="flex items-center justify-between py-4 border-b border-slate-200">
              <div>
                <p className="text-sm font-semibold text-[#0F172A]">Morning Plan Notification</p>
                <p className="text-xs text-[#64748B] mt-0.5">Receive today's scheduled tasks and priority tasks count</p>
              </div>
              <Toggle
                checked={notificationSettings.morningEnabled}
                onChange={(v) => {
                  updateNotificationSettings({
                    ...notificationSettings,
                    morningEnabled: v,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                  })
                }}
              />
            </div>
            {notificationSettings.morningEnabled && (
              <div className="pb-4 border-b border-slate-200">
                <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2 block">Morning Time</label>
                <input
                  type="time"
                  value={notificationSettings.morningTime}
                  onChange={(e) => {
                    updateNotificationSettings({
                      ...notificationSettings,
                      morningTime: e.target.value,
                      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                    })
                  }}
                  className="w-32 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]/50"
                />
              </div>
            )}

            {/* Evening Progress Notification */}
            <div className="flex items-center justify-between py-4 border-b border-slate-200">
              <div>
                <p className="text-sm font-semibold text-[#0F172A]">Evening Progress Notification</p>
                <p className="text-xs text-[#64748B] mt-0.5">Receive completed count and remaining tasks summary</p>
              </div>
              <Toggle
                checked={notificationSettings.eveningEnabled}
                onChange={(v) => {
                  updateNotificationSettings({
                    ...notificationSettings,
                    eveningEnabled: v,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                  })
                }}
              />
            </div>
            {notificationSettings.eveningEnabled && (
              <div className="pb-4 border-b border-slate-200">
                <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2 block">Evening Time</label>
                <input
                  type="time"
                  value={notificationSettings.eveningTime}
                  onChange={(e) => {
                    updateNotificationSettings({
                      ...notificationSettings,
                      eveningTime: e.target.value,
                      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                    })
                  }}
                  className="w-32 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]/50"
                />
              </div>
            )}
          </div>
        )

      case "planner":
        return (
          <div className="space-y-5">
            <div>
              <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2 block">Default View</label>
              <div className="grid grid-cols-2 gap-2">
                {["daily", "weekly"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setPlannerPrefs((p) => ({ ...p, defaultView: v }))}
                    className={cn(
                      "py-2.5 rounded-xl text-sm font-semibold capitalize transition-all border",
                      plannerPrefs.defaultView === v
                        ? "border-[#2563EB]/40 bg-[#2563EB]/10 text-[#2563EB]"
                        : "border-slate-200 text-[#64748B] hover:text-[#0F172A]"
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2 block">Workday Start</label>
                <input
                  type="time"
                  value={plannerPrefs.workdayStart}
                  onChange={(e) => setPlannerPrefs((p) => ({ ...p, workdayStart: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]/50"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2 block">Workday End</label>
                <input
                  type="time"
                  value={plannerPrefs.workdayEnd}
                  onChange={(e) => setPlannerPrefs((p) => ({ ...p, workdayEnd: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]/50"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2 block">Focus Session (min)</label>
                <input
                  type="number"
                  value={plannerPrefs.defaultFocusLength}
                  onChange={(e) => setPlannerPrefs((p) => ({ ...p, defaultFocusLength: Number(e.target.value) }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]/50"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2 block">Break Length (min)</label>
                <input
                  type="number"
                  value={plannerPrefs.breakLength}
                  onChange={(e) => setPlannerPrefs((p) => ({ ...p, breakLength: Number(e.target.value) }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]/50"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 pt-5 mt-5">
              <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1 block">Daily Work Capacity (Hours)</label>
              <p className="text-[11px] text-[#64748B] mb-4">Set maximum available hours for the AI planner to schedule each day.</p>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                  <div key={day} className="flex flex-col items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-2">
                    <span className="text-[11px] font-bold text-[#0F172A]">{day}</span>
                    <input
                      type="number"
                      min={0}
                      max={24}
                      value={dailyCapacities[day] ?? 5}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(24, Number(e.target.value)))
                        const next = { ...dailyCapacities, [day]: val }
                        setDailyCapacities(next)
                        localStorage.setItem("nerve_daily_capacities", JSON.stringify(next))
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg text-center py-1 text-xs font-semibold text-[#0F172A] focus:border-[#2563EB]/50 outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="flex items-center justify-center h-32 text-[#64748B] text-sm">
            Coming soon
          </div>
        )
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <SectionHeader title="Settings" subtitle="Customize NERVE to fit your workflow." />

      <div className="grid grid-cols-3 gap-5">
        {/* Nav */}
        <div className="col-span-1 bg-[#FFFFFF] border border-slate-200 rounded-2xl p-2 h-fit">
          {SETTINGS_SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left",
                activeSection === id
                  ? "bg-[#2563EB]/10 text-[#2563EB]"
                  : "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
              <ChevronRight className={cn("w-3.5 h-3.5 ml-auto transition-transform", activeSection === id ? "text-[#2563EB]" : "text-transparent")} />
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="col-span-2 bg-[#FFFFFF] border border-slate-200 rounded-2xl p-6">
          <h2 className="text-base font-bold text-[#0F172A] mb-5">
            {SETTINGS_SECTIONS.find((s) => s.id === activeSection)?.label}
          </h2>
          {renderSection()}
        </div>
      </div>
    </div>
  )
}
