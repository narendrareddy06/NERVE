import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import crypto from "crypto"

const hashPassword = (pwd: string) => crypto.createHash("sha256").update(pwd).digest("hex")

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    // 1. Fetch user by username
    const { data: user, error } = await supabase
      .from("users")
      .select("id, username, password, display_name")
      .eq("username", username.toLowerCase().trim())
      .maybeSingle()

    if (error || !user) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 400 })
    }

    // 2. Validate password hash
    if (user.password !== hashPassword(password)) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      username: user.username,
      displayName: user.display_name,
    })
  } catch (error) {
    console.error("Login internal error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
