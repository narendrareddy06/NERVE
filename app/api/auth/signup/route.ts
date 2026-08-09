import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import crypto from "crypto"

const hashPassword = (pwd: string) => crypto.createHash("sha256").update(pwd).digest("hex")

export async function POST(request: Request) {
  try {
    const { username, password, displayName } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    // 1. Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("username", username.toLowerCase().trim())
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json({ error: "Username is already taken" }, { status: 400 })
    }

    // 2. Insert new user
    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        username: username.toLowerCase().trim(),
        password: hashPassword(password),
        display_name: displayName || username,
        user_xp: 0,
        streak: 0,
      })
      .select("id, username, display_name")
      .single()

    if (error || !newUser) {
      console.error("Signup insert error:", error)
      return NextResponse.json({ error: "Failed to create user account" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      userId: newUser.id,
      username: newUser.username,
      displayName: newUser.display_name,
    })
  } catch (error) {
    console.error("Signup internal error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
