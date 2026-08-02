const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log("Found users:", users.length);
  
  if (users.length === 0) {
    console.log("No users found in the database. Please create a user first.");
    return;
  }

  // Let's create a driver profile for the most recently created user, or all users without one for testing
  for (const user of users) {
    const existingDriver = await prisma.driver.findUnique({
      where: { userId: user.id }
    });

    if (!existingDriver) {
      console.log(`Adding driver profile to user: ${user.email}`);
      await prisma.driver.create({
        data: {
          userId: user.id,
          facultyId: user.facultyId,
          phone: "0812345678",
          age: 35,
          type: "PRIMARY",
          isActive: true,
          contractStart: new Date(),
        }
      });
      console.log(`Driver profile created for ${user.email}`);
      
      // Update their role to DRIVER if not already
      if (user.role !== 'DRIVER') {
          await prisma.user.update({
              where: { id: user.id },
              data: { role: 'DRIVER' }
          });
          console.log(`Updated role to DRIVER for ${user.email}`);
      }
    } else {
      console.log(`User ${user.email} already has a driver profile.`);
    }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
