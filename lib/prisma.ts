// lib/prisma.ts
import { PrismaClient } from "@prisma/client"
import { PrismaMySQL } from "@prisma/adapter-mysql"   // @ts-ignore (no type declarations for PrismaMySQL)

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const adapter = new PrismaMySQL(process.env.DATABASE_URL!)

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
