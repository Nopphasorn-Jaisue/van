import { prisma } from './lib/prisma';

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'sakranan0863@gmail.com' } });
  console.log(JSON.stringify(user, null, 2));
}

main().finally(() => prisma.$disconnect());
