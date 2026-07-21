// --- Mock Database (จำลองข้อมูลจาก Database ที่เราออกแบบไว้) ---
const MOCK_VANS = [
  { id: "v1", plate: "นข 1234", facultyId: "ENG", facultyName: "คณะวิศวกรรมศาสตร์", capacity: 12, status: "READY" },
  { id: "v2", plate: "นข 6543", facultyId: "SEEN", facultyName: "คณะพลังงานฯ", capacity: 12, status: "READY" },
  { id: "v3", plate: "นข 9876", facultyId: "SCI", facultyName: "คณะวิทยาศาสตร์", capacity: 12, status: "READY" },
  { id: "v4", plate: "นข 5678", facultyId: "ICT", facultyName: "คณะ ICT", capacity: 12, status: "READY" },
  { id: "v5", plate: "นข 1111", facultyId: "AGRI", facultyName: "คณะเกษตรศาสตร์ฯ", capacity: 10, status: "READY" },
];

const MOCK_ALLIANCES = [
  { sourceId: "ENG", targetId: "SCI", score: 10 }, // วิศวะ สนิทกับ วิทยาศาสตร์
  { sourceId: "ENG", targetId: "ICT", score: 8 },  // วิศวะ สนิทกับ ICT
  { sourceId: "SEEN", targetId: "SCI", score: 7 }, // พลังงาน สนิทกับ วิทยาศาสตร์
];

// --- 1. ฟังก์ชันจับคู่อัตโนมัติ (Smart Matchmaker) ---
export function generateVanBundle(passengers: number, userFacultyId: string = "ENG") {
  if (!passengers || passengers <= 0) return null;

  // 1. คำนวณจำนวนรถที่ต้องการ (สมมติมาตรฐานคันละ 12 ที่นั่ง)
  const vansNeeded = Math.ceil(passengers / 12);
  
  // 2. ให้คะแนนรถแต่ละคัน (Scoring System)
  const scoredVans = MOCK_VANS
    .filter(van => van.status === "READY")
    .map(van => {
      let score = 0;
      let matchType = "other";

      if (van.facultyId === userFacultyId) {
        score = 100; // รถคณะตัวเอง สำคัญอันดับ 1
        matchType = "primary";
      } else {
        const alliance = MOCK_ALLIANCES.find(a => a.sourceId === userFacultyId && a.targetId === van.facultyId);
        if (alliance) {
          score = 50 + alliance.score; // รถพันธมิตร
          matchType = "alliance";
        } else {
          score = 10; // รถคณะอื่นๆ
        }
      }
      return { ...van, score, matchType };
    });

  // 3. เรียงลำดับตามคะแนน (มากไปน้อย) และเลือกตามจำนวนที่ต้องการ
  const sortedVans = scoredVans.sort((a, b) => b.score - a.score);
  const selectedVans = sortedVans.slice(0, vansNeeded);

  // ตรวจสอบว่ามีรถพอหรือไม่
  const isFulfilled = selectedVans.length === vansNeeded;

  return {
    vansNeeded,
    selectedVans,
    isFulfilled,
  };
}

// --- 2. ฟังก์ชันวิเคราะห์ความเสี่ยง (Risk Analysis) ---
export function calculateRiskScore(selectedVans: any[], userFacultyId: string = "ENG") {
  if (selectedVans.length === 0) return { risk: 0, level: 'low', message: '' };

  let totalRisk = 0;
  
  selectedVans.forEach(van => {
    if (van.facultyId === userFacultyId) {
      totalRisk += 0; // คณะตัวเอง ความเสี่ยง 0%
    } else if (van.matchType === "alliance") {
      totalRisk += 15; // คณะพันธมิตร ความเสี่ยง 15%
    } else {
      totalRisk += 40; // คณะอื่นๆ ความเสี่ยง 40%
    }
  });

  // หาค่าเฉลี่ยความเสี่ยงของทั้งแพ็กเกจ
  const avgRisk = Math.min(Math.round(totalRisk / selectedVans.length), 100);

  let level = 'low';
  let message = 'โอกาสถูกปฏิเสธต่ำ คณะปลายทางมีประวัติการอนุมัติให้คณะของคุณสูง';
  
  if (avgRisk > 60) {
    level = 'high';
    message = 'ความเสี่ยงสูง! เนื่องจากมีการขอใช้รถจากคณะที่ไม่ได้เป็นพันธมิตรโดยตรง';
  } else if (avgRisk > 25) {
    level = 'medium';
    message = 'ความเสี่ยงปานกลาง อาจต้องรอผู้บริหารคณะปลายทางพิจารณาเพิ่มเติม';
  }

  return { risk: avgRisk, level, message };
}