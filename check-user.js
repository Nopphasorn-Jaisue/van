const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'sakranan0863@gmail.com' } });
  console.log(user);
}

main().finally(() => prisma.$disconnect());
