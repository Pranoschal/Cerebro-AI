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

export const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || 'user_demo_123';
export const DEFAULT_USER_EMAIL = process.env.DEFAULT_USER_EMAIL || 'demo@notes.ai';
export const DEFAULT_USER_NAME = process.env.DEFAULT_USER_NAME || 'Alex Mercer';

export async function ensureDemoUser() {
  try {
    const user = await prisma.user.upsert({
      where: { id: DEFAULT_USER_ID },
      update: {},
      create: {
        id: DEFAULT_USER_ID,
        email: DEFAULT_USER_EMAIL,
        name: DEFAULT_USER_NAME,
      },
    });
    return user;
  } catch (error) {
    console.error('Error ensuring demo user:', error);
    return null;
  }
}
