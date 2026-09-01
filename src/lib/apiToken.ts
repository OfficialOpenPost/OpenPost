import { NextRequest } from "next/server";
import crypto from "crypto";
import { db, withDbRetry } from "@/lib/db";

export interface AuthenticatedIntegration {
  id: string;
  projectId: string;
  name: string;
  permissions: string[];
  tokenPrefix: string;
}

/**
 * Generates a cryptographically secure project-scoped API token.
 * Format: op_live_<64 hex characters>
 */
export function generateApiToken(): { rawToken: string; tokenHash: string; tokenPrefix: string } {
  const randomBytes = crypto.randomBytes(32).toString("hex");
  const rawToken = `op_live_${randomBytes}`;
  const tokenPrefix = `op_live_${randomBytes.slice(0, 6)}...`;
  const tokenHash = hashToken(rawToken);
  return { rawToken, tokenHash, tokenPrefix };
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token.trim()).digest("hex");
}

/**
 * Extracts and authenticates an integration token from Request headers.
 * Supports:
 * - Authorization: Bearer op_live_...
 * - X-OpenPost-Token: op_live_...
 */
export async function authenticateIntegration(
  req: NextRequest
): Promise<AuthenticatedIntegration | null> {
  try {
    let rawToken: string | null = null;

    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      rawToken = authHeader.slice(7).trim();
    } else {
      rawToken = req.headers.get("x-openpost-token");
    }

    if (!rawToken || !rawToken.startsWith("op_")) {
      return null;
    }

    const tokenHash = hashToken(rawToken);

    // Look up active (non-revoked) integration
    const integration = await withDbRetry(() =>
      db.integration.findFirst({
        where: {
          tokenHash,
          revokedAt: null,
        },
      })
    ).catch(() => null);

    if (!integration) {
      return null;
    }

    // Check X-OpenPost-Project header if provided — must match authorized project
    const projectHeader = req.headers.get("x-openpost-project");
    if (projectHeader && projectHeader !== integration.projectId) {
      // Token cannot be used to access a different project
      return null;
    }

    // Async update lastUsedAt (fire and forget)
    withDbRetry(() =>
      db.integration.update({
        where: { id: integration.id },
        data: { lastUsedAt: new Date() },
      })
    ).catch(() => {});

    return {
      id: integration.id,
      projectId: integration.projectId,
      name: integration.name,
      permissions: integration.permissions,
      tokenPrefix: integration.tokenPrefix,
    };
  } catch (err) {
    console.error("Error authenticating integration:", err);
    return null;
  }
}

/**
 * Resolves target project ID for public/v1 API requests.
 * Priority:
 * 1. Authenticated Integration Token (determines project)
 * 2. Query param `?project=slug-or-id` or `?projectId=...`
 * 3. Header `X-OpenPost-Project`
 */
export async function resolveProjectContext(
  req: NextRequest
): Promise<{ projectId: string; projectSlug?: string; integration?: AuthenticatedIntegration } | null> {
  // 1. Check Integration token
  const authIntegration = await authenticateIntegration(req);
  if (authIntegration) {
    return {
      projectId: authIntegration.projectId,
      integration: authIntegration,
    };
  }

  // 2. Check query parameters
  const { searchParams } = new URL(req.url);
  const projectParam = searchParams.get("project") || searchParams.get("projectId") || req.headers.get("x-openpost-project");

  if (projectParam && projectParam.trim()) {
    const clean = projectParam.trim();
    // Lookup by id or slug
    const project = await withDbRetry(() =>
      db.project.findFirst({
        where: {
          OR: [{ id: clean }, { slug: clean.toLowerCase() }],
        },
        select: { id: true, slug: true },
      })
    ).catch(() => null);

    if (project) {
      return { projectId: project.id, projectSlug: project.slug };
    }
  }

  // 3. Fallback to default/first project if only one exists in single-tenant setup
  const defaultProject = await withDbRetry(() =>
    db.project.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true, slug: true },
    })
  ).catch(() => null);

  if (defaultProject) {
    return { projectId: defaultProject.id, projectSlug: defaultProject.slug };
  }

  return null;
}
