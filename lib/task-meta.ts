export interface RecurringCompletion {
  completedAt: string
  xpAwarded: number
}

export interface TaskMeta {
  isRecurring?: boolean
  recurringHistory?: Record<string, RecurringCompletion>
}

const META_PREFIX = "<!--nerve_meta:"
const META_SUFFIX = "-->"

/**
 * Strips hidden metadata from task notes and returns clean user-visible notes,
 * along with the parsed metadata object.
 */
export function parseTaskNotes(notes?: string): { cleanNotes: string; meta: TaskMeta } {
  if (!notes) {
    return { cleanNotes: "", meta: {} }
  }

  const match = notes.match(/<!--nerve_meta:([\s\S]*?)-->/)
  if (!match) {
    return { cleanNotes: notes, meta: {} }
  }

  try {
    const meta: TaskMeta = JSON.parse(match[1])
    const cleanNotes = notes.replace(/<!--nerve_meta:[\s\S]*?-->/g, "").trimEnd()
    return { cleanNotes, meta }
  } catch {
    return { cleanNotes: notes, meta: {} }
  }
}

/**
 * Attaches metadata to the end of task notes in a clean HTML comment format
 * to preserve full compatibility with Supabase tables without requiring column migrations.
 */
export function serializeTaskNotes(notes?: string, meta?: TaskMeta): string {
  const cleanNotes = (notes || "").replace(/<!--nerve_meta:[\s\S]*?-->/g, "").trimEnd()

  const hasMeta =
    meta &&
    (meta.isRecurring ||
      (meta.recurringHistory && Object.keys(meta.recurringHistory).length > 0))

  if (!hasMeta) {
    return cleanNotes
  }

  const payload = JSON.stringify({
    isRecurring: Boolean(meta.isRecurring),
    recurringHistory: meta.recurringHistory || {},
  })

  const metaComment = `${META_PREFIX}${payload}${META_SUFFIX}`
  return cleanNotes ? `${cleanNotes}\n${metaComment}` : metaComment
}

/**
 * Determines whether a task is completed on a specific date (YYYY-MM-DD).
 * For daily recurring tasks, checks recurringHistory for that date.
 * For non-recurring tasks, checks the standard status property.
 */
export function isTaskCompletedOnDate(
  task: { isRecurring?: boolean; recurringHistory?: Record<string, any>; status: string },
  dateKey: string
): boolean {
  if (task.isRecurring) {
    return Boolean(task.recurringHistory?.[dateKey])
  }
  return task.status === "completed"
}

/**
 * Returns the effective status of a task for a given date.
 */
export function getTaskStatusOnDate(
  task: { isRecurring?: boolean; recurringHistory?: Record<string, any>; status: string },
  dateKey: string
): "todo" | "in-progress" | "completed" {
  if (task.isRecurring) {
    if (task.recurringHistory?.[dateKey]) {
      return "completed"
    }
    return task.status === "in-progress" ? "in-progress" : "todo"
  }
  return task.status as "todo" | "in-progress" | "completed"
}

