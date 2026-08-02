// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

const files = [
  'lib/utils/ai-matchmaker.ts',
  'lib/mock-data.ts',
  'components/AppShell.tsx',
  'app/reports/page.tsx',
  'app/faculty-admin/calendar/page.tsx',
  'app/bookings/new/page.tsx',
  'Backend/services/booking-system-store.ts'
];

files.forEach(f => {
  const fullPath = path.join(__dirname, f);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(/คณะเกษตรศาสตร์และทรัพยากรธรรมชาติ/g, 'คณะเทคโนโลยีสารสนเทศและการสื่อสาร');
    content = content.replace(/คณะเกษตรศาสตร์ฯ/g, 'คณะเทคโนโลยีสารสนเทศและการสื่อสาร');
    content = content.replace(/คณะเกษตรศาสตร์/g, 'คณะเทคโนโลยีสารสนเทศและการสื่อสาร');
    content = content.replace(/AGRI/g, 'ICT');
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated ${f}`);
  } else {
    console.log(`File not found: ${f}`);
  }
});
