import "./globals.css";

export const metadata = {
  title: "Van Booking System",
  description: "ระบบจัดการรถตู้มหาวิทยาลัยพะเยา",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 🌟 เติม suppressHydrationWarning เข้าไปที่แท็ก html
    <html lang="th" suppressHydrationWarning>
      <body className="bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.10),_transparent_34%),linear-gradient(180deg,_#faf7ff_0%,_#ffffff_34%,_#f6f0ff_100%)]">{children}</body>
    </html>
  );
}