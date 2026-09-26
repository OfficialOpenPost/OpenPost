import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // Plain process.env (not the env() helper) so `prisma generate` never throws when
  // env vars are absent (e.g. postinstall in CI). Prefer DIRECT_URL for CLI migrations.
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || "",
  },
});
