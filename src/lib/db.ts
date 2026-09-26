import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma 7 removed the `datasources` constructor option and requires a driver adapter.
// Prisma-only URL params (connection_limit/pool_timeout) are not understood by the raw
// pg driver — strip them and translate them into explicit pool options.
function getPoolOptions():
  | { connectionString: string; max: number; connectionTimeoutMillis: number }
  | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    // Malformed URL: pass through unchanged so the error surfaces at query time (as before).
    return { connectionString: raw, max: 2, connectionTimeoutMillis: 30000 };
  }
  const connectionLimit = Number(url.searchParams.get("connection_limit"));
  const poolTimeoutSeconds = Number(url.searchParams.get("pool_timeout"));
  url.searchParams.delete("connection_limit");
  url.searchParams.delete("pool_timeout");
  return {
    connectionString: url.toString(),
    // connection_limit=2 (when not explicitly set) safely fits Supabase's session pool limit (15);
    // pool_timeout=30 → 30s acquiring a connection before failing.
    max: connectionLimit > 0 ? connectionLimit : 2,
    connectionTimeoutMillis: poolTimeoutSeconds > 0 ? poolTimeoutSeconds * 1000 : 30000,
  };
}

const poolOptions = getPoolOptions();

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
    // Prisma 7 requires a driver adapter. Without DATABASE_URL the adapter falls back to
    // pg defaults and connection errors surface at query time (same as before).
    adapter: new PrismaPg(
      poolOptions ?? { max: 2, connectionTimeoutMillis: 30000 },
    ),
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
