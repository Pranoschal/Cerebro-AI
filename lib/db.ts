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
    // 1. Check if user already exists by ID
    const userById = await prisma.user.findUnique({ where: { id: userId } });
    if (userById) {
      if (name && userById.name !== name) {
        await prisma.user.update({
          where: { id: userId },
          data: { name },
        }).catch(() => {});
      }
      return userById;
    }

    // 2. If email is provided, check if another record (e.g. guest) owns this email
    if (email) {
      const userByEmail = await prisma.user.findUnique({ where: { email } });
      if (userByEmail && userByEmail.id !== userId) {
        // Free up the email on the old/guest record so new OAuth user can claim it
        await prisma.user.update({
          where: { id: userByEmail.id },
          data: { email: `${userByEmail.id}@guest.cerebro.ai` },
        }).catch(() => {});
      }
    }

    // 3. Create or upsert the user record
    const safeEmail = email || `${userId}@user.cerebro.ai`;
    return await prisma.user.upsert({
      where: { id: userId },
      update: {
        ...(email ? { email } : {}),
        ...(name ? { name } : {}),
      },
      create: {
        id: userId,
        email: safeEmail,
        name: name || 'User',
      },
    });
  } catch (error) {
    console.error('Error ensuring user in database:', error);
    // Fallback: create user with a guaranteed unique email so foreign keys don't fail
    try {
      return await prisma.user.create({
        data: {
          id: userId,
          email: `${userId}_${Date.now()}@user.cerebro.ai`,
          name: name || 'User',
        },
      });
    } catch (fallbackErr) {
      console.error('Fallback user creation failed:', fallbackErr);
      return null;
    }
  }
}
