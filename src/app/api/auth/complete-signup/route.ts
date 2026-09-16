import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { userId, email, displayName, isOwner, pendingOnly } = await req.json();

    if (!userId || !email) {
      return NextResponse.json({ error: "userId and email required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const name = displayName || cleanEmail.split("@")[0];

    // If pendingOnly, just store minimal info — actual profile created by callback after email verification
    if (pendingOnly) {
      // Upsert with unapproved status; callback will confirm after verification
      await withDbRetry(() =>
        db.profile.upsert({
          where: { id: userId },
          create: {
            id: userId,
            email: cleanEmail,
            displayName: name,
            status: "pending",
          },
          update: {
            email: cleanEmail,
            displayName: name,
          },
        })
      );
      return NextResponse.json({ success: true, status: "pending" });
    }

    // Upsert profile
    const profile = await withDbRetry(() =>
      db.profile.upsert({
        where: { id: userId },
        create: {
          id: userId,
          email: cleanEmail,
          displayName: name,
          status: isOwner ? "approved" : "pending",
        },
        update: {
          email: cleanEmail,
          displayName: name,
        },
      })
    );

    // If first user (owner), create a default project
    if (isOwner) {
      const projectSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "my-project";
      const projectName = `${name}'s Project`;

      // Check if project already exists for this owner
      const existingProject = await withDbRetry(() =>
        db.project.findFirst({ where: { ownerId: profile.id } })
      ).catch(() => null);

      if (!existingProject) {
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

        // Add owner as project member
        await withDbRetry(() =>
          db.projectMember.upsert({
            where: {
              projectId_userId: { projectId: project.id, userId: profile.id },
            },
            update: { role: "OWNER" },
            create: {
              projectId: project.id,
              userId: profile.id,
              role: "OWNER",
            },
          })
        );

        // Create audit log
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
    }

    return NextResponse.json({ success: true, status: profile.status });
  } catch (error: any) {
    console.error("complete-signup error:", error);
    return NextResponse.json({ error: error.message || "Failed to complete signup" }, { status: 500 });
  }
}
