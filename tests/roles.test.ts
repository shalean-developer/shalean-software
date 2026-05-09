import type { User } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import { readAppRoleFromUser, userHasAtLeastRole } from "@/lib/auth/roles";

function mockUser(appMeta: Record<string, unknown>): User {
  return { id: "00000000-0000-4000-8000-000000000001", app_metadata: appMeta } as User;
}

describe("JWT app_metadata role governance", () => {
  it("defaults unknown roles to customer", () => {
    expect(readAppRoleFromUser(mockUser({ role: "superuser" }))).toBe("customer");
    expect(readAppRoleFromUser(mockUser({}))).toBe("customer");
  });

  it("normalizes case for known roles", () => {
    expect(readAppRoleFromUser(mockUser({ role: "Admin" }))).toBe("admin");
    expect(readAppRoleFromUser(mockUser({ role: "DISPATCHER" }))).toBe("dispatcher");
  });

  it("enforces minimum rank for userHasAtLeastRole", () => {
    const cleaner = mockUser({ role: "cleaner" });
    expect(userHasAtLeastRole(cleaner, "cleaner")).toBe(true);
    expect(userHasAtLeastRole(cleaner, "dispatcher")).toBe(false);
    const admin = mockUser({ role: "admin" });
    expect(userHasAtLeastRole(admin, "dispatcher")).toBe(true);
  });
});
