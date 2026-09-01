import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// Helper to execute Prisma operations with auto-reconnect on connection drops
export async function withDbRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
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
        err?.code === "P1001" ||
        err?.code === "P1017" ||
        err?.code === "P2024";

      if (isConnectionError && attempt < maxRetries) {
        console.warn(`[DB] Connection dropped on attempt ${attempt}. Reconnecting to database...`);
        try {
          await db.$disconnect().catch(() => {});
          await db.$connect().catch(() => {});
        } catch {}
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}
