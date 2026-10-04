"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { loginSchema } from "@/lib/validations/auth";
import { getUserByEmail } from "@/lib/db/user";
import { createSession, destroySession } from "@/lib/auth/session";
import { ActionResponse } from "@/types";

export async function loginAction(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");

  const validationResult = loginSchema.safeParse({
    email: rawEmail,
    password: rawPassword,
  });

  if (!validationResult.success) {
    const formattedErrors = validationResult.error.flatten().fieldErrors;
    return {
      success: false,
      message: "Please fix the validation errors below.",
      errors: formattedErrors as Record<string, string[]>,
    };
  }

  const { email, password } = validationResult.data;

  const user = await getUserByEmail(email);

  if (!user) {
    // Perform dummy compare to mitigate timing attacks
    await bcrypt.compare(
      password,
      "$2a$10$abcdefghijklmnopqrstuuabcdefghijklmnopqrstuuuuuuuuuuuuu"
    );
    return {
      success: false,
      message: "Invalid email or password.",
    };
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    return {
      success: false,
      message: "Invalid email or password.",
    };
  }

  // Create session cookie
  await createSession(user.id);

  // Redirect to dashboard
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
