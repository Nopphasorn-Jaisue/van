export type UnifiedVanInfo = {
  id: string; // e.g. "v-agri", "v-ict"
  facultyId: string;
  facultyName: string;
  shortFacultyName: string;
  vanName: string;
  plate: string;
  driverName: string;
  driverPhone: string;
  driverImage: string;
  vanImage: string;
};

// 1 Faculty = 1 Van + 1 Driver
export const facultyVansList: UnifiedVanInfo[] = [
  {
    id: "v-agri",
    facultyId: "agri",
    facultyName: "คณะเกษตรศาสตร์และทรัพยากรธรรมชาติ",
    shortFacultyName: "เกษตรฯ",
    vanName: "รถตู้เกษตรฯ 01",
    plate: "ทะเบียน นข 1234 พะเยา",
    driverName: "นายสมชาย ใจดี",
    driverPhone: "081-234-5678",
    driverImage: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&q=80",
    vanImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=100&q=80"
  },
  {
    id: "1",
    facultyId: "1",
    facultyName: "คณะเทคโนโลยีสารสนเทศและการสื่อสาร",
    shortFacultyName: "ICT",
    vanName: "ICT",
    plate: "นก 4515 พะเยา",
    driverName: "นาย",
    driverPhone: "0812345678",
    driverImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    vanImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=100&q=80"
  },
  {
    id: "v-seen",
    facultyId: "seen",
    facultyName: "คณะพลังงานและสิ่งแวดล้อม",
    shortFacultyName: "พลังงานฯ",
    vanName: "รถตู้พลังงานฯ 01",
    plate: "ทะเบียน นข 7788 พะเยา",
    driverName: "นายวิชัย แสนดี",
    driverPhone: "089-456-7890",
    driverImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    vanImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=100&q=80"
  },
  {
    id: "v-sci",
    facultyId: "sci",
    facultyName: "คณะวิทยาศาสตร์",
    shortFacultyName: "วิทยาศาสตร์",
    vanName: "รถตู้คณะวิทย์ 01",
    plate: "ทะเบียน นข 3344 พะเยา",
    driverName: "นายประเสริฐ จันทรดี",
    driverPhone: "090-567-8901",
    driverImage: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80",
    vanImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=100&q=80"
  },
  {
    id: "v-pharm",
    facultyId: "pharm",
    facultyName: "คณะเภสัชศาสตร์",
    shortFacultyName: "เภสัชฯ",
    vanName: "รถตู้เภสัชฯ 01",
    plate: "ทะเบียน นข 5566 พะเยา",
    driverName: "นายชูชาติ สุขใจ",
    driverPhone: "093-678-9012",
    driverImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80",
    vanImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=100&q=80"
  }
];
