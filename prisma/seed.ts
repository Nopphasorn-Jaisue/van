import 'dotenv/config';
import { Role, DriverType, BookingStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';

async function main() {
  console.log('Seeding database...');

  // 1. Create Faculties
  const ictFaculty = await prisma.faculty.create({
    data: { nameTh: 'คณะเทคโนโลยีสารสนเทศและการสื่อสาร', nameEn: 'School of ICT' }
  });
  const scienceFaculty = await prisma.faculty.create({
    data: { nameTh: 'คณะวิทยาศาสตร์', nameEn: 'School of Science' }
  });

  // 2. Create Users
  const adminIct = await prisma.user.create({
    data: {
      facultyId: ictFaculty.id,
      name: 'Admin ICT',
      email: 'admin.ict@up.ac.th',
      role: Role.FACULTY_ADMIN
    }
  });

  const driverUser = await prisma.user.create({
    data: {
      facultyId: ictFaculty.id,
      name: 'สมชาย คนขับรถ (ICT)',
      email: 'somchai.driver@up.ac.th',
      role: Role.DRIVER
    }
  });

  // 3. Create Driver Profile
  const driver = await prisma.driver.create({
    data: {
      userId: driverUser.id,
      facultyId: ictFaculty.id,
      phone: '0891234567',
      age: 45,
      type: DriverType.PRIMARY
    }
  });

  // 4. Create Van
  await prisma.van.create({
    data: {
      facultyId: ictFaculty.id,
      plate: 'นข 1234 พะเยา',
      capacity: 12
    }
  });

  // 5. Create Bookings (Assigned to Driver)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(8, 0, 0, 0);
  const tomorrowReturn = new Date(tomorrow);
  tomorrowReturn.setHours(17, 0, 0, 0);

  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 2);
  pastDate.setHours(7, 0, 0, 0);
  const pastDateReturn = new Date(pastDate);
  pastDateReturn.setHours(18, 0, 0, 0);

  await prisma.booking.create({
    data: {
      id: 'UPVAN-2569-0123',
      requesterId: adminIct.id,
      targetFacultyId: ictFaculty.id,
      destination: 'ศูนย์การเรียนรู้ จ.เชียงราย',
      objective: 'โครงการ Work from home และสถานที่ปฏิบัติงานตามได้รับมอบหมาย',
      departureDate: tomorrow,
      returnDate: tomorrowReturn,
      passengersCount: 10,
      budgetSource: 'เงินรายได้คณะ',
      status: BookingStatus.APPROVED,
      assignedDriverId: driver.id
    }
  });

  await prisma.booking.create({
    data: {
      id: 'UPVAN-2569-0110',
      requesterId: adminIct.id,
      targetFacultyId: scienceFaculty.id, // request to science? Or from ICT to ICT?
      destination: 'อ.เมือง จ.น่าน',
      objective: 'ลงพื้นที่เก็บตัวอย่างวิจัย',
      departureDate: pastDate,
      returnDate: pastDateReturn,
      passengersCount: 8,
      budgetSource: 'ทุนวิจัย',
      status: BookingStatus.APPROVED,
      assignedDriverId: driver.id
    }
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
