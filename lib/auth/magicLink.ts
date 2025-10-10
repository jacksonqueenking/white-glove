interface MagicLinkPayload {
  email: string;
  userType: "client" | "venue" | "vendor";
  redirectTo: string;
}

// Call Supabase to send OTP magic links per authentication documentation.
export async function sendMagicLink({ email, userType, redirectTo }: MagicLinkPayload) {
  // TODO: Wire up supabase.auth.signInWithOtp using lib/db/supabaseClient.ts.
  return {
    email,
    userType,
    redirectTo,
    status: "pending",
  };
}
