import { z } from "zod";

// PUBLIC (client-safe) — must be NEXT_PUBLIC_*
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_NAME: z.string().optional(),
  NEXT_PUBLIC_ALLOW_SIGNUP: z.enum(["true", "false"]).optional(),
});

// SERVER-ONLY (never NEXT_PUBLIC_*)
const serverSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required").refine((v) => !v.includes("your-") && !v.includes("placeholder"), "DATABASE_URL is placeholder"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, "SUPABASE_SERVICE_ROLE_KEY is required"),
  R2_ACCOUNT_ID: z.string().min(1, "R2_ACCOUNT_ID is required"),
  R2_ACCESS_KEY_ID: z.string().min(1, "R2_ACCESS_KEY_ID is required"),
  R2_SECRET_ACCESS_KEY: z.string().min(1, "R2_SECRET_ACCESS_KEY is required"),
  R2_BUCKET_NAME: z.string().min(1, "R2_BUCKET_NAME is required"),
  R2_PUBLIC_URL: z.string().url("R2_PUBLIC_URL must be a valid URL"),
  NEXTAUTH_SECRET: z.string().min(16, "NEXTAUTH_SECRET is required").optional(),
  NEXTAUTH_URL: z.string().url().optional(),
});

const envSchema = publicSchema.merge(serverSchema);

type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  // Allow build without DB when SKIP_ENV_VALIDATION is set (for CI with mocks)
  if (process.env.SKIP_ENV_VALIDATION === "true") {
    return process.env as unknown as Env;
  }

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
    // Fail fast in all envs — do not silently continue
    throw new Error("Invalid environment variables — check .env.example");
  }

  // Extra check for placeholder values
  for (const [k, v] of Object.entries(parsed.data)) {
    if (typeof v === "string" && (v.includes("your-") || v.includes("placeholder") || v.includes("your-r2"))) {
      throw new Error(`Environment variable ${k} is still placeholder — set real value`);
    }
  }

  return parsed.data;
}

export const env = validateEnv();

// Helpers (safe to use in client — only checks public vars)
export const isSupabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const isR2Configured = Boolean(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY);
export const isProduction = process.env.NODE_ENV === "production";
