import type { Session, User } from "@supabase/supabase-js";

import { readAppRoleFromUser } from "./roles";
import {
  getRoleHomePath,
  toCanonicalOperationalRole,
  type CanonicalOperationalRole,
} from "./role-contracts";
import type { AppRole } from "./types";

export type OperationalIdentity = {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  role: AppRole;
  canonicalRole: CanonicalOperationalRole;
  homePath: string;
};

export type OperationalSession =
  | {
      status: "authenticated";
      session: Session | null;
      user: User;
      identity: OperationalIdentity;
    }
  | {
      status: "anonymous";
      session: null;
      user: null;
      identity: null;
    };

function readStringMetadata(user: User, key: string): string | null {
  const value = user.user_metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function normalizeOperationalIdentity(user: User): OperationalIdentity {
  const role = readAppRoleFromUser(user);
  return {
    id: user.id,
    email: user.email ?? null,
    displayName:
      readStringMetadata(user, "full_name") ??
      readStringMetadata(user, "name") ??
      readStringMetadata(user, "display_name"),
    avatarUrl:
      readStringMetadata(user, "avatar_url") ??
      readStringMetadata(user, "picture"),
    role,
    canonicalRole: toCanonicalOperationalRole(role),
    homePath: getRoleHomePath(role),
  };
}

export function normalizeOperationalSession(
  session: Session | null,
  userOverride?: User | null,
): OperationalSession {
  const user = userOverride ?? session?.user ?? null;
  if (!user) {
    return { status: "anonymous", session: null, user: null, identity: null };
  }
  return {
    status: "authenticated",
    session,
    user,
    identity: normalizeOperationalIdentity(user),
  };
}
