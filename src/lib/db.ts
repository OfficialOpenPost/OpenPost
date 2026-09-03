import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDatasourceUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;
  // If connection_limit is not explicitly set in the URL, enforce connection_limit=2 to safely fit within Supabase's session pool limit (15)
  if (!raw.includes("connection_limit=")) {
    const separator = raw.includes("?") ? "&" : "?";
    return `${raw}${separator}connection_limit=2&pool_timeout=30`;
  }
  return raw;
}

const datasourceUrl = getDatasourceUrl();

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
    datasources: datasourceUrl ? { db: { url: datasourceUrl } } : undefined,
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
        const delay = 150 * attempt + Math.floor(Math.random() * 150);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}
