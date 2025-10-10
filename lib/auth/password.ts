interface PasswordSignInPayload {
  email: string;
  password: string;
}

interface PasswordSignUpPayload extends PasswordSignInPayload {
  userType: "client" | "venue" | "vendor" | "admin";
  metadata?: Record<string, unknown>;
}

// Wrapper for Supabase password-based auth flows.
export async function signInWithPassword({ email, password }: PasswordSignInPayload) {
  // TODO: Call supabase.auth.signInWithPassword using lib/db/supabaseClient.ts.
  return { email, status: "pending" };
}

export async function signUpWithPassword({ email, password, userType, metadata }: PasswordSignUpPayload) {
  // TODO: Call supabase.auth.signUp with metadata like onboarding status.
  return { email, userType, metadata, status: "pending" };
}
