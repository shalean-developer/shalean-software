import { z } from "zod";

const roleEnum = z.enum(["customer", "cleaner", "dispatcher", "admin"]);

export const updateStaffRoleFormSchema = z.object({
  subject_user_id: z.string().uuid(),
  next_role: roleEnum,
  /** Optional operational note; truncated server-side */
  reason: z.string().trim().max(500).optional(),
});

export type UpdateStaffRoleInput = z.infer<typeof updateStaffRoleFormSchema>;

/** Normalize FormData / loose strings into validated input. */
export function parseUpdateStaffRoleFromFormData(formData: FormData): UpdateStaffRoleInput {
  const reasonRaw = formData.get("reason");
  return updateStaffRoleFormSchema.parse({
    subject_user_id: formData.get("subject_user_id"),
    next_role: formData.get("next_role"),
    reason:
      typeof reasonRaw === "string" && reasonRaw.trim() !== ""
        ? reasonRaw.trim()
        : undefined,
  });
}
