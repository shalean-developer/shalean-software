import { type NextRequest, NextResponse } from "next/server";

import {
  evaluateRouteAccess,
  getAuthenticatedRedirectPath,
} from "@/lib/auth/auth-guards";
import { isAuthCallbackRoute, isAuthRoute, isProtectedRoute } from "@/lib/auth/config";
import { readAppRoleFromUser } from "@/lib/auth/roles";
import { resolveSafeInternalRedirect } from "@/lib/auth/safe-redirect";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;
  const authUser = user ? { ...user, resolvedRole: readAppRoleFromUser(user) } : null;

  if (isAuthCallbackRoute(pathname)) {
    return response;
  }

  const access = evaluateRouteAccess({
    request,
    user: authUser,
    isProtected: isProtectedRoute(pathname),
  });

  if (!access.ok) {
    const url = new URL(access.redirectTo, request.url);
    return NextResponse.redirect(url);
  }

  if (authUser && isAuthRoute(pathname)) {
    const next = request.nextUrl.searchParams.get("next");
    const dest = resolveSafeInternalRedirect(next);
    const url = request.nextUrl.clone();
    url.pathname = getAuthenticatedRedirectPath(authUser, dest);
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
