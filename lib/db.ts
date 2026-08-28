import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Ensures that the authenticated user exists in the Prisma PostgreSQL database
 * so relational integrity is maintained when creating notes, folders, and tags.
 */
export async function ensureUser(userId: string, email?: string, name?: string) {
  if (!userId) return null;
  try {
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {
        ...(email ? { email } : {}),
        ...(name ? { name } : {}),
      },
      create: {
        id: userId,
        email: email || `${userId}@user.cerebro.ai`,
        name: name || 'User',
      },
    });
    return user;
  } catch (error) {
    console.error('Error ensuring user in database:', error);
    return null;
  }
}
