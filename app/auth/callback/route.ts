import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const roleIntent = searchParams.get("role");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const email = data.user.email;

      if (email) {
        const avatarUrl = data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null;

        // ค้นหาข้อมูลผู้ใช้ในฐานข้อมูล Prisma
        let user = await prisma.user.findUnique({
          where: { email },
          include: { driverProfile: true },
        });

        if (user) {
          // อัปเดต avatar หากเปลี่ยนไป
          if (avatarUrl && user.avatar !== avatarUrl) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { avatar: avatarUrl },
              include: { driverProfile: true },
            });
          }
        } else {
          // หากยังไม่มีข้อมูลผู้ใช้ในฐานข้อมูล (เข้าใช้งานครั้งแรก) ให้สร้างผู้ใช้ใหม่ตามประเภทสิทธิ์ที่เลือก
          const defaultFaculty = await prisma.faculty.findFirst();
          if (defaultFaculty) {
            const assignedRole = roleIntent === "DRIVER" ? "DRIVER" : "FACULTY_ADMIN";
            
            user = await prisma.user.create({
              data: {
                email,
                name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || email.split("@")[0],
                avatar: avatarUrl,
                facultyId: defaultFaculty.id,
                role: assignedRole,
              },
              include: { driverProfile: true },
            });

            // ถ้าเป็น DRIVER ให้สร้าง driverProfile ด้วย
            if (assignedRole === "DRIVER") {
              await prisma.driver.create({
                data: {
                  userId: user!.id,
                  facultyId: defaultFaculty.id,
                  phone: "-",
                  age: 30,
                  isActive: true,
                },
              });
            }
          }
        }

        // นำทางไปยัง Dashboard ตาม Role ของผู้ใช้
        if (next) {
          redirect(next);
        } else if (user?.role === "FACULTY_ADMIN" || user?.role === "SUPER_ADMIN") {
          redirect("/faculty-admin/dashboard");
        } else if (user?.role === "DRIVER") {
          redirect("/driver/dashboard");
        } else if (user?.role === "EXECUTIVE") {
          redirect("/executive/dashboard");
        } else {
          redirect("/faculty-admin/dashboard");
        }
      }
    }
  }

  // หากเกิดข้อผิดพลาดให้กลับไปหน้า Login พร้อมส่ง error
  redirect(`/login?error=auth_failed`);
}
