"use client"

import React, { createContext, useContext, useState, useEffect, useMemo } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  type Project,
  type Goal,
  type Task,
  type Reward,
  type Milestone,
} from "./nerve-data"

interface NerveStoreContextType {
  projects: Project[]
  goals: Goal[]
  tasks: Task[]
  rewards: Reward[]
  milestones: Milestone[]
  userXp: number
  streak: number
  dailyPlan: Record<string, string[]>
  weeklyPlan: Record<number, string[]>
  userId: string | null
  username: string | null
  displayName: string | null
  pendingMilestone: Milestone | null
  notificationSettings: {
    morningEnabled: boolean
    morningTime: string
    eveningEnabled: boolean
    eveningTime: string
    timezone: string
  }
  clearPendingMilestone: () => void
  toggleTaskComplete: (taskId: string) => void
  updateTask: (task: Task) => void
  updateTasks: (newTasks: Task[]) => void
  deleteTask: (taskId: string) => void
  updateGoal: (goal: Goal) => void
  deleteGoal: (goalId: string) => void
  updateProject: (project: Project) => void
  deleteProject: (projectId: string) => void
  updateReward: (reward: Reward) => void
  deleteReward: (rewardId: string) => void
  redeemReward: (rewardId: string) => void
  updateMilestone: (milestone: Milestone) => void
  deleteMilestone: (milestoneId: string) => void
  updateNotificationSettings: (settings: {
    morningEnabled: boolean
    morningTime: string
    eveningEnabled: boolean
    eveningTime: string
    timezone: string
  }) => void
  setDailyPlan: (plan: Record<string, string[]>) => void
  setWeeklyPlan: (plan: Record<number, string[]>) => void
  activeFocusTaskId: string | null
  focusSecondsLeft: number
  focusTotalSeconds: number
  isFocusRunning: boolean
  setFocusSecondsLeft: (s: number) => void
  setFocusTotalSeconds: (s: number) => void
  startFocus: (taskId: string, durationSeconds: number) => void
  pauseFocus: () => void
  resumeFocus: () => void
  resetFocus: () => void
  completeFocus: () => void
  switchFocusTask: () => void
  logout: () => void
}

const NerveStoreContext = createContext<NerveStoreContextType | undefined>(undefined)

function getWeekStart(d: Date) {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

export function NerveStoreProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const [isInitialized, setIsInitialized] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)

  const [projects, setProjects] = useState<Project[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [pendingMilestone, setPendingMilestone] = useState<Milestone | null>(null)
  const [userXp, setUserXp] = useState(0)
  const [streak, setStreak] = useState(0)

  // Focus Timer states
  const [activeFocusTaskId, setActiveFocusTaskId] = useState<string | null>(null)
  const [focusSecondsLeft, setFocusSecondsLeft] = useState(25 * 60)
  const [focusTotalSeconds, setFocusTotalSeconds] = useState(25 * 60)
  const [isFocusRunning, setIsFocusRunning] = useState(false)
  const [focusSecondsWorked, setFocusSecondsWorked] = useState(0)

  const [notificationSettings, setNotificationSettings] = useState({
    morningEnabled: false,
    morningTime: "08:00",
    eveningEnabled: false,
    eveningTime: "20:00",
    timezone: "UTC"
  })

  // 1. Monitor local user session and route redirection
  useEffect(() => {
    const storedUserId = localStorage.getItem("nerve_user_id")
    const storedUsername = localStorage.getItem("nerve_username")
    const storedDisplayName = localStorage.getItem("nerve_display_name")

    if (storedUserId) {
      setUserId(storedUserId)
      setUsername(storedUsername)
      setDisplayName(storedDisplayName)
    } else {
      if (pathname !== "/login" && pathname !== "/signup") {
        router.push("/login")
      }
    }
  }, [pathname, router])

  // Monitor storage events to update context on login/signup/logout
  useEffect(() => {
    const handleStorageChange = () => {
      const storedUserId = localStorage.getItem("nerve_user_id")
      const storedUsername = localStorage.getItem("nerve_username")
      const storedDisplayName = localStorage.getItem("nerve_display_name")

      if (storedUserId) {
        setUserId(storedUserId)
        setUsername(storedUsername)
        setDisplayName(storedDisplayName)
      } else {
        setUserId(null)
        setUsername(null)
        setDisplayName(null)
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  // 2. Initial hydration from API backend when userId is loaded
  useEffect(() => {
    async function loadData() {
      if (!userId) return
      try {
        const res = await fetch(`/api/store?userId=${userId}`)
        if (res.ok) {
          const data = await res.json()
          const fetchedTasks: Task[] = data.tasks ?? []

          // Rollover check: If task is scheduled in the past and is not completed, unschedule it
          const todayD = new Date()
          const yyyy = todayD.getFullYear()
          const mm = String(todayD.getMonth() + 1).padStart(2, "0")
          const dd = String(todayD.getDate()).padStart(2, "0")
          const localTodayStr = `${yyyy}-${mm}-${dd}`

          let hasRollover = false
          const rolledTasks = fetchedTasks.map((task) => {
            if (task.scheduledDate && task.scheduledDate < localTodayStr && task.status !== "completed") {
              hasRollover = true
              return {
                ...task,
                scheduledDate: undefined,
                scheduledBlock: undefined,
              }
            }
            return task
          })

          const hydratedXp = data.userXp ?? 0
          const hydratedRewards = (data.rewards ?? []).map((r: any) => {
            const status = hydratedXp >= r.xpCost ? ("available" as const) : ("locked" as const)
            return { ...r, status, currentXp: hydratedXp }
          })

          const inProgressTask = rolledTasks.find((t) => t.status === "in-progress")
          if (inProgressTask) {
            setActiveFocusTaskId(inProgressTask.id)
          }

          setProjects(data.projects ?? [])
          setGoals(data.goals ?? [])
          setTasks(rolledTasks)
          setRewards(hydratedRewards)
          setMilestones(data.milestones ?? [])
          setUserXp(hydratedXp)
          setStreak(data.streak ?? 0)
          if (data.notificationSettings) {
            setNotificationSettings(data.notificationSettings)
          }

          if (hasRollover) {
            persist(
              data.projects ?? [],
              data.goals ?? [],
              rolledTasks,
              data.rewards ?? [],
              data.userXp ?? 0,
              data.streak ?? 0,
              data.milestones ?? [],
              data.notificationSettings ?? notificationSettings
            )
          }
        }
      } catch (e) {
        console.error("Error loading Nerve state from backend API:", e)
      }
      setIsInitialized(true)
    }
    loadData()
  }, [userId])

  // Derived dailyPlan and weeklyPlan states based on tasks list (backward compatibility)
  const todayStr = useMemo(() => {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
  }, [tasks]) // Recalculate if tasks change to keep UI fresh

  const dailyPlan = useMemo(() => {
    const todayTasks = tasks.filter((t) => t.scheduledDate === todayStr)
    return {
      morning: todayTasks.filter((t) => t.scheduledBlock === "morning").map((t) => t.id),
      afternoon: todayTasks.filter((t) => t.scheduledBlock === "afternoon").map((t) => t.id),
      evening: todayTasks.filter((t) => t.scheduledBlock === "evening").map((t) => t.id),
    }
  }, [tasks, todayStr])

  const currentWeekDates = useMemo(() => {
    const start = getWeekStart(new Date())
    return [...Array(7)].map((_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, "0")
      const dd = String(d.getDate()).padStart(2, "0")
      return `${yyyy}-${mm}-${dd}`
    })
  }, [tasks])

  const weeklyPlan = useMemo(() => {
    const map: Record<number, string[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
    currentWeekDates.forEach((dateStr, i) => {
      map[i] = tasks.filter((t) => t.scheduledDate === dateStr).map((t) => t.id)
    })
    return map
  }, [tasks, currentWeekDates])

  // Initialize touch drag and drop polyfill
  useEffect(() => {
    if (typeof window !== "undefined") {
      Promise.all([
        import("mobile-drag-drop"),
        import("mobile-drag-drop/scroll-behaviour")
      ]).then(([mdd, override]) => {
        mdd.polyfill({
          dragImageTranslateOverride: override.scrollBehaviourDragImageTranslateOverride
        });
      });
    }
  }, [])

  // Load initial focus state from localStorage
  useEffect(() => {
    const storedActiveTaskId = localStorage.getItem("nerve_focus_task_id")
    const storedSecondsLeft = localStorage.getItem("nerve_focus_seconds_left")
    const storedTotalSeconds = localStorage.getItem("nerve_focus_total_seconds")
    const storedIsRunning = localStorage.getItem("nerve_focus_is_running")
    const storedSecondsWorked = localStorage.getItem("nerve_focus_seconds_worked")
    const storedLastTimestamp = localStorage.getItem("nerve_focus_last_timestamp")

    if (storedActiveTaskId) {
      setActiveFocusTaskId(storedActiveTaskId)
      const secsLeft = Number(storedSecondsLeft || 25 * 60)
      const totalSecs = Number(storedTotalSeconds || 25 * 60)
      const secsWorked = Number(storedSecondsWorked || 0)
      const isRunning = storedIsRunning === "true"

      if (isRunning && storedLastTimestamp) {
        const elapsedMs = Date.now() - Number(storedLastTimestamp)
        const elapsedSecs = Math.floor(elapsedMs / 1000)
        const newSecondsLeft = Math.max(0, secsLeft - elapsedSecs)
        const newSecondsWorked = secsWorked + Math.min(secsLeft, elapsedSecs)

        setFocusSecondsLeft(newSecondsLeft)
        setFocusSecondsWorked(newSecondsWorked)
        setIsFocusRunning(newSecondsLeft > 0)
      } else {
        setFocusSecondsLeft(secsLeft)
        setFocusSecondsWorked(secsWorked)
        setIsFocusRunning(false)
      }
      setFocusTotalSeconds(totalSecs)
    }
  }, [])

  // Sync active focus state to localStorage
  useEffect(() => {
    if (activeFocusTaskId) {
      localStorage.setItem("nerve_focus_task_id", activeFocusTaskId)
      localStorage.setItem("nerve_focus_seconds_left", String(focusSecondsLeft))
      localStorage.setItem("nerve_focus_total_seconds", String(focusTotalSeconds))
      localStorage.setItem("nerve_focus_is_running", String(isFocusRunning))
      localStorage.setItem("nerve_focus_seconds_worked", String(focusSecondsWorked))
      localStorage.setItem("nerve_focus_last_timestamp", String(Date.now()))
    } else {
      localStorage.removeItem("nerve_focus_task_id")
      localStorage.removeItem("nerve_focus_seconds_left")
      localStorage.removeItem("nerve_focus_total_seconds")
      localStorage.removeItem("nerve_focus_is_running")
      localStorage.removeItem("nerve_focus_seconds_worked")
      localStorage.removeItem("nerve_focus_last_timestamp")
    }
  }, [activeFocusTaskId, focusSecondsLeft, focusTotalSeconds, isFocusRunning, focusSecondsWorked])

  // Focus Timer Interval Ticking
  useEffect(() => {
    let timerInterval: ReturnType<typeof setInterval> | null = null

    if (isFocusRunning && activeFocusTaskId) {
      timerInterval = setInterval(() => {
        setFocusSecondsLeft((s) => {
          if (s <= 1) {
            setIsFocusRunning(false)
            setFocusSecondsWorked((w) => w + 1)
            return 0
          }
          setFocusSecondsWorked((w) => w + 1)
          return s - 1
        })
      }, 1000)
    }

    return () => {
      if (timerInterval) clearInterval(timerInterval)
    }
  }, [isFocusRunning, activeFocusTaskId])

  // Save progress when paused or inactive
  useEffect(() => {
    if (!isFocusRunning && focusSecondsWorked > 0 && activeFocusTaskId) {
      saveFocusTime(activeFocusTaskId, focusSecondsWorked)
      setFocusSecondsWorked(0)
    }
  }, [isFocusRunning, focusSecondsWorked, activeFocusTaskId])

  const saveFocusTime = (taskId: string, seconds: number) => {
    const task = tasks.find((t) => t.id === taskId)
    if (task) {
      updateTask({
        ...task,
        actualTime: (task.actualTime ?? 0) + seconds
      })
    }
  }

  const startFocus = (taskId: string, durationSeconds: number) => {
    setActiveFocusTaskId(taskId)
    setFocusSecondsLeft(durationSeconds)
    setFocusTotalSeconds(durationSeconds)
    setIsFocusRunning(true)
    setFocusSecondsWorked(0)

    const targetTask = tasks.find((t) => t.id === taskId)
    if (targetTask && targetTask.status !== "in-progress") {
      updateTask({ ...targetTask, status: "in-progress" })
    }
  }

  const pauseFocus = () => {
    setIsFocusRunning(false)
  }

  const resumeFocus = () => {
    setIsFocusRunning(true)
  }

  const resetFocus = () => {
    setIsFocusRunning(false)
    setFocusSecondsLeft(focusTotalSeconds)
    setFocusSecondsWorked(0)
  }

  const completeFocus = () => {
    setIsFocusRunning(false)
    if (activeFocusTaskId) {
      const secondsToSave = focusSecondsWorked
      const task = tasks.find((t) => t.id === activeFocusTaskId)
      if (task) {
        const nextActual = (task.actualTime ?? 0) + secondsToSave
        const updated = { ...task, actualTime: nextActual }
        updateTask(updated)
        if (updated.status !== "completed") {
          toggleTaskComplete(activeFocusTaskId)
        }
      }
      setFocusSecondsWorked(0)
      setActiveFocusTaskId(null)
    }
  }

  const switchFocusTask = () => {
    setIsFocusRunning(false)
    if (activeFocusTaskId) {
      if (focusSecondsWorked > 0) {
        saveFocusTime(activeFocusTaskId, focusSecondsWorked)
      }
      const task = tasks.find((t) => t.id === activeFocusTaskId)
      if (task) {
        updateTask({ ...task, status: "todo" })
      }
      setActiveFocusTaskId(null)
      setFocusSecondsWorked(0)
    }
  }

  // Helper to persist everything to the backend API
  const persist = async (
    nextProjects: Project[],
    nextGoals: Goal[],
    nextTasks: Task[],
    nextRewards: Reward[],
    nextXp: number,
    nextStreak: number,
    nextMilestones?: Milestone[],
    nextSettings?: typeof notificationSettings
  ) => {
    if (!userId) return
    try {
      await fetch(`/api/store?userId=${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projects: nextProjects,
          goals: nextGoals,
          tasks: nextTasks,
          rewards: nextRewards,
          milestones: nextMilestones ?? milestones,
          userXp: nextXp,
          streak: nextStreak,
          notificationSettings: nextSettings ?? notificationSettings
        }),
      })
    } catch (e) {
      console.error("Error writing Nerve state to backend API:", e)
    }
  }

  // Helper to recalculate progress percentages and counts
  const recalculateData = (
    currentTasks: Task[],
    currentGoals: Goal[],
    currentProjects: Project[]
  ) => {
    // A. Recalculate Goals progress based on tasks
    const updatedGoals = currentGoals.map((g) => {
      const tasksInGoal = currentTasks.filter((t) => t.goalId === g.id && t.projectId === g.projectId)
      if (tasksInGoal.length === 0) {
        return {
          ...g,
          tasksCount: 0,
          completionPct: 0,
          progress: 0,
        }
      }
      const completedCount = tasksInGoal.filter((t) => t.status === "completed").length
      const pct = Math.round((completedCount / tasksInGoal.length) * 100)
      return {
        ...g,
        tasksCount: tasksInGoal.length,
        completionPct: pct,
        progress: pct,
      }
    })

    // B. Recalculate Projects progress based on goals
    const updatedProjects = currentProjects.map((p) => {
      const goalsInProj = updatedGoals.filter((g) => g.projectId === p.id)
      const tasksInProj = currentTasks.filter((t) => t.projectId === p.id)
      
      const goalsCount = goalsInProj.length
      const activeTasksCount = tasksInProj.filter((t) => t.status !== "completed").length

      let progress = p.progress
      if (goalsCount > 0) {
        const completedGoals = goalsInProj.filter((g) => g.completionPct === 100).length
        progress = Math.round((completedGoals / goalsCount) * 100)
      }

      return {
        ...p,
        goalsCount,
        activeTasksCount,
        progress,
      }
    })

    return { updatedGoals, updatedProjects }
  }

  // State update wrapper
  const updateStore = (
    newTasks: Task[],
    newGoals: Goal[],
    newProjects: Project[],
    newRewards: Reward[] = rewards,
    newXp: number = userXp,
    newStreak: number = streak,
    newMilestones: Milestone[] = milestones,
    newSettings: typeof notificationSettings = notificationSettings
  ) => {
    const { updatedGoals, updatedProjects } = recalculateData(newTasks, newGoals, newProjects)
    
    setTasks(newTasks)
    setGoals(updatedGoals)
    setProjects(updatedProjects)
    setRewards(newRewards)
    setMilestones(newMilestones)
    setNotificationSettings(newSettings)
    setUserXp(newXp)
    setStreak(newStreak)

    persist(updatedProjects, updatedGoals, newTasks, newRewards, newXp, newStreak, newMilestones, newSettings)
  }

  // Planners setters (backward compatibility)
  const setDailyPlan = (plan: Record<string, string[]>) => {
    const nextTasks = tasks.map((t) => {
      if (plan.morning?.includes(t.id)) {
        return { ...t, scheduledDate: todayStr, scheduledBlock: "morning" as const }
      }
      if (plan.afternoon?.includes(t.id)) {
        return { ...t, scheduledDate: todayStr, scheduledBlock: "afternoon" as const }
      }
      if (plan.evening?.includes(t.id)) {
        return { ...t, scheduledDate: todayStr, scheduledBlock: "evening" as const }
      }
      if (t.scheduledDate === todayStr) {
        return { ...t, scheduledDate: undefined, scheduledBlock: undefined }
      }
      return t
    })
    updateStore(nextTasks, goals, projects)
  }

  const setWeeklyPlan = (plan: Record<number, string[]>) => {
    const nextTasks = tasks.map((t) => {
      let dayIndex: number | null = null
      for (let i = 0; i < 7; i++) {
        if (plan[i]?.includes(t.id)) {
          dayIndex = i
          break
        }
      }
      if (dayIndex !== null) {
        return { ...t, scheduledDate: currentWeekDates[dayIndex], scheduledBlock: t.scheduledBlock }
      }
      if (t.scheduledDate && currentWeekDates.includes(t.scheduledDate)) {
        return { ...t, scheduledDate: undefined, scheduledBlock: undefined }
      }
      return t
    })
    updateStore(nextTasks, goals, projects)
  }

  // Operations
  const toggleTaskComplete = (taskId: string) => {
    const targetTask = tasks.find((t) => t.id === taskId)
    if (!targetTask) return

    const newStatus = targetTask.status === "completed" ? "todo" : "completed"
    const xpChange = targetTask.xp

    const nextTasks = tasks.map((t) =>
      t.id === taskId ? { ...t, status: newStatus as typeof t.status } : t
    )

    let nextXp = newStatus === "completed" ? userXp + xpChange : Math.max(0, userXp - xpChange)
    let nextMilestones = milestones

    // --- Milestone completion detection ---
    if (newStatus === "completed") {
      const completedIds = new Set(nextTasks.filter(t => t.status === "completed").map(t => t.id))
      let milestoneBonusXp = 0
      let justCompletedMilestone: Milestone | null = null

      nextMilestones = milestones.map((m, idx) => {
        if (m.status !== "active") return m
        const allDone = m.requiredTaskIds.length > 0 && m.requiredTaskIds.every(id => completedIds.has(id))
        if (!allDone) return m

        const completedMilestone: Milestone = { ...m, status: "completed", completedAt: new Date().toISOString() }
        milestoneBonusXp += m.xpReward ?? 0
        justCompletedMilestone = completedMilestone
        return completedMilestone
      })

      // Unlock the next locked milestone in the same project
      if (justCompletedMilestone) {
        const cm = justCompletedMilestone as Milestone
        nextMilestones = nextMilestones.map(m => {
          if (m.projectId === cm.projectId && m.status === "locked" && m.order === cm.order + 1) {
            return { ...m, status: "active" as const }
          }
          return m
        })
        nextXp += milestoneBonusXp
        setPendingMilestone(justCompletedMilestone)
      }
    }

    // Automatically unlock/lock rewards based on new XP
    const nextRewards = rewards.map((r) => {
      if (r.status === "redeemed") return r
      const status = nextXp >= r.xpCost ? ("available" as const) : ("locked" as const)
      return { ...r, status, currentXp: nextXp }
    })

    updateStore(nextTasks, goals, projects, nextRewards, nextXp, streak, nextMilestones)
  }

  const updateTask = (task: Task) => {
    const exists = tasks.some((t) => t.id === task.id)
    const nextTasks = exists ? tasks.map((t) => (t.id === task.id ? task : t)) : [task, ...tasks]
    updateStore(nextTasks, goals, projects)
  }

  const updateTasks = (newTasks: Task[]) => {
    updateStore(newTasks, goals, projects)
  }

  const deleteTask = (taskId: string) => {
    const nextTasks = tasks.filter((t) => t.id !== taskId)
    updateStore(nextTasks, goals, projects)
  }

  const updateGoal = (goal: Goal) => {
    const exists = goals.some((g) => g.id === goal.id)
    const nextGoals = exists ? goals.map((g) => (g.id === goal.id ? goal : g)) : [goal, ...goals]
    updateStore(tasks, nextGoals, projects)
  }

  const deleteGoal = (goalId: string) => {
    const nextGoals = goals.filter((g) => g.id !== goalId)
    const nextTasks = tasks.map((t) => (t.goalId === goalId ? { ...t, goalId: undefined, goal: undefined } : t))
    updateStore(nextTasks, nextGoals, projects)
  }

  const updateProject = (project: Project) => {
    const exists = projects.some((p) => p.id === project.id)
    const nextProjects = exists ? projects.map((p) => (p.id === project.id ? project : p)) : [project, ...projects]
    updateStore(tasks, goals, nextProjects)
  }

  const deleteProject = (projectId: string) => {
    const nextProjects = projects.filter((p) => p.id !== projectId)
    const nextGoals = goals.filter((g) => g.projectId !== projectId)
    const nextTasks = tasks.filter((t) => t.projectId !== projectId)
    updateStore(nextTasks, nextGoals, nextProjects)
  }

  const updateMilestone = (milestone: Milestone) => {
    const exists = milestones.some((m) => m.id === milestone.id)
    let nextMilestones = exists
      ? milestones.map((m) => (m.id === milestone.id ? milestone : m))
      : [...milestones, milestone]
    
    let nextXp = userXp
    
    if (exists) {
      const original = milestones.find((m) => m.id === milestone.id)
      if (original && original.status === "completed" && milestone.status === "active") {
        const xpDeduct = original.xpReward ?? 0
        nextXp = Math.max(0, userXp - xpDeduct)
        
        nextMilestones = nextMilestones.map((m) => {
          if (m.projectId === milestone.projectId && m.order > milestone.order && m.status !== "completed") {
            return { ...m, status: "locked" as const }
          }
          return m
        })
      }
    }

    const nextRewards = rewards.map((r) => {
      if (r.status === "redeemed") return r
      const status = nextXp >= r.xpCost ? ("available" as const) : ("locked" as const)
      return { ...r, status, currentXp: nextXp }
    })

    updateStore(tasks, goals, projects, nextRewards, nextXp, streak, nextMilestones)
  }

  const deleteMilestone = (milestoneId: string) => {
    const nextMilestones = milestones.filter((m) => m.id !== milestoneId)
    updateStore(tasks, goals, projects, rewards, userXp, streak, nextMilestones)
  }

  const updateNotificationSettings = (settings: typeof notificationSettings) => {
    updateStore(tasks, goals, projects, rewards, userXp, streak, milestones, settings)
  }

  const updateReward = (reward: Reward) => {
    const exists = rewards.some((r) => r.id === reward.id)
    const nextRewards = exists ? rewards.map((r) => (r.id === reward.id ? reward : r)) : [reward, ...rewards]
    updateStore(tasks, goals, projects, nextRewards)
  }

  const deleteReward = (rewardId: string) => {
    const nextRewards = rewards.filter((r) => r.id !== rewardId)
    updateStore(tasks, goals, projects, nextRewards)
  }

  const redeemReward = (rewardId: string) => {
    const reward = rewards.find((r) => r.id === rewardId)
    if (!reward || reward.status !== "available" || userXp < reward.xpCost) return

    const nextXp = userXp - reward.xpCost
    const nextRewards = rewards.map((r) => {
      if (r.id === rewardId) {
        const status = nextXp >= r.xpCost ? ("available" as const) : ("locked" as const)
        return { ...r, status, currentXp: nextXp }
      }
      if (r.status === "redeemed") return r
      const status = nextXp >= r.xpCost ? ("available" as const) : ("locked" as const)
      return { ...r, status, currentXp: nextXp }
    })

    updateStore(tasks, goals, projects, nextRewards, nextXp, streak)
  }

  const logout = () => {
    localStorage.removeItem("nerve_user_id")
    localStorage.removeItem("nerve_username")
    localStorage.removeItem("nerve_display_name")
    setUserId(null)
    setUsername(null)
    setDisplayName(null)
    router.push("/login")
  }

  return (
    <NerveStoreContext.Provider
      value={{
        projects,
        goals,
        tasks,
        rewards,
        milestones,
        userXp,
        streak,
        dailyPlan,
        weeklyPlan,
        userId,
        username,
        displayName,
        pendingMilestone,
        notificationSettings,
        clearPendingMilestone: () => setPendingMilestone(null),
        toggleTaskComplete,
        updateTask,
        updateTasks,
        deleteTask,
        updateGoal,
        deleteGoal,
        updateProject,
        deleteProject,
        updateReward,
        deleteReward,
        redeemReward,
        updateMilestone,
        deleteMilestone,
        updateNotificationSettings,
        setDailyPlan,
        setWeeklyPlan,
        activeFocusTaskId,
        focusSecondsLeft,
        focusTotalSeconds,
        isFocusRunning,
        setFocusSecondsLeft,
        setFocusTotalSeconds,
        startFocus,
        pauseFocus,
        resumeFocus,
        resetFocus,
        completeFocus,
        switchFocusTask,
        logout,
      }}
    >
      {children}
    </NerveStoreContext.Provider>
  )
}

export function useNerveStore() {
  const context = useContext(NerveStoreContext)
  if (context === undefined) {
    throw new Error("useNerveStore must be used within a NerveStoreProvider")
  }
  return context
}
