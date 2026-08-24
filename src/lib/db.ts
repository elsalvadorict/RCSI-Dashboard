import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Ensure DATABASE_URL is set (fallback for environments where .env is not loaded)
// On Render, the DATABASE_URL is set via the dashboard/environment variables.
// On local dev, it comes from the .env file.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./db/custom.db'
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
  })

// In production, don't cache the client on globalThis
// (Render's worker may recycle, and we want fresh connections)
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
