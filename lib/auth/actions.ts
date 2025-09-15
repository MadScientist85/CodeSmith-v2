import { signIn, signOut } from "@/app/auth"
import { db } from "@/lib/database/connection"
import { users } from "@/lib/database/schema"
import bcrypt from "bcryptjs"
import { z } from "zod"

const signUpSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export async function signUpWithCredentials(formData: FormData) {
  try {
    const rawData = {
      displayName: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    }

    const { displayName, email, password } = signUpSchema.parse(rawData)

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email),
    })

    if (existingUser) {
      return { error: "User with this email already exists" }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    await db.insert(users).values({
      displayName,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    })

    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    return { error: "Something went wrong" }
  }
}

export async function signInWithCredentials(formData: FormData) {
  try {
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    })

    return { success: true }
  } catch (error) {
    return { error: "Invalid credentials" }
  }
}

export async function signOutUser() {
  await signOut({ redirectTo: "/" })
}
