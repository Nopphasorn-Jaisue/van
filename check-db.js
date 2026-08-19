// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: "postgresql://postgres.ljcfcyeohhzvgbztrsss:Joule404325@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres",
  });
  
  await client.connect();
  
  try {
    const { rows: columns1 } = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'bookings'`);
    console.log('bookings columns:', columns1.map(r => r.column_name).join(', '));

    const { rows: columns2 } = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'users'`);
    console.log('users columns:', columns2.map(r => r.column_name).join(', '));
    
    const { rows: data } = await client.query(`SELECT * FROM bookings WHERE id = 'UP-2569-4161'`);
    console.log('booking data:', data);

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
