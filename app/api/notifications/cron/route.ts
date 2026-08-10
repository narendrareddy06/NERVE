import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import webpush from "web-push"

// Configure VAPID details
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:admin@nerve.app",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
)

const PRIO_WEIGHT: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
}

export async function GET(request: Request) {
  try {
    // Basic verification token (optional, but good practice to check if it's vercel CRON)
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get("secret")
    
    // 1. Get all users
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, user_xp, streak, notification_settings")

    if (usersError) {
      console.error("Cron fetch users error:", usersError)
      throw usersError
    }

    const now = new Date()
    const dispatched: any[] = []

    // 2. Filter matching users based on timezone local hour
    for (const u of (users || [])) {
      const settings = u.notification_settings
      if (!settings) continue

      const timezone = settings.timezone || "UTC"
      let localHourStr = ""
      try {
        const formatter = new Intl.DateTimeFormat("en-US", {
          timeZone: timezone,
          hour: "2-digit",
          hour12: false
        })
        localHourStr = formatter.format(now)
      } catch (err) {
        console.error(`Invalid timezone for user ${u.id}:`, timezone)
        continue
      }

      const localHour = parseInt(localHourStr, 10)

      const morningHour = settings.morningEnabled && settings.morningTime
        ? parseInt(settings.morningTime.split(":")[0], 10)
        : null

      const eveningHour = settings.eveningEnabled && settings.eveningTime
        ? parseInt(settings.eveningTime.split(":")[0], 10)
        : null

      const isMorning = morningHour !== null && localHour === morningHour
      const isEvening = eveningHour !== null && localHour === eveningHour

      if (!isMorning && !isEvening) continue

      // 3. Determine user's local date string
      let localDateStr = ""
      try {
        const dateFormatter = new Intl.DateTimeFormat("en-US", {
          timeZone: timezone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        })
        const dParts = dateFormatter.formatToParts(now)
        const yyyy = dParts.find(p => p.type === "year")?.value
        const mm = dParts.find(p => p.type === "month")?.value
        const dd = dParts.find(p => p.type === "day")?.value
        localDateStr = `${yyyy}-${mm}-${dd}`
      } catch (e) {
        console.error("Error formatting date for user timezone:", e)
        continue
      }

      // 4. Fetch tasks for user's local date
      const { data: dbTasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", u.id)
        .eq("scheduled_date", localDateStr)

      const tasksList = dbTasks || []
      let title = ""
      let body = ""
      const url = "/daily"

      if (isMorning) {
        const activeTasks = tasksList.filter(t => t.status !== "completed")
        const topTask = [...activeTasks].sort((a, b) => {
          const wB = PRIO_WEIGHT[b.priority] || 0
          const wA = PRIO_WEIGHT[a.priority] || 0
          return wB - wA
        })[0]

        title = `🌅 Morning Plan: ${activeTasks.length} Tasks Scheduled`
        body = activeTasks.length > 0
          ? `Get started on your day! Top priority: "${topTask.title}". let's crush it!`
          : "No tasks scheduled for today. Take some time to plan your day!"
      } else if (isEvening) {
        const completed = tasksList.filter(t => t.status === "completed")
        const remaining = tasksList.filter(t => t.status !== "completed")

        title = `🌌 Evening Progress: ${completed.length}/${tasksList.length} Completed`
        body = tasksList.length > 0
          ? remaining.length > 0
            ? `You completed ${completed.length} tasks! Remaining: ${remaining.slice(0, 3).map(t => t.title).join(", ")}${remaining.length > 3 ? "..." : ""}`
            : "All tasks completed today! Outstanding work! 🏆"
          : "No tasks scheduled today. Sleep well!"
      }

      // 5. Fetch subscriptions
      const { data: subs } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", u.id)

      if (subs && subs.length > 0) {
        for (const sub of subs) {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: sub.keys
              },
              JSON.stringify({ title, body, url })
            )
            dispatched.push({ userId: u.id, type: isMorning ? "morning" : "evening" })
          } catch (sendErr: any) {
            console.error(`Error sending push to endpoint ${sub.endpoint}:`, sendErr)
            // If subscription has expired or is invalid, remove it
            if (sendErr.statusCode === 410 || sendErr.statusCode === 404) {
              await supabase.from("push_subscriptions").delete().eq("id", sub.id)
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, dispatched })
  } catch (e) {
    console.error("Cron Dispatcher API error:", e)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
