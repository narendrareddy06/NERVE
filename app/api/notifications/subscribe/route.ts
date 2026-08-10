import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { userId, subscription } = await request.json()

    if (!userId || !subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      )
    }

    // Upsert subscription into push_subscriptions table
    const { data, error } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          user_id: userId,
          endpoint: subscription.endpoint,
          keys: subscription.keys,
        },
        { onConflict: "endpoint" }
      )

    if (error) {
      console.error("Supabase upsert subscription error:", error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("Subscribe API error:", e)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
