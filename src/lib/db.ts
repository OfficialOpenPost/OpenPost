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
    datasourceUrl: process.env.DATABASE_URL,
  });

// Ensure BigInts (e.g. Media sizeBytes) are natively JSON-serializable in all Next.js API routes
if (typeof BigInt !== "undefined" && !(BigInt.prototype as any).toJSON) {
  (BigInt.prototype as any).toJSON = function () {
    return Number(this);
  };
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// Helper to execute Prisma operations with auto-retry on transient connection drops or pool exhaustion
export async function withDbRetry<T>(fn: () => Promise<T>, maxRetries = 4): Promise<T> {
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
        msg.includes("EMAXCONNSESSION") ||
        msg.includes("max clients reached") ||
        err?.code === "P1001" ||
        err?.code === "P1017" ||
        err?.code === "P2024" ||
        err?.name === "PrismaClientUnknownRequestError" ||
        err?.name === "PrismaClientInitializationError";

      if (isConnectionError && attempt < maxRetries) {
        const delay = 100 * attempt + Math.floor(Math.random() * 100);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}
