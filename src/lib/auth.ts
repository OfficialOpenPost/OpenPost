import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

export type Role = "ADMIN" | "EDITOR" | "WRITER";

const hierarchy: Record<Role, number> = { WRITER: 1, EDITOR: 2, ADMIN: 3 };

export async function getCurrentUser() {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await db.user.findUnique({ where: { id: user.id } }).catch(() => null);
  // Map legacy roles to new
  const rawRole = (profile?.role as string) ?? "WRITER";
  const role = rawRole.toUpperCase() as Role;
  const normalized = ["ADMIN", "EDITOR", "WRITER"].includes(role) ? role : "WRITER";

  return { id: user.id, email: user.email!, role: normalized as Role, rawRole };
}

export function can(user: { role: Role } | null, action: "manage_users" | "manage_settings" | "publish" | "manage_media" | "manage_categories") {
  if (!user) return false;
  const level = hierarchy[user.role];
  switch (action) {
    case "manage_users":
    case "manage_settings":
      return level >= hierarchy.ADMIN;
    case "publish":
      return level >= hierarchy.EDITOR;
    case "manage_media":
    case "manage_categories":
      return level >= hierarchy.EDITOR;
    default:
      return false;
  }
}

export async function requireRole(role: Role) {
  const user = await getCurrentUser();
  if (!user || hierarchy[user.role] < hierarchy[role]) {
    throw new Error("Forbidden — insufficient role");
  }
  return user;
}
