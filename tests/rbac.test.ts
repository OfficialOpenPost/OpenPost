import { describe, it, expect } from "vitest";
import {
  normalizeUserRole,
  hasRoleLevel,
  hasPermission,
  ROLE_HIERARCHY,
  ROLE_PERMISSIONS,
  UserRole,
} from "../src/lib/rbac";

describe("RBAC and Canonical Roles Engine", () => {
  it("normalizes legacy database roles to canonical uppercase roles", () => {
    expect(normalizeUserRole("owner")).toBe("ADMIN");
    expect(normalizeUserRole("OWNER")).toBe("ADMIN");
    expect(normalizeUserRole("admin")).toBe("ADMIN");
    expect(normalizeUserRole("ADMIN")).toBe("ADMIN");
    expect(normalizeUserRole("editor")).toBe("EDITOR");
    expect(normalizeUserRole("EDITOR")).toBe("EDITOR");
    expect(normalizeUserRole("author")).toBe("WRITER");
    expect(normalizeUserRole("contributor")).toBe("WRITER");
    expect(normalizeUserRole("WRITER")).toBe("WRITER");
    expect(normalizeUserRole("unknown" as any)).toBe("WRITER");
  });

  it("enforces strict role hierarchy order: WRITER < EDITOR < ADMIN", () => {
    expect(ROLE_HIERARCHY.WRITER).toBe(1);
    expect(ROLE_HIERARCHY.EDITOR).toBe(2);
    expect(ROLE_HIERARCHY.ADMIN).toBe(3);

    // ADMIN has at least WRITER and EDITOR level
    expect(hasRoleLevel("ADMIN", "WRITER")).toBe(true);
    expect(hasRoleLevel("ADMIN", "EDITOR")).toBe(true);
    expect(hasRoleLevel("ADMIN", "ADMIN")).toBe(true);

    // EDITOR has WRITER and EDITOR level, but NOT ADMIN level
    expect(hasRoleLevel("EDITOR", "WRITER")).toBe(true);
    expect(hasRoleLevel("EDITOR", "EDITOR")).toBe(true);
    expect(hasRoleLevel("EDITOR", "ADMIN")).toBe(false);

    // WRITER has only WRITER level
    expect(hasRoleLevel("WRITER", "WRITER")).toBe(true);
    expect(hasRoleLevel("WRITER", "EDITOR")).toBe(false);
    expect(hasRoleLevel("WRITER", "ADMIN")).toBe(false);
  });

  it("authorizes WRITER only for draft editing and reading", () => {
    expect(hasPermission("WRITER", "post.create")).toBe(true);
    expect(hasPermission("WRITER", "post.edit")).toBe(true);
    expect(hasPermission("WRITER", "media.upload")).toBe(true);
    expect(hasPermission("WRITER", "post.read_all")).toBe(true);

    // WRITER cannot publish, delete posts, manage taxonomy, or manage users
    expect(hasPermission("WRITER", "post.publish")).toBe(false);
    expect(hasPermission("WRITER", "post.delete")).toBe(false);
    expect(hasPermission("WRITER", "taxonomy.manage")).toBe(false);
    expect(hasPermission("WRITER", "project.delete")).toBe(false);
    expect(hasPermission("WRITER", "users.approve")).toBe(false);
  });

  it("authorizes EDITOR for publishing and taxonomy management", () => {
    expect(hasPermission("EDITOR", "post.create")).toBe(true);
    expect(hasPermission("EDITOR", "post.edit")).toBe(true);
    expect(hasPermission("EDITOR", "post.publish")).toBe(true);
    expect(hasPermission("EDITOR", "post.delete")).toBe(true);
    expect(hasPermission("EDITOR", "taxonomy.manage")).toBe(true);
    expect(hasPermission("EDITOR", "media.manage")).toBe(true);

    // EDITOR cannot delete projects, manage billing, or manage team
    expect(hasPermission("EDITOR", "project.delete")).toBe(false);
    expect(hasPermission("EDITOR", "project.manage_members")).toBe(false);
    expect(hasPermission("EDITOR", "tokens.manage")).toBe(false);
    expect(hasPermission("EDITOR", "users.approve")).toBe(false);
  });

  it("authorizes ADMIN with complete governance over project", () => {
    expect(hasPermission("ADMIN", "project.manage_members")).toBe(true);
    expect(hasPermission("ADMIN", "project.delete")).toBe(true);
    expect(hasPermission("ADMIN", "tokens.manage")).toBe(true);
    expect(hasPermission("ADMIN", "webhooks.manage")).toBe(true);
    expect(hasPermission("ADMIN", "settings.manage")).toBe(true);
    expect(hasPermission("ADMIN", "audit.read")).toBe(true);
    expect(hasPermission("ADMIN", "users.approve")).toBe(true);
  });
});
