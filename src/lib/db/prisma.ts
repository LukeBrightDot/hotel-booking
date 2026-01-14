// Prisma client - optional for demo mode
// Run `npx prisma generate` to enable database features

let PrismaClientClass: any;
try {
  // Dynamic import to handle missing client gracefully
  PrismaClientClass = require('@prisma/client').PrismaClient;
} catch {
  // Prisma client not generated - running in demo mode
  PrismaClientClass = null;
}

const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined;
};

export const prisma = PrismaClientClass
  ? (globalForPrisma.prisma ?? new PrismaClientClass({
      datasourceUrl: process.env.DATABASE_URL,
    }))
  : null;

if (process.env.NODE_ENV !== 'production' && prisma) {
  globalForPrisma.prisma = prisma;
}
