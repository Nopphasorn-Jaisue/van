import "./globals.css";

export const metadata = {
  title: "ระบบจัดการและจองรถตู้ มหาวิทยาลัยพะเยา (UP Van Booking)",
  description: "ระบบบริหารจัดการและติดตามการจองรถตู้ มหาวิทยาลัยพะเยา",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.10),_transparent_34%),linear-gradient(180deg,_#faf7ff_0%,_#ffffff_34%,_#f6f0ff_100%)] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
