import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.van.findMany({
  include: { faculty: { include: { drivers: { include: { user: true } } } } }
}).then(v => {
  console.log(JSON.stringify(v, null, 2));
}).catch(e => {
  console.error(e);
}).finally(() => {
  prisma.$disconnect();
});
