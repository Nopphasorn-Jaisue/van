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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Chakra+Petch:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&family=IBM+Plex+Sans+Thai+Looped:wght@100;200;300;400;500;600;700&family=Kanit:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Roboto+Condensed:ital,wght@0,100..900;1,100..900&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.10),_transparent_34%),linear-gradient(180deg,_#faf7ff_0%,_#ffffff_34%,_#f6f0ff_100%)] font-sans">{children}</body>
    </html>
  );
}