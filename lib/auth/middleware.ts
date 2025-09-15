import { auth } from "@/app/auth"
import type { NextRequest } from "next/server"

export async function checkAuth(request: NextRequest) {
  try {
    const session = await auth()
    return session
  } catch (error) {
    console.error("Auth check failed:", error)
    return null
  }
}
