import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaConnected: boolean | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
    datasourceUrl: process.env.DATABASE_URL,
  });

// Ensure BigInts (e.g. Media sizeBytes) are natively JSON-serializable in all Next.js API routes
if (typeof BigInt !== "undefined" && !(BigInt.prototype as any).toJSON) {
  (BigInt.prototype as any).toJSON = function () {
    return Number(this);
  };
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

let isConnecting = false;

export async function ensureDbConnected(): Promise<void> {
  if (globalForPrisma.prismaConnected) return;
  if (isConnecting) {
    // Wait until in-flight connection finishes
    while (isConnecting) {
      await new Promise((r) => setTimeout(r, 50));
    }
    return;
  }

  isConnecting = true;
  try {
    await db.$connect();
    globalForPrisma.prismaConnected = true;
  } catch (err) {
    console.warn("[DB] Initial connection attempt:", err);
  } finally {
    isConnecting = false;
  }
}

// Eagerly initiate non-blocking connection in background
ensureDbConnected().catch(() => {});

// Helper to execute Prisma operations with auto-reconnect on connection drops or pooler cold starts
export async function withDbRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const msg = String(err?.message || err || "");
      const isConnectionError =
        msg.includes("Server has closed the connection") ||
        msg.includes("Connection pool") ||
        msg.includes("closed the connection") ||
        msg.includes("Can't reach database server") ||
        msg.includes("Engine is not yet connected") ||
        msg.includes("not yet connected") ||
        err?.code === "P1001" ||
        err?.code === "P1017" ||
        err?.code === "P2024" ||
        err?.name === "PrismaClientUnknownRequestError" ||
        err?.name === "PrismaClientInitializationError";

      if (isConnectionError && attempt < maxRetries) {
        console.warn(`[DB] Transient connection retry on attempt ${attempt} (${msg.slice(0, 70)}...)`);
        await new Promise((resolve) => setTimeout(resolve, 150 * attempt));
        try {
          await db.$connect().catch(() => {});
          globalForPrisma.prismaConnected = true;
        } catch {}
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}
