import type { FacultyIconKey } from '@/Frontend/components/FacultyGlyph';

export type FacultyDirectory = {
  id: string;
  name: string;
  shortName: string;
  url: string;
  iconKey: FacultyIconKey;
  totalVans: number;
  availableVans: number;
  homeBase: string;
  focus: string;
  palette: {
    surface: string;
    border: string;
    accent: string;
    accentRgb?: string;
    accentRgba?: string;
    chip: string;
    muted: string;
  };
};

export const facultiesList: FacultyDirectory[] = [
  {
    id: 'agri',
    name: 'คณะเกษตรศาสตร์และทรัพยากรธรรมชาติ',
    shortName: 'เกษตรฯ',
    url: 'https://doc.agri.up.ac.th/van/',
    iconKey: 'leaf',
    totalVans: 1,
    availableVans: 1,
    homeBase: 'อาคารปฏิบัติการเกษตร',
    focus: 'ภาคสนามและงานชุมชน',
    palette: { surface: 'bg-emerald-50', border: 'border-emerald-200', accent: 'text-emerald-700', chip: 'bg-emerald-600', muted: 'text-emerald-600', accentRgb: '#059669' },
  },
  {
    id: 'ict',
    name: 'คณะเทคโนโลยีสารสนเทศและการสื่อสาร',
    shortName: 'ICT',
    url: 'https://service.ict.up.ac.th/van/',
    iconKey: 'cpu',
    totalVans: 1,
    availableVans: 1,
    homeBase: 'อาคารบริการดิจิทัล',
    focus: 'เครือข่ายและระบบสารสนเทศ',
    palette: { surface: 'bg-sky-50', border: 'border-sky-200', accent: 'text-sky-700', chip: 'bg-sky-600', muted: 'text-sky-600', accentRgb: '#0284c7' },
  },
  {
    id: 'seen',
    name: 'คณะพลังงานและสิ่งแวดล้อม',
    shortName: 'พลังงานฯ',
    url: 'https://www.seen.up.ac.th/th/Book-van',
    iconKey: 'flame',
    totalVans: 1,
    availableVans: 1,
    homeBase: 'อาคารพลังงานสะอาด',
    focus: 'ภาคสนามและเซนเซอร์',
    palette: { surface: 'bg-orange-50', border: 'border-orange-200', accent: 'text-orange-700', chip: 'bg-orange-500', muted: 'text-orange-600', accentRgb: '#f97316' },
  },
  {
    id: 'sci',
    name: 'คณะวิทยาศาสตร์',
    shortName: 'วิทยาศาสตร์',
    url: 'http://www.science.up.ac.th/carcalendar',
    iconKey: 'flask',
    totalVans: 1,
    availableVans: 1,
    homeBase: 'ศูนย์เครื่องมือวิทย์',
    focus: 'วิจัยและห้องปฏิบัติการ',
    palette: { surface: 'bg-blue-50', border: 'border-blue-200', accent: 'text-blue-700', chip: 'bg-blue-500', muted: 'text-blue-600', accentRgb: '#3b82f6' },
  },
  {
    id: 'pharm',
    name: 'คณะเภสัชศาสตร์',
    shortName: 'เภสัชฯ',
    url: 'https://www.pharmacy.up.ac.th/th/main/startpage/vanjob',
    iconKey: 'pill',
    totalVans: 1,
    availableVans: 1,
    homeBase: 'คลังเวชภัณฑ์กลาง',
    focus: 'ส่งยาและเวชภัณฑ์',
    palette: { surface: 'bg-lime-50', border: 'border-lime-200', accent: 'text-lime-700', chip: 'bg-lime-500', muted: 'text-lime-700', accentRgb: '#84cc16' },
  },
];
