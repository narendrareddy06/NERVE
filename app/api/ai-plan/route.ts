import { NextRequest, NextResponse } from "next/server"

// ─── Type helpers ────────────────────────────────────────────────────────────

interface TaskInput {
  id: string
  title: string
  priority: string
  estimatedTime?: string
  xp: number
  projectId?: string
  project?: string
  goalId?: string
  dependsOnTaskId?: string
  status: string
  scheduledDate?: string
}

interface GoalInput {
  id: string
  name: string
  deadline?: string
}

interface ProjectInput {
  id: string
  name: string
}

interface AIPlanRequest {
  tasks: TaskInput[]                          // ALL non-completed tasks (scheduled + unscheduled)
  goals: GoalInput[]
  projects: ProjectInput[]
  weekDates: string[]                         // ISO date strings Mon-Sun
  dailyCapacities: Record<string, number>     // { "Mon": 5, ... }
}

interface AIPlanAssignment {
  taskId: string
  dateKey: string // yyyy-mm-dd
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseMinutes(timeStr?: string): number {
  if (!timeStr) return 60
  const cleaned = timeStr.trim().toLowerCase()
  if (cleaned.endsWith("h")) {
    const h = parseFloat(cleaned.slice(0, -1))
    return isNaN(h) ? 60 : h * 60
  }
  if (cleaned.endsWith("m")) {
    const m = parseFloat(cleaned.slice(0, -1))
    return isNaN(m) ? 60 : m
  }
  const n = parseFloat(cleaned)
  return isNaN(n) ? 60 : n * 60
}

function getTaskDayIndex(
  taskId: string,
  assignments: Map<string, string>,
  weekDates: string[]
): number {
  const dateKey = assignments.get(taskId)
  if (!dateKey) return -1
  return weekDates.indexOf(dateKey)
}

/** DFS to check for circular dependency */
function hasCircular(
  taskId: string,
  potentialDepId: string,
  tasks: TaskInput[]
): boolean {
  if (taskId === potentialDepId) return true
  const visited = new Set<string>()
  const queue = [potentialDepId]
  while (queue.length) {
    const cur = queue.shift()!
    if (cur === taskId) return true
    if (visited.has(cur)) continue
    visited.add(cur)
    const t = tasks.find((x) => x.id === cur)
    if (t?.dependsOnTaskId) queue.push(t.dependsOnTaskId)
  }
  return false
}

/**
 * Validate and sanitise the AI-generated assignment list against
 * NERVE's real scheduling constraints.
 *
 * @param rawAssignments - what the AI wants to schedule
 * @param tasks          - ALL non-completed tasks (used for duration + dependency lookup)
 * @param weekDates      - Mon-Sun date keys for this week
 * @param dailyCapacities - max hours per day label
 */
function validateAssignments(
  rawAssignments: AIPlanAssignment[],
  tasks: TaskInput[],
  weekDates: string[],
  dailyCapacities: Record<string, number>
): Map<string, string> {
  const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const MAX_TASKS_PER_DAY = 4

  // Build per-day workload tracker — pre-seeded with EXISTING scheduled tasks
  const dayStats = weekDates.map((dateKey, i) => ({
    dateKey,
    label: DAY_LABELS[i],
    minutes: 0,
    taskCount: 0,
    maxMinutes: (dailyCapacities[DAY_LABELS[i]] ?? 5) * 60,
  }))

  // Collect the IDs the AI wants to assign so we don't double-count them
  const aiTaskIds = new Set(rawAssignments.map((a) => a.taskId))

  // Pre-seed dayStats with tasks already scheduled on those days
  // (but NOT the ones the AI is trying to reschedule)
  for (const task of tasks) {
    if (!task.scheduledDate) continue
    if (aiTaskIds.has(task.id)) continue // AI will reassign this one — skip
    const dayIdx = weekDates.indexOf(task.scheduledDate)
    if (dayIdx === -1) continue
    dayStats[dayIdx].minutes += parseMinutes(task.estimatedTime)
    dayStats[dayIdx].taskCount += 1
  }

  const validated = new Map<string, string>()

  // Process in the order the AI gave us (it should have ordered by depth)
  for (const { taskId, dateKey } of rawAssignments) {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) continue

    const dayIdx = weekDates.indexOf(dateKey)
    if (dayIdx === -1) continue // unknown date — skip

    const duration = parseMinutes(task.estimatedTime)
    const day = dayStats[dayIdx]

    // --- Dependency constraint ---
    if (task.dependsOnTaskId) {
      const prereq = tasks.find((t) => t.id === task.dependsOnTaskId)
      if (prereq && prereq.status !== "completed") {
        const prereqDayIdx = getTaskDayIndex(task.dependsOnTaskId, validated, weekDates)
        if (prereqDayIdx === -1) {
          // Prereq not scheduled yet → skip this task too
          continue
        }
        if (dayIdx <= prereqDayIdx) {
          // Must come after prereq — push to next day if possible
          const nextIdx = prereqDayIdx + 1
          if (nextIdx >= weekDates.length) continue
          const nextDay = dayStats[nextIdx]
          if (nextDay.taskCount >= MAX_TASKS_PER_DAY) continue
          if (nextDay.minutes + duration > nextDay.maxMinutes) continue
          nextDay.minutes += duration
          nextDay.taskCount++
          validated.set(taskId, weekDates[nextIdx])
          continue
        }
      }
    }

    // --- Capacity constraints ---
    if (day.taskCount >= MAX_TASKS_PER_DAY) continue
    if (day.minutes + duration > day.maxMinutes) continue

    day.minutes += duration
    day.taskCount++
    validated.set(taskId, dateKey)
  }

  return validated
}

// ─── System prompt builder ────────────────────────────────────────────────────

function buildSystemPrompt(
  tasks: TaskInput[],
  goals: GoalInput[],
  projects: ProjectInput[],
  weekDates: string[],
  dailyCapacities: Record<string, number>
): string {
  const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  const nonCompletedTasks = tasks.filter((t) => t.status !== "completed")
  const alreadyScheduled = nonCompletedTasks.filter((t) => !!t.scheduledDate)
  const toSchedule = nonCompletedTasks.filter((t) => !t.scheduledDate)

  const existingLines = alreadyScheduled
    .map((t) => {
      const project = projects.find((p) => p.id === t.projectId)
      return `  - id:${t.id} | "${t.title}" | est:${t.estimatedTime ?? "1h"} | already_on:${t.scheduledDate}`
    })
    .join("\n") || "  (none)"

  const taskLines = toSchedule
    .map((t) => {
      const goal = goals.find((g) => g.id === t.goalId)
      const project = projects.find((p) => p.id === t.projectId)
      const prereq = t.dependsOnTaskId
        ? `depends_on:${t.dependsOnTaskId}`
        : "no_dependency"
      const deadline = goal?.deadline ? `goal_deadline:${goal.deadline}` : "no_deadline"
      return `  - id:${t.id} | "${t.title}" | priority:${t.priority} | est:${t.estimatedTime ?? "1h"} | xp:${t.xp} | project:${project?.name ?? "unknown"} | ${deadline} | ${prereq}`
    })
    .join("\n") || "  (none — all tasks already scheduled)"

  const capacityLines = weekDates
    .map((d, i) => `  ${d} (${DAY_LABELS[i]}): max ${dailyCapacities[DAY_LABELS[i]] ?? 5}h, max 4 tasks`)
    .join("\n")

  return `You are NERVE's AI weekly planner. Your job is to schedule the UNSCHEDULED TASKS across the week — respecting capacity, dependencies, and priorities.

## STRICT RULES (non-negotiable)
1. Never schedule more than 4 tasks per day (the existing schedule already uses some slots — account for them).
2. Never exceed the daily hour capacity — the existing schedule already uses some hours.
3. Respect dependencies: if task A depends_on task B (by id), task A MUST be scheduled on a LATER day than task B.
4. Only generate assignments for tasks listed under "UNSCHEDULED TASKS TO PLACE". Never move already-scheduled tasks.
5. Tasks with urgent deadlines (within 7 days) must be prioritised earlier in the week.
6. Critical priority > high > medium > low.
7. It is acceptable to leave a task unscheduled if there is genuinely no capacity.

## WEEK DATES (Mon-Sun)
${weekDates.map((d, i) => `  Day ${i} = ${d} (${DAY_LABELS[i]})`).join("\n")}

## DAILY CAPACITIES (max hours + tasks per day)
${capacityLines}

## ALREADY SCHEDULED THIS WEEK (for context — do NOT move these)
${existingLines}

## UNSCHEDULED TASKS TO PLACE
${taskLines}

## OUTPUT FORMAT
Your response must be a single valid JSON object and nothing else. No markdown, no backticks, no code fences, no explanations.
Start your response with { and end it with }.

Example shape (replace with real task IDs and dates):
{"assignments":[{"taskId":"abc123","dateKey":"${weekDates[0] ?? "YYYY-MM-DD"}"},{"taskId":"def456","dateKey":"${weekDates[1] ?? "YYYY-MM-DD"}"}],"reasoning":"Prioritised critical tasks early in the week, respecting dependencies and daily capacity."}`
}

// ─── JSON extractor (handles markdown fences and surrounding prose) ───────────

function extractJSON(raw: string): string {
  let s = raw.trim()

  // Strip markdown code fences: ```json ... ``` or ``` ... ```
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim()

  // Find outermost { ... }
  const start = s.indexOf('{')
  const end = s.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    s = s.slice(start, end + 1)
  }

  // Fix trailing commas before ] or } (common LLM mistake)
  s = s.replace(/,\s*([}\]])/g, "$1")

  return s
}

// ─── Route handler ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 })
  }

  let body: AIPlanRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { tasks, goals, projects, weekDates, dailyCapacities } = body
  if (!tasks || !weekDates || !dailyCapacities) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const systemPrompt = buildSystemPrompt(tasks, goals, projects, weekDates, dailyCapacities)

  // Call Groq
  let groqResponse: Response
  try {
    groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Generate the optimal weekly plan for these tasks. Respond with ONLY the JSON object — no explanation, no markdown, no backticks." },
        ],
        temperature: 0.2,
        max_tokens: 2048,
      }),
    })
  } catch (networkErr) {
    return NextResponse.json(
      { error: "Groq API network error", fallback: true },
      { status: 502 }
    )
  }

  if (!groqResponse.ok) {
    const errText = await groqResponse.text().catch(() => "unknown")
    return NextResponse.json(
      { error: `Groq API error ${groqResponse.status}: ${errText}`, fallback: true },
      { status: groqResponse.status }
    )
  }

  let groqData: { choices?: { message?: { content?: string } }[] }
  try {
    groqData = await groqResponse.json()
  } catch {
    return NextResponse.json({ error: "Failed to parse Groq response", fallback: true }, { status: 502 })
  }

  const rawContent = groqData.choices?.[0]?.message?.content ?? ""

  let parsed: { assignments?: AIPlanAssignment[]; reasoning?: string }
  try {
    // Extract JSON even if the model wraps it in markdown fences or adds prose
    const jsonStr = extractJSON(rawContent)
    parsed = JSON.parse(jsonStr)
  } catch {
    console.error("[ai-plan] Failed to parse AI response:", rawContent.slice(0, 500))
    return NextResponse.json({ error: "AI returned invalid JSON", fallback: true }, { status: 502 })
  }

  const rawAssignments: AIPlanAssignment[] = parsed.assignments ?? []
  if (!Array.isArray(rawAssignments)) {
    return NextResponse.json({ error: "AI response missing assignments array", fallback: true }, { status: 502 })
  }

  // Validate and enforce NERVE's own rules on top of AI output
  const validatedMap = validateAssignments(rawAssignments, tasks, weekDates, dailyCapacities)

  const finalAssignments = Array.from(validatedMap.entries()).map(([taskId, dateKey]) => ({
    taskId,
    dateKey,
  }))

  return NextResponse.json({
    assignments: finalAssignments,
    reasoning: parsed.reasoning ?? "",
  })
}
