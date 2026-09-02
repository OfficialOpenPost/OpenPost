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
  it("normalizes legacy database roles to canonical 5 roles", () => {
    expect(normalizeUserRole("owner")).toBe("OWNER");
    expect(normalizeUserRole("OWNER")).toBe("OWNER");
    expect(normalizeUserRole("admin")).toBe("ADMIN");
    expect(normalizeUserRole("ADMIN")).toBe("ADMIN");
    expect(normalizeUserRole("editor")).toBe("EDITOR");
    expect(normalizeUserRole("EDITOR")).toBe("EDITOR");
    expect(normalizeUserRole("author")).toBe("AUTHOR");
    expect(normalizeUserRole("AUTHOR")).toBe("AUTHOR");
    expect(normalizeUserRole("contributor")).toBe("CONTRIBUTOR");
    expect(normalizeUserRole("CONTRIBUTOR")).toBe("CONTRIBUTOR");
    // WRITER deprecated alias maps to AUTHOR
    expect(normalizeUserRole("WRITER")).toBe("AUTHOR");
    expect(normalizeUserRole("writer")).toBe("AUTHOR");
    expect(normalizeUserRole("unknown" as any)).toBe("CONTRIBUTOR");
  });

  it("enforces strict role hierarchy order: CONTRIBUTOR < AUTHOR < EDITOR < ADMIN < OWNER", () => {
    expect(ROLE_HIERARCHY.CONTRIBUTOR).toBe(1);
    expect(ROLE_HIERARCHY.AUTHOR).toBe(2);
    expect(ROLE_HIERARCHY.EDITOR).toBe(3);
    expect(ROLE_HIERARCHY.ADMIN).toBe(4);
    expect(ROLE_HIERARCHY.OWNER).toBe(5);

    // OWNER has all levels
    expect(hasRoleLevel("OWNER", "CONTRIBUTOR")).toBe(true);
    expect(hasRoleLevel("OWNER", "AUTHOR")).toBe(true);
    expect(hasRoleLevel("OWNER", "EDITOR")).toBe(true);
    expect(hasRoleLevel("OWNER", "ADMIN")).toBe(true);
    expect(hasRoleLevel("OWNER", "OWNER")).toBe(true);

    // ADMIN has up to ADMIN
    expect(hasRoleLevel("ADMIN", "AUTHOR")).toBe(true);
    expect(hasRoleLevel("ADMIN", "EDITOR")).toBe(true);
    expect(hasRoleLevel("ADMIN", "OWNER")).toBe(false);

    // EDITOR has up to EDITOR
    expect(hasRoleLevel("EDITOR", "AUTHOR")).toBe(true);
    expect(hasRoleLevel("EDITOR", "EDITOR")).toBe(true);
    expect(hasRoleLevel("EDITOR", "ADMIN")).toBe(false);

    // AUTHOR has only AUTHOR/CONTRIBUTOR
    expect(hasRoleLevel("AUTHOR", "CONTRIBUTOR")).toBe(true);
    expect(hasRoleLevel("AUTHOR", "AUTHOR")).toBe(true);
    expect(hasRoleLevel("AUTHOR", "EDITOR")).toBe(false);

    // CONTRIBUTOR has only CONTRIBUTOR
    expect(hasRoleLevel("CONTRIBUTOR", "CONTRIBUTOR")).toBe(true);
    expect(hasRoleLevel("CONTRIBUTOR", "AUTHOR")).toBe(false);
  });

  it("authorizes CONTRIBUTOR only for draft creation and submit review", () => {
    expect(hasPermission("CONTRIBUTOR", "posts.create")).toBe(true);
    expect(hasPermission("CONTRIBUTOR", "posts.edit_own")).toBe(true);
    expect(hasPermission("CONTRIBUTOR", "posts.submit_review")).toBe(true);
    // Cannot publish
    expect(hasPermission("CONTRIBUTOR", "posts.publish_own")).toBe(false);
    expect(hasPermission("CONTRIBUTOR", "posts.publish_others")).toBe(false);
    expect(hasPermission("CONTRIBUTOR", "posts.schedule")).toBe(false);
    expect(hasPermission("CONTRIBUTOR", "posts.edit_others")).toBe(false);
    expect(hasPermission("CONTRIBUTOR", "members.invite")).toBe(false);
    // Legacy alias still works via backward compat but CONTRIBUTOR has minimal legacy perms
    expect(hasPermission("CONTRIBUTOR", "post.create")).toBe(true);
    expect(hasPermission("CONTRIBUTOR", "post.publish")).toBe(false);
  });

  it("authorizes AUTHOR for edit own but not publish others", () => {
    expect(hasPermission("AUTHOR", "posts.create")).toBe(true);
    expect(hasPermission("AUTHOR", "posts.edit_own")).toBe(true);
    expect(hasPermission("AUTHOR", "posts.submit_review")).toBe(true);
    // AUTHOR can publish_own per config (safe default allows publish_own) but not others — adjust per spec: AUTHOR should NOT publish_others
    expect(hasPermission("AUTHOR", "posts.edit_others")).toBe(false);
    expect(hasPermission("AUTHOR", "posts.publish_others")).toBe(false);
    expect(hasPermission("AUTHOR", "members.invite")).toBe(false);
  });

  it("authorizes EDITOR for publishing and taxonomy management", () => {
    expect(hasPermission("EDITOR", "posts.create")).toBe(true);
    expect(hasPermission("EDITOR", "posts.edit_others")).toBe(true);
    expect(hasPermission("EDITOR", "posts.publish_others")).toBe(true);
    expect(hasPermission("EDITOR", "posts.schedule")).toBe(true);
    expect(hasPermission("EDITOR", "authors.create")).toBe(true);
    expect(hasPermission("EDITOR", "authors.update")).toBe(true);
    // legacy
    expect(hasPermission("EDITOR", "post.publish")).toBe(true);
    expect(hasPermission("EDITOR", "taxonomy.manage")).toBe(true);

    // EDITOR cannot manage members or delete project
    expect(hasPermission("EDITOR", "members.invite")).toBe(false);
    expect(hasPermission("EDITOR", "project.delete")).toBe(false);
    expect(hasPermission("EDITOR", "members.update_role")).toBe(false);
  });

  it("authorizes ADMIN with governance but not OWNER delete", () => {
    expect(hasPermission("ADMIN", "members.invite")).toBe(true);
    expect(hasPermission("ADMIN", "members.approve")).toBe(true);
    expect(hasPermission("ADMIN", "audit.view")).toBe(true);
    expect(hasPermission("ADMIN", "settings.update")).toBe(true);
    expect(hasPermission("ADMIN", "authors.link_user")).toBe(true);
    // ADMIN cannot delete project if that is OWNER-only — but current ADMIN has project.delete true via OWNER parity? Check: ADMIN should have project.update but not delete? In our matrix ADMIN has no project.delete? Actually ADMIN has project.update but OWNER has delete. So verify
    // For now ADMIN has project.update but also gets delete? In new matrix ADMIN does not have project.delete? Check: OWNER has delete, ADMIN has not. So test expects ADMIN cannot delete? Let's allow ADMIN delete? spec says OWNER full control, ADMIN cannot delete project. So ADMIN should NOT have project.delete
    // We gave ADMIN project.update only, so this should be false. Update expectation accordingly
    expect(hasPermission("ADMIN", "project.delete")).toBe(false);
    expect(hasPermission("OWNER", "project.delete")).toBe(true);
  });

  it("authorizes OWNER with complete control", () => {
    expect(hasPermission("OWNER", "project.delete")).toBe(true);
    expect(hasPermission("OWNER", "members.update_role")).toBe(true);
    expect(hasPermission("OWNER", "audit.view")).toBe(true);
    expect(hasPermission("OWNER", "authors.delete")).toBe(true);
    expect(hasPermission("OWNER", "posts.publish_others")).toBe(true);
  });

  it("preserves deprecated WRITER alias for backward compat", () => {
    // WRITER maps to AUTHOR (2)
    expect(hasPermission("WRITER", "posts.create")).toBe(true);
    expect(hasPermission("WRITER", "posts.edit_own")).toBe(true);
    // Should not have publish_others
    expect(hasPermission("WRITER", "posts.publish_others")).toBe(false);
  });
});
