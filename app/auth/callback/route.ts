import { NextResponse } from "next/server";

import { getAuthenticatedRedirectPath } from "@/lib/auth/auth-guards";
import { readAppRoleFromUser } from "@/lib/auth/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Email confirmation / magic-link return. Exchanges `code` for a session and sets cookies.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextRaw = url.searchParams.get("next") ?? "/dashboard";
  const nextPath =
    nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/dashboard";

  if (code) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.exchangeCodeForSession(code);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      return NextResponse.redirect(
        new URL(
          getAuthenticatedRedirectPath(
            { ...user, resolvedRole: readAppRoleFromUser(user) },
            nextPath,
          ),
          url.origin,
        ),
      );
    }
  }

  return NextResponse.redirect(new URL(nextPath, url.origin));
}
