import { prisma } from './lib/prisma';
import { listBookings } from './Backend/services/booking-system-store';

async function main() {
  const driver = await prisma.user.findFirst({
    where: { name: '555' },
    include: { driverProfile: true }
  });
  console.log("Driver 555:", driver);

  const bookings = await listBookings();
  const driverBookings = bookings.filter(b => b.assignedDriverName === '555');
  console.log("Bookings for 555:");
  driverBookings.forEach(b => {
    console.log(`- ID: ${b.id}, assignedVanId: ${b.assignedVanId}, startAt: ${b.startAt}`);
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
