import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/src/lib/supabase/server";

/**
 * Log out via plain POST (not a Server Action) so the browser never expects an RSC
 * action payload. Avoids Next 16 + Turbopack "unexpected response" failures on forms
 * embedded in shared layouts.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  } catch {
    /* Expired refresh token or network — still send user to login. */
  }
  return NextResponse.redirect(new URL("/login", request.url), 303);
}
