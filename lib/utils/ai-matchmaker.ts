import { prisma } from '@/lib/prisma';

export async function generateVanBundle(passengers: number, userFacultyId: number) {
  if (!passengers || passengers <= 0) return null;

  const vansNeeded = Math.ceil(passengers / 12);
  
  // ดึงข้อมูลรถตู้ที่ Active ทั้งหมด
  const allVans = await prisma.van.findMany({
    where: { isActive: true },
    include: { faculty: true }
  });

  const scoredVans = allVans.map(van => {
    let score = 0;
    let matchType = "other";

    if (van.facultyId === userFacultyId) {
      score = 100;
      matchType = "primary";
    } else if (van.isShared) {
      // ในอนาคตสามารถเพิ่มตาราง Alliances เพื่อคำนวณพันธมิตรได้ 
      // ปัจจุบันสมมติว่าถ้าแชร์ได้ ให้เป็นพันธมิตรระดับกลาง
      score = 50; 
      matchType = "alliance";
    } else {
      score = 10;
    }
    return { ...van, score, matchType };
  });

  const sortedVans = scoredVans.sort((a, b) => b.score - a.score);
  const selectedVans = sortedVans.slice(0, vansNeeded);

  const isFulfilled = selectedVans.length === vansNeeded;

  return {
    vansNeeded,
    selectedVans,
    isFulfilled,
  };
}

export function calculateRiskScore(selectedVans: { id: string | number; facultyId?: number; [key: string]: unknown }[], userFacultyId: number) {
  if (selectedVans.length === 0) return { risk: 0, level: 'low', message: '' };

  let totalRisk = 0;
  
  selectedVans.forEach(van => {
    if (van.facultyId === userFacultyId) {
      totalRisk += 0;
    } else if (van.matchType === "alliance") {
      totalRisk += 15;
    } else {
      totalRisk += 40;
    }
  });

  const avgRisk = Math.min(Math.round(totalRisk / selectedVans.length), 100);

  let level = 'low';
  let message = 'โอกาสถูกปฏิเสธต่ำ คณะปลายทางมีประวัติการอนุมัติให้คณะของคุณสูง';
  
  if (avgRisk > 60) {
    level = 'high';
    message = 'ความเสี่ยงสูง! เนื่องจากมีการขอใช้รถจากคณะที่ไม่ได้เปิดแชร์ส่วนกลาง';
  } else if (avgRisk > 25) {
    level = 'medium';
    message = 'ความเสี่ยงปานกลาง อาจต้องรอผู้บริหารคณะปลายทางพิจารณาเพิ่มเติม';
  }

  return { risk: avgRisk, level, message };
}