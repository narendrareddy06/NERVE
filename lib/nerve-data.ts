export type Priority = 'low' | 'medium' | 'high' | 'critical'
export type ProjectStatus = 'active' | 'paused' | 'completed'
export type TaskStatus = 'todo' | 'in-progress' | 'completed'
export type RewardStatus = 'available' | 'locked' | 'redeemed'

export interface Project {
  id: string
  name: string
  icon: string
  color: string
  progress: number
  goalsCount: number
  activeTasksCount: number
  priority: Priority
  status: ProjectStatus
  description: string
}

export interface Goal {
  id: string
  projectId: string
  name: string
  progress: number
  deadline: string
  priority: Priority
  tasksCount: number
  completionPct: number
  description: string
}

export interface Task {
  id: string
  title: string
  estimatedTime: string
  priority: Priority
  xp: number
  status: TaskStatus
  projectId: string
  goalId?: string
  notes?: string
  project: string
  goal?: string
  scheduledDate?: string
  scheduledBlock?: 'morning' | 'afternoon' | 'evening'
  actualTime?: number
  dependsOnTaskId?: string
}

export interface Reward {
  id: string
  name: string
  emoji: string
  xpCost: number
  description: string
  category: string
  status: RewardStatus
  currentXp?: number
}

export const SAMPLE_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Startup Launch',
    icon: '🚀',
    color: '#3B82F6',
    progress: 62,
    goalsCount: 5,
    activeTasksCount: 8,
    priority: 'critical',
    status: 'active',
    description: 'Building and launching the MVP for the SaaS product.',
  },
  {
    id: '2',
    name: 'Freelance Work',
    icon: '💼',
    color: '#10B981',
    progress: 40,
    goalsCount: 3,
    activeTasksCount: 4,
    priority: 'high',
    status: 'active',
    description: 'Client projects and freelance deliverables.',
  },
  {
    id: '3',
    name: 'College Semester',
    icon: '🎓',
    color: '#8B5CF6',
    progress: 75,
    goalsCount: 4,
    activeTasksCount: 6,
    priority: 'high',
    status: 'active',
    description: 'Final semester coursework and thesis completion.',
  },
  {
    id: '4',
    name: 'Fitness & Health',
    icon: '💪',
    color: '#F59E0B',
    progress: 55,
    goalsCount: 2,
    activeTasksCount: 3,
    priority: 'medium',
    status: 'active',
    description: 'Training program and nutrition goals.',
  },
  {
    id: '5',
    name: 'Side Project',
    icon: '⚡',
    color: '#06B6D4',
    progress: 20,
    goalsCount: 2,
    activeTasksCount: 2,
    priority: 'low',
    status: 'paused',
    description: 'Personal coding project for learning new technologies.',
  },
]

export const SAMPLE_GOALS: Goal[] = [
  {
    id: 'g1',
    projectId: '1',
    name: 'Ship MVP v1.0',
    progress: 70,
    deadline: '2026-08-30',
    priority: 'critical',
    tasksCount: 12,
    completionPct: 70,
    description: 'Complete and deploy the first version of the product.',
  },
  {
    id: 'g2',
    projectId: '1',
    name: 'Acquire 100 Beta Users',
    progress: 35,
    deadline: '2026-09-15',
    priority: 'high',
    tasksCount: 6,
    completionPct: 35,
    description: 'Onboard the first 100 beta testers through waitlist.',
  },
  {
    id: 'g3',
    projectId: '2',
    name: 'Deliver Client Dashboard',
    progress: 80,
    deadline: '2026-08-20',
    priority: 'high',
    tasksCount: 5,
    completionPct: 80,
    description: 'Complete the analytics dashboard for the client.',
  },
  {
    id: 'g4',
    projectId: '3',
    name: 'Complete Thesis Draft',
    progress: 60,
    deadline: '2026-08-25',
    priority: 'critical',
    tasksCount: 8,
    completionPct: 60,
    description: 'Write and submit the full thesis draft for review.',
  },
  {
    id: 'g5',
    projectId: '4',
    name: 'Run 5K in Under 25 Min',
    progress: 45,
    deadline: '2026-09-01',
    priority: 'medium',
    tasksCount: 4,
    completionPct: 45,
    description: 'Train consistently to hit the 5K time goal.',
  },
]

export const SAMPLE_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Design onboarding flow screens',
    estimatedTime: '2h',
    priority: 'critical',
    xp: 150,
    status: 'in-progress',
    projectId: '1',
    goalId: 'g1',
    project: 'Startup Launch',
    goal: 'Ship MVP v1.0',
    notes: 'Focus on reducing friction in first 3 steps.',
  },
  {
    id: 't2',
    title: 'Write API documentation',
    estimatedTime: '1.5h',
    priority: 'high',
    xp: 80,
    status: 'todo',
    projectId: '1',
    goalId: 'g1',
    project: 'Startup Launch',
    goal: 'Ship MVP v1.0',
  },
  {
    id: 't3',
    title: 'Set up analytics tracking',
    estimatedTime: '1h',
    priority: 'medium',
    xp: 60,
    status: 'todo',
    projectId: '1',
    goalId: 'g2',
    project: 'Startup Launch',
    goal: 'Acquire 100 Beta Users',
  },
  {
    id: 't4',
    title: 'Finalize dashboard UI components',
    estimatedTime: '3h',
    priority: 'high',
    xp: 120,
    status: 'in-progress',
    projectId: '2',
    goalId: 'g3',
    project: 'Freelance Work',
    goal: 'Deliver Client Dashboard',
  },
  {
    id: 't5',
    title: 'Write thesis introduction chapter',
    estimatedTime: '2.5h',
    priority: 'critical',
    xp: 200,
    status: 'todo',
    projectId: '3',
    goalId: 'g4',
    project: 'College Semester',
    goal: 'Complete Thesis Draft',
  },
  {
    id: 't6',
    title: 'Morning run — 4km',
    estimatedTime: '30m',
    priority: 'medium',
    xp: 40,
    status: 'completed',
    projectId: '4',
    goalId: 'g5',
    project: 'Fitness & Health',
    goal: 'Run 5K in Under 25 Min',
  },
  {
    id: 't7',
    title: 'Review competitor landing pages',
    estimatedTime: '45m',
    priority: 'low',
    xp: 30,
    status: 'completed',
    projectId: '1',
    project: 'Startup Launch',
  },
]

export const SAMPLE_REWARDS: Reward[] = [
  {
    id: 'r1',
    name: 'Movie Night',
    emoji: '🍿',
    xpCost: 500,
    description: 'Pick any movie and enjoy a full evening off.',
    category: 'Entertainment',
    status: 'available',
    currentXp: 1240,
  },
  {
    id: 'r2',
    name: 'Order Food',
    emoji: '🍕',
    xpCost: 300,
    description: 'Order from your favorite restaurant, no cooking.',
    category: 'Food',
    status: 'available',
    currentXp: 1240,
  },
  {
    id: 'r3',
    name: 'Gaming Session',
    emoji: '🎮',
    xpCost: 800,
    description: 'Guilt-free 3 hours of gaming.',
    category: 'Entertainment',
    status: 'available',
    currentXp: 1240,
  },
  {
    id: 'r4',
    name: 'Day Off',
    emoji: '😴',
    xpCost: 2000,
    description: 'A full day with zero obligations. Complete rest.',
    category: 'Rest',
    status: 'locked',
    currentXp: 1240,
  },
  {
    id: 'r5',
    name: 'New Gear',
    emoji: '🛒',
    xpCost: 3500,
    description: 'Budget to buy something you\'ve been wanting.',
    category: 'Shopping',
    status: 'locked',
    currentXp: 1240,
  },
  {
    id: 'r6',
    name: 'Weekend Trip',
    emoji: '✈️',
    xpCost: 5000,
    description: 'Plan a short trip somewhere new.',
    category: 'Travel',
    status: 'locked',
    currentXp: 1240,
  },
]

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: '#64748B',
  medium: '#F59E0B',
  high: '#2563EB',
  critical: '#EF4444',
}

const PRIORITY_WEIGHT: Record<Priority, number> = {
  critical: 3,
  high: 2,
  medium: 1,
  low: 0,
}

/** Parses strings like "2h", "1.5h", "45m", "2h 20m" into total minutes. */
export function parseEstimatedTime(input: string): number {
  const hourMatch = input.match(/([\d.]+)\s*h/)
  const minMatch = input.match(/([\d.]+)\s*m/)
  const hours = hourMatch ? Number.parseFloat(hourMatch[1]) : 0
  const mins = minMatch ? Number.parseFloat(minMatch[1]) : 0
  return Math.round(hours * 60 + mins)
}

/** Formats a total minute count back into a compact "Xh Ym" string. */
export function formatMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0m'
  const h = Math.floor(totalMinutes / 60)
  const m = Math.round(totalMinutes % 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export interface ProjectToday {
  project: Project
  tasksToday: Task[]
  completedToday: number
  totalToday: number
  plannedMinutes: number
  currentTask: Task | null
  earliestDeadline: string | null
}

/**
 * Derives "today" data for each active project from tasks/goals, then ranks
 * projects by priority, upcoming deadline, planned workload, and progress.
 */
export function getProjectsForToday(
  projects: Project[],
  tasks: Task[],
  goals: Goal[]
): ProjectToday[] {
  const active = projects.filter((p) => p.status === 'active')

  const withData: ProjectToday[] = active.map((project) => {
    const tasksToday = tasks.filter((t) => t.projectId === project.id)
    const completedToday = tasksToday.filter((t) => t.status === 'completed').length
    const plannedMinutes = tasksToday.reduce((sum, t) => sum + parseEstimatedTime(t.estimatedTime), 0)
    const currentTask =
      tasksToday.find((t) => t.status === 'in-progress') ??
      tasksToday.find((t) => t.status === 'todo') ??
      null
    const projectGoals = goals.filter((g) => g.projectId === project.id)
    const earliestDeadline = projectGoals.length
      ? projectGoals.reduce((earliest, g) => (g.deadline < earliest ? g.deadline : earliest), projectGoals[0].deadline)
      : null

    return {
      project,
      tasksToday,
      completedToday,
      totalToday: tasksToday.length,
      plannedMinutes,
      currentTask,
      earliestDeadline,
    }
  })

  return withData
    .filter((p) => p.totalToday > 0)
    .sort((a, b) => {
      const priorityDiff = PRIORITY_WEIGHT[b.project.priority] - PRIORITY_WEIGHT[a.project.priority]
      if (priorityDiff !== 0) return priorityDiff

      if (a.earliestDeadline && b.earliestDeadline) {
        const deadlineDiff = a.earliestDeadline.localeCompare(b.earliestDeadline)
        if (deadlineDiff !== 0) return deadlineDiff
      } else if (a.earliestDeadline) {
        return -1
      } else if (b.earliestDeadline) {
        return 1
      }

      const workloadDiff = b.plannedMinutes - a.plannedMinutes
      if (workloadDiff !== 0) return workloadDiff

      return b.project.progress - a.project.progress
    })
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

export const MOTIVATIONAL_QUOTES = [
  "The only way to do great work is to love what you do.",
  "Focus is the art of knowing what to ignore.",
  "Small steps every day lead to massive results.",
  "Your future self is watching. Make them proud.",
  "Discipline is choosing between what you want now and what you want most.",
  "The best time to start was yesterday. The next best time is now.",
  "Every expert was once a beginner. Keep going.",
]
