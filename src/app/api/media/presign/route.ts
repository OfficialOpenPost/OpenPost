import { NextRequest, NextResponse } from "next/server";
import { requireApprovedUser, requirePermission, AuthError } from "@/lib/auth";
import { getSignedUploadUrl, getPublicUrl } from "@/lib/storage";
import crypto from "crypto";

const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
  "application/pdf",
  "video/mp4",
];

export async function POST(req: NextRequest) {
  try {
    const user = await requireApprovedUser();

    const body = await req.json().catch(() => ({}));
    const { filename, contentType, size, projectId } = body as {
      filename?: string;
      contentType?: string;
      size?: number;
      projectId?: string;
    };

    if (projectId) {
      await requirePermission(projectId, "media.upload");
    }

    if (!contentType || !allowedTypes.includes(contentType.toLowerCase())) {
      return NextResponse.json(
        { error: { code: "INVALID_TYPE", message: `Unsupported media MIME type: ${contentType}` } },
        { status: 400 }
      );
    }

    if (!size || size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: { code: "TOO_LARGE", message: "File exceeds 25MB upload limit." } },
        { status: 400 }
      );
    }

    if (!filename || filename.includes("..") || filename.includes("/")) {
      return NextResponse.json(
        { error: { code: "INVALID_NAME", message: "Invalid or malicious filename." } },
        { status: 400 }
      );
    }

    const ext = (filename.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
    const key = `openpost-media/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const presignedUrl = await getSignedUploadUrl(key, contentType, 300);
    const publicUrl = getPublicUrl(key);

    return NextResponse.json({
      data: {
        uploadUrl: presignedUrl,
        key,
        publicUrl,
        contentType,
      },
    });
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "PRESIGN_FAILED";
    return NextResponse.json(
      { error: { code, message: error.message || "Failed to generate presigned upload URL." } },
      { status }
    );
  }
}
