"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  type Project,
  type Goal,
  type Task,
  type Reward,
} from "./nerve-data"

interface NerveStoreContextType {
  projects: Project[]
  goals: Goal[]
  tasks: Task[]
  rewards: Reward[]
  userXp: number
  streak: number
  dailyPlan: Record<string, string[]>
  weeklyPlan: Record<number, string[]>
  userId: string | null
  username: string | null
  displayName: string | null
  toggleTaskComplete: (taskId: string) => void
  updateTask: (task: Task) => void
  deleteTask: (taskId: string) => void
  updateGoal: (goal: Goal) => void
  deleteGoal: (goalId: string) => void
  updateProject: (project: Project) => void
  deleteProject: (projectId: string) => void
  updateReward: (reward: Reward) => void
  deleteReward: (rewardId: string) => void
  redeemReward: (rewardId: string) => void
  setDailyPlan: (plan: Record<string, string[]>) => void
  setWeeklyPlan: (plan: Record<number, string[]>) => void
  logout: () => void
}

const NerveStoreContext = createContext<NerveStoreContextType | undefined>(undefined)

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
  const [userXp, setUserXp] = useState(0)
  const [streak, setStreak] = useState(0)
  const [dailyPlan, setDailyPlanState] = useState<Record<string, string[]>>({
    morning: [],
    afternoon: [],
    evening: [],
  })
  const [weeklyPlan, setWeeklyPlanState] = useState<Record<number, string[]>>({
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
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
          setProjects(data.projects ?? [])
          setGoals(data.goals ?? [])
          setTasks(data.tasks ?? [])
          setRewards(data.rewards ?? [])
          setUserXp(data.userXp ?? 0)
          setStreak(data.streak ?? 0)
          setDailyPlanState(data.dailyPlan ?? { morning: [], afternoon: [], evening: [] })
          setWeeklyPlanState(data.weeklyPlan ?? { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] })
        }
      } catch (e) {
        console.error("Error loading Nerve state from backend API:", e)
      }
      setIsInitialized(true)
    }
    loadData()
  }, [userId])

  // Helper to persist everything to the backend API
  const persist = async (
    nextProjects: Project[],
    nextGoals: Goal[],
    nextTasks: Task[],
    nextRewards: Reward[],
    nextXp: number,
    nextStreak: number,
    nextDaily: Record<string, string[]> = dailyPlan,
    nextWeekly: Record<number, string[]> = weeklyPlan
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
          userXp: nextXp,
          streak: nextStreak,
          dailyPlan: nextDaily,
          weeklyPlan: nextWeekly,
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

  // 2. State update wrappers that trigger recalculation and persistence
  const updateStore = (
    newTasks: Task[],
    newGoals: Goal[],
    newProjects: Project[],
    newRewards: Reward[] = rewards,
    newXp: number = userXp,
    newStreak: number = streak,
    newDaily: Record<string, string[]> = dailyPlan,
    newWeekly: Record<number, string[]> = weeklyPlan
  ) => {
    const { updatedGoals, updatedProjects } = recalculateData(newTasks, newGoals, newProjects)
    
    setTasks(newTasks)
    setGoals(updatedGoals)
    setProjects(updatedProjects)
    setRewards(newRewards)
    setUserXp(newXp)
    setStreak(newStreak)
    setDailyPlanState(newDaily)
    setWeeklyPlanState(newWeekly)

    persist(updatedProjects, updatedGoals, newTasks, newRewards, newXp, newStreak, newDaily, newWeekly)
  }

  // Planners setters
  const setDailyPlan = (plan: Record<string, string[]>) => {
    updateStore(tasks, goals, projects, rewards, userXp, streak, plan, weeklyPlan)
  }

  const setWeeklyPlan = (plan: Record<number, string[]>) => {
    updateStore(tasks, goals, projects, rewards, userXp, streak, dailyPlan, plan)
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

    const nextXp = newStatus === "completed" ? userXp + xpChange : Math.max(0, userXp - xpChange)

    // Automatically unlock/lock rewards based on new XP
    const nextRewards = rewards.map((r) => {
      if (r.status === "redeemed") return r
      const status = nextXp >= r.xpCost ? ("available" as const) : ("locked" as const)
      return { ...r, status, currentXp: nextXp }
    })

    updateStore(nextTasks, goals, projects, nextRewards, nextXp, streak, dailyPlan, weeklyPlan)
  }

  const updateTask = (task: Task) => {
    const exists = tasks.some((t) => t.id === task.id)
    const nextTasks = exists ? tasks.map((t) => (t.id === task.id ? task : t)) : [task, ...tasks]
    updateStore(nextTasks, goals, projects)
  }

  const deleteTask = (taskId: string) => {
    const nextTasks = tasks.filter((t) => t.id !== taskId)
    // Clean up task references in plans
    const nextDaily = { ...dailyPlan }
    Object.keys(nextDaily).forEach((key) => {
      nextDaily[key] = nextDaily[key].filter((id) => id !== taskId)
    })
    const nextWeekly = { ...weeklyPlan }
    Object.keys(nextWeekly).forEach((key) => {
      const idx = Number(key)
      nextWeekly[idx] = nextWeekly[idx].filter((id) => id !== taskId)
    })

    updateStore(nextTasks, goals, projects, rewards, userXp, streak, nextDaily, nextWeekly)
  }

  const updateGoal = (goal: Goal) => {
    const exists = goals.some((g) => g.id === goal.id)
    const nextGoals = exists ? goals.map((g) => (g.id === goal.id ? goal : g)) : [goal, ...goals]
    updateStore(tasks, nextGoals, projects)
  }

  const deleteGoal = (goalId: string) => {
    const nextGoals = goals.filter((g) => g.id !== goalId)
    // Clean up task references
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
        return { ...r, status: "redeemed" as const, currentXp: nextXp }
      }
      if (r.status === "redeemed") return r
      const status = nextXp >= r.xpCost ? ("available" as const) : ("locked" as const)
      return { ...r, status, currentXp: nextXp }
    })

    updateStore(tasks, goals, projects, nextRewards, nextXp, streak, dailyPlan, weeklyPlan)
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
        userXp,
        streak,
        dailyPlan,
        weeklyPlan,
        userId,
        username,
        displayName,
        toggleTaskComplete,
        updateTask,
        deleteTask,
        updateGoal,
        deleteGoal,
        updateProject,
        deleteProject,
        updateReward,
        deleteReward,
        redeemReward,
        setDailyPlan,
        setWeeklyPlan,
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
