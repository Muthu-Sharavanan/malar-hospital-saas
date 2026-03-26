import prisma from './src/lib/prisma';

async function test() {
  try {
    const users = await prisma.user.findMany();
    console.log('User check successful:', users.length);
  } catch (err) {
    console.error('Initialization failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
