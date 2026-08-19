import { listBookings } from './Backend/services/booking-system-store';
listBookings().then(v => console.log(JSON.stringify(v, null, 2))).catch(console.error);
