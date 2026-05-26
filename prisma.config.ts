import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "Prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.PRISMA_DATABASE_URL,
  },
});
