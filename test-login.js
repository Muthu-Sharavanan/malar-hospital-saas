import prisma from './src/lib/prisma.js';

async function testLogin() {
  try {
    const email = 'reception@malar.com';
    console.log('Searching for user:', email);
    const user = await prisma.user.findUnique({
      where: { email }
    });
    console.log('User found:', user ? user.name : 'Not Found');
  } catch (err) {
    console.error('Login Query Failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
