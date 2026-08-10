import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// Helper to sync tables, matching deletes and upserts for data consistency
async function syncTable(tableName: string, userId: string, items: any[], mapItem: (item: any) => any) {
  try {
    if (items.length === 0) {
      await supabase.from(tableName).delete().eq("user_id", userId)
    } else {
      // 1. Delete rows in Supabase that are not in the new client list
      const ids = items.map((item) => String(item.id))
      const formattedIds = `(${ids.map(id => `"${id}"`).join(",")})`
      await supabase.from(tableName).delete().eq("user_id", userId).not("id", "in", formattedIds)

      // 2. Map and Upsert the new list
      const mapped = items.map((item) => ({ ...mapItem(item), user_id: userId }))
      const { error } = await supabase.from(tableName).upsert(mapped)
      if (error) throw error
    }
  } catch (error) {
    console.error(`Error syncing table ${tableName}:`, error)
    throw error
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 })
    }

    // 1. Load User Profile Stats (XP & Streak)
    const { data: userProfile } = await supabase
      .from("users")
      .select("user_xp, streak")
      .eq("id", userId)
      .maybeSingle()

    // 2. Load Projects
    const { data: dbProjects } = await supabase.from("projects").select("*").eq("user_id", userId)
    const projects = (dbProjects || []).map((p) => ({
      id: p.id,
      name: p.name,
      icon: p.icon,
      color: p.color,
      status: p.status,
      description: p.description,
      progress: p.progress,
    }))

    // 3. Load Goals
    const { data: dbGoals } = await supabase.from("goals").select("*").eq("user_id", userId)
    const goals = (dbGoals || []).map((g) => ({
      id: g.id,
      projectId: g.project_id,
      name: g.name,
      deadline: g.deadline,
      priority: g.priority,
      completionPct: g.completion_pct,
      description: g.description,
    }))

    // 4. Load Tasks
    const { data: dbTasks } = await supabase.from("tasks").select("*").eq("user_id", userId)
    const tasks = (dbTasks || []).map((t) => ({
      id: t.id,
      projectId: t.project_id,
      goalId: t.goal_id || undefined,
      title: t.title,
      estimatedTime: t.estimated_time,
      priority: t.priority,
      xp: t.xp,
      status: t.status,
      notes: t.notes,
      scheduledDate: t.scheduled_date || undefined,
      scheduledBlock: t.scheduled_block || undefined,
      actualTime: t.actual_time || 0,
      dependsOnTaskId: t.depends_on_task_id || undefined,
    }))

    // 5. Load Rewards
    const { data: dbRewards } = await supabase.from("rewards").select("*").eq("user_id", userId)
    const rewards = (dbRewards || []).map((r) => ({
      id: r.id,
      name: r.name,
      emoji: r.emoji,
      xpCost: r.xp_cost,
      description: r.description,
      category: r.category,
      status: r.status,
    }))

    return NextResponse.json({
      userXp: userProfile?.user_xp ?? 0,
      streak: userProfile?.streak ?? 0,
      projects,
      goals,
      tasks,
      rewards,
      // Default fallback plan objects for backward compatibility during client migration
      dailyPlan: { morning: [], afternoon: [], evening: [] },
      weeklyPlan: { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] },
    })
  } catch (error) {
    console.error("GET store error:", error)
    return NextResponse.json({ error: "Failed to load store data" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 })
    }

    const body = await request.json()

    // 1. Update user profile stats (XP & Streak)
    await supabase
      .from("users")
      .update({
        user_xp: body.userXp ?? 0,
        streak: body.streak ?? 0,
      })
      .eq("id", userId)

    // 2. Sync projects
    await syncTable("projects", userId, body.projects ?? [], (p) => ({
      id: p.id,
      name: p.name,
      icon: p.icon || "",
      color: p.color || "",
      status: p.status || "active",
      description: p.description || "",
      progress: p.progress ?? 0,
    }))

    // 3. Sync goals
    await syncTable("goals", userId, body.goals ?? [], (g) => ({
      id: g.id,
      project_id: g.projectId,
      name: g.name,
      deadline: g.deadline || "",
      priority: g.priority || "medium",
      completion_pct: g.completionPct ?? 0,
      description: g.description || "",
    }))

    // 4. Sync tasks with the new columns
    await syncTable("tasks", userId, body.tasks ?? [], (t) => ({
      id: t.id,
      project_id: t.projectId,
      goal_id: t.goalId || null,
      title: t.title,
      estimated_time: t.estimatedTime || "1h",
      priority: t.priority || "medium",
      xp: t.xp ?? 50,
      status: t.status || "todo",
      notes: t.notes || "",
      scheduled_date: t.scheduledDate || null,
      scheduled_block: t.scheduled_block || null,
      actual_time: t.actualTime || 0,
      depends_on_task_id: t.dependsOnTaskId || null,
    }))

    // 5. Sync rewards
    await syncTable("rewards", userId, body.rewards ?? [], (r) => ({
      id: r.id,
      name: r.name,
      emoji: r.emoji || "",
      xp_cost: r.xpCost,
      description: r.description || "",
      category: r.category || "",
      status: r.status || "locked",
    }))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("POST store error:", error)
    return NextResponse.json({ error: "Failed to save store data" }, { status: 500 })
  }
}
