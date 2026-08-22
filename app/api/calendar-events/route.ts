export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export { 
  handleSystemCalendarEvents as GET,
  POST,
  PATCH,
  DELETE
} from "@/Backend/routes/system-calendar";