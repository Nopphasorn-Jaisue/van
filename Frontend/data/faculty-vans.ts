export type UnifiedVanInfo = {
  id: string;
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

// University Fleet Vans & Drivers matching all UP Faculties
export const facultyVansList: UnifiedVanInfo[] = [
  {
    id: "1",
    facultyId: "1",
    facultyName: "คณะเทคโนโลยีสารสนเทศและการสื่อสาร",
    shortFacultyName: "ICT",
    vanName: "รถตู้ ICT",
    plate: "1นช3009 กรุงเทพมหานคร",
    driverName: "นายสมชาย ใจดี",
    driverPhone: "0812345678",
    driverImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    vanImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80"
  },
  {
    id: "6",
    facultyId: "6",
    facultyName: "คณะเภสัชศาสตร์",
    shortFacultyName: "เภสัชฯ",
    vanName: "รถตู้คณะเภสัชศาสตร์",
    plate: "นก 2555 พะเยา",
    driverName: "นายธีรพงษ์ ยาสอาด",
    driverPhone: "085-555-2555",
    driverImage: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
    vanImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80"
  },
  {
    id: "2",
    facultyId: "2",
    facultyName: "คณะวิทยาศาสตร์",
    shortFacultyName: "วิทยาศาสตร์",
    vanName: "รถตู้คณะวิทยาศาสตร์",
    plate: "นข 3948 พะเยา",
    driverName: "นายพิทักษ์ ทะปัญญา",
    driverPhone: "089-123-4567",
    driverImage: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80",
    vanImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80"
  },
  {
    id: "3",
    facultyId: "3",
    facultyName: "คณะพลังงานและสิ่งแวดล้อม",
    shortFacultyName: "พลังงานฯ",
    vanName: "รถตู้คณะพลังงานและสิ่งแวดล้อม",
    plate: "นข 8821 พะเยา",
    driverName: "นายวิวัฒน์ กรีนเวย์",
    driverPhone: "087-987-6543",
    driverImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80",
    vanImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80"
  },
  {
    id: "4",
    facultyId: "4",
    facultyName: "คณะเกษตรศาสตร์และทรัพยากรธรรมชาติ",
    shortFacultyName: "เกษตรฯ",
    vanName: "รถตู้คณะเกษตรศาสตร์",
    plate: "นค 4192 พะเยา",
    driverName: "นายสมเกียรติ พืชพรรณ",
    driverPhone: "086-456-7890",
    driverImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80",
    vanImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80"
  },
  {
    id: "5",
    facultyId: "5",
    facultyName: "คณะวิศวกรรมศาสตร์",
    shortFacultyName: "วิศวะฯ",
    vanName: "รถตู้คณะวิศวกรรมศาสตร์",
    plate: "นก 7712 พะเยา",
    driverName: "นายเอกชัย ช่างยนต์",
    driverPhone: "083-112-2334",
    driverImage: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&q=80",
    vanImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80"
  },
  {
    id: "7",
    facultyId: "7",
    facultyName: "คณะพยาบาลศาสตร์",
    shortFacultyName: "พยาบาลฯ",
    vanName: "รถตู้คณะพยาบาลศาสตร์",
    plate: "นข 1109 พะเยา",
    driverName: "นายพงษ์ศักดิ์ แคร์ดี",
    driverPhone: "084-556-6778",
    driverImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80",
    vanImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80"
  },
  {
    id: "8",
    facultyId: "8",
    facultyName: "คณะแพทยศาสตร์",
    shortFacultyName: "แพทย์ฯ",
    vanName: "รถตู้คณะแพทยศาสตร์",
    plate: "นก 9901 พะเยา",
    driverName: "นายสุรชัย เมดิคอล",
    driverPhone: "088-776-6554",
    driverImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80",
    vanImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80"
  },
  {
    id: "9",
    facultyId: "9",
    facultyName: "คณะนิติศาสตร์",
    shortFacultyName: "นิติฯ",
    vanName: "รถตู้คณะนิติศาสตร์",
    plate: "นค 5590 พะเยา",
    driverName: "นายนิติพงษ์ ยุติธรรม",
    driverPhone: "082-334-4556",
    driverImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    vanImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80"
  },
  {
    id: "10",
    facultyId: "10",
    facultyName: "คณะรัฐศาสตร์และสังคมศาสตร์",
    shortFacultyName: "รัฐศาสตร์ฯ",
    vanName: "รถตู้คณะรัฐศาสตร์และสังคมศาสตร์",
    plate: "นค 3341 พะเยา",
    driverName: "นายรัฐธรรม สังคมดี",
    driverPhone: "081-998-8776",
    driverImage: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80",
    vanImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80"
  },
  {
    id: "11",
    facultyId: "11",
    facultyName: "คณะบริหารธุรกิจและนิเทศศาสตร์",
    shortFacultyName: "BCA",
    vanName: "รถตู้คณะบริหารธุรกิจและนิเทศศาสตร์",
    plate: "นข 6620 พะเยา",
    driverName: "นายศุภชัย การค้า",
    driverPhone: "089-665-5443",
    driverImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80",
    vanImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80"
  }
];
