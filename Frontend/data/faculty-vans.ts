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

// Real Vans and Drivers from Supabase Database
export const facultyVansList: UnifiedVanInfo[] = [
  {
    id: "1",
    facultyId: "1",
    facultyName: "คณะเทคโนโลยีสารสนเทศและการสื่อสาร",
    shortFacultyName: "ICT",
    vanName: "ICT",
    plate: "1นช3009 กรุงเทพมหานคร",
    driverName: "นาย",
    driverPhone: "0812345678",
    driverImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    vanImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80"
  },
  {
    id: "6",
    facultyId: "6",
    facultyName: "คณะเภสัชฯ",
    shortFacultyName: "เภสัชฯ",
    vanName: "เภสัชฯ",
    plate: "นก 25555 พะเยา",
    driverName: "555",
    driverPhone: "5555",
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
    driverName: "นายพิทักษ์  ทะปัญญา",
    driverPhone: "0812345678",
    driverImage: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80",
    vanImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80"
  }
];
