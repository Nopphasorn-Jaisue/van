import { redirect } from 'next/navigation';

export default function FacultyAdminRedirect() {
  redirect('/faculty-admin/dashboard');
}
