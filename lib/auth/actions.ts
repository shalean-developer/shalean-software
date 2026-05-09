"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getPublicSiteUrl } from "@/lib/site/public-url";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import { getAuthenticatedRedirectPath } from "./auth-guards";
import { readAppRoleFromUser } from "./roles";
import { resolveSafeInternalRedirect } from "./safe-redirect";
import type { AuthActionState } from "./types";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const signUpSchema = credentialsSchema.extend({
  full_name: z.string().trim().min(1, "Name is required").max(200),
});

/**
 * Email/password signup. Only **user_metadata** is set here; `public.users` role
 * defaults via DB sync. Never set `app_metadata` from the browser.
 */
export async function signUpAction(
  _prev: AuthActionState | undefined,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    full_name: formData.get("full_name"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${await getPublicSiteUrl()}/auth/callback`,
      data: {
        full_name: parsed.data.full_name,
      },
    },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/", "layout");
  return { ok: true, navigateTo: "/login?notice=verify_email" };
}

export async function signInAction(
  _prev: AuthActionState | undefined,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/", "layout");
  revalidatePath("/dashboard");

  const nextRaw = formData.get("next");
  const nextPath = resolveSafeInternalRedirect(typeof nextRaw === "string" ? nextRaw : null);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    return {
      ok: true,
      navigateTo: getAuthenticatedRedirectPath(
        { ...user, resolvedRole: readAppRoleFromUser(user) },
        nextPath,
      ),
    };
  }

  return { ok: true, navigateTo: nextPath ?? "/dashboard" };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}
