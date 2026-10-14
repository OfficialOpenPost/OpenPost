import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { verifyAuthUserMatchesEmail } from "@/lib/supabase/admin";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Creates (or completes) the caller's own profile after signup.
 *
 * SECURITY NOTES — this endpoint used to trust the request body completely:
 *  - `isOwner` came from the client → anyone could self-approve and become OWNER.
 *  - `userId` came from the client → anyone could overwrite another user's profile.
 * It is now enforced server-side:
 *  1. Rate limited per IP.
 *  2. `userId` must belong to the authenticated session, OR be a genuine Supabase
 *     Auth user whose registered e-mail matches the supplied e-mail.
 *  3. OWNER bootstrap is decided by the server (no OWNER exists yet) — never by the body.
 *  4. `status` is never read from the body: only the owner bootstrap approves a profile.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req as unknown as Request);
    const rl = rateLimit(`complete-signup:${ip}`, { windowMs: 60_000, max: 15 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Too many attempts. Please retry shortly." } },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );
    }

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { userId, email, displayName, pendingOnly } = body as {
      userId?: unknown;
      email?: unknown;
      displayName?: unknown;
      pendingOnly?: unknown;
    };

    if (typeof userId !== "string" || !UUID_RE.test(userId)) {
      return NextResponse.json({ error: "Valid userId required" }, { status: 400 });
    }
    if (typeof email !== "string" || !email.includes("@") || email.length > 254) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const name = String(displayName || cleanEmail.split("@")[0])
      .trim()
      .slice(0, 120);

    // ---- 1. Prove the caller owns `userId` ----------------------------------
    const sessionUser = await getCurrentUser();
    let identityVerified = false;

    if (sessionUser) {
      // Signed in → may only ever act as itself.
      identityVerified = sessionUser.id === userId;
    } else {
      // Not signed in (pre e-mail verification) → the account must really exist
      // in Supabase Auth and must be registered to this exact address.
      identityVerified = await verifyAuthUserMatchesEmail(userId, cleanEmail);
    }

    if (!identityVerified) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Could not verify signup identity." } },
        { status: 403 }
      );
    }

    // ---- 2. OWNER bootstrap is a server-side decision ------------------------
    // Never trust `isOwner` from the body. Bootstrap only when no owner exists.
    const existingOwnedProject = await withDbRetry(() =>
      db.project.findFirst({ where: { ownerId: userId }, select: { id: true } })
    ).catch(() => null);

    const ownerCount = await withDbRetry(() =>
      db.projectMember.count({ where: { role: "OWNER" as any } })
    ).catch(() => 1);

    const isFirstUser = ownerCount === 0 && !existingOwnedProject;

    // A pending-only signup never approves anything.
    const isPendingOnly = pendingOnly === true;
    const grantOwner = !isPendingOnly && isFirstUser;

    // ---- 3. Upsert the profile — status is server-controlled -----------------
    const profile = await withDbRetry(() =>
      db.profile.upsert({
        where: { id: userId },
        create: {
          id: userId,
          email: cleanEmail,
          displayName: name,
          // Only the verified first-user bootstrap may start approved; everybody
          // else goes through the manual approval queue.
          status: grantOwner ? "approved" : "pending",
        },
        // Never update `email` here: an attacker-supplied address must not be
        // able to rebind an existing profile. `status` is intentionally omitted
        // so re-running signup can't approve/suspend an account.
        update: { displayName: name },
      })
    ).catch(() => null);

    if (!profile) {
      return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
    }

    if (grantOwner && !existingOwnedProject) {
      const projectSlug =
        name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "my-project";
      const projectName = `${name}'s Project`;

      const project = await withDbRetry(() =>
        db.project.create({
          data: {
            name: projectName,
            slug: `${projectSlug}-${Date.now().toString(36)}`,
            ownerId: profile.id,
            siteName: projectName,
          },
        })
      );

      await withDbRetry(() =>
        db.projectMember.upsert({
          where: {
            projectId_userId: { projectId: project.id, userId: profile.id },
          },
          update: { role: "OWNER" },
          create: { projectId: project.id, userId: profile.id, role: "OWNER" },
        })
      );

      await withDbRetry(() =>
        db.auditLog.create({
          data: {
            actorId: profile.id,
            projectId: project.id,
            action: "bootstrap.owner_created",
            metadata: { email: cleanEmail, method: "signup" },
          },
        })
      ).catch(() => {});
    }

    return NextResponse.json({ success: true, status: profile.status });
  } catch (error) {
    console.error("complete-signup error:", error);
    return NextResponse.json({ error: "Failed to complete signup" }, { status: 500 });
  }
}
