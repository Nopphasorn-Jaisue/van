import { prisma } from './lib/prisma';
prisma.faculty.findMany().then(v => {
  console.log(JSON.stringify(v.map(f => ({id: f.id, nameTh: f.nameTh})), null, 2));
}).catch(e => {
  console.error(e);
}).finally(() => {
  prisma.$disconnect();
});
