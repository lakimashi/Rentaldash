import cron from 'node-cron';
import pool from '../db.js';
import { createNotification, getOverdueBookings, getExpiringCars } from '../routes/notifications.js';

export function startScheduler() {
  console.log('Starting scheduler for overdue and expiry checks...');

  cron.schedule('0 8 * * *', async () => {
    console.log(`[${new Date().toISOString()}] Running daily checks...`);
    
    try {
      await checkOverdueBookings();
      await checkExpiringDocuments();
    } catch (error) {
      console.error('Error in scheduled job:', error);
    }
  });
  
  console.log('Scheduler started successfully. Runs daily at 8 AM.');
}

  async function checkOverdueBookings() {
   try {
     const overdue = await getOverdueBookings();
     
     console.log(`Found ${overdue.length} overdue bookings`);
     
     for (const booking of overdue) {
       await createNotification({
         user_id: 1,
         type: 'overdue',
         title: `Overdue Booking: ${booking.customer_name}`,
         message: `Booking #${booking.id} for ${booking.boat_number} is overdue. It was due on ${booking.end_date}.`,
         entity_type: 'booking',
         entity_id: booking.id,
       });
     }
   } catch (error) {
     console.error('Error in checkOverdueBookings:', error);
   }
 }

async function checkExpiringDocuments() {
  const expiringCars = await getExpiringCars(30);
  
  console.log(`Found ${expiringCars.length} cars with expiring documents`);
  
  for (const car of expiringCars) {
    if (car.registration_expiry && car.reg_days_left >= 0 && car.reg_days_left <= 30) {
      await createNotification({
        user_id: 1,
        type: 'expiring',
        title: `Registration Expiring: ${car.plate_number}`,
        message: `Vehicle registration for ${car.make} ${car.model} (${car.plate_number}) expires on ${car.registration_expiry} (${car.reg_days_left} days left).`,
        entity_type: 'car',
        entity_id: car.id,
      });
    }
    
    if (car.insurance_expiry && car.ins_days_left >= 0 && car.ins_days_left <= 30) {
      await createNotification({
        user_id: 1,
        type: 'expiring',
        title: `Insurance Expiring: ${car.plate_number}`,
        message: `Vehicle insurance for ${car.make} ${car.model} (${car.plate_number}) expires on ${car.insurance_expiry} (${car.ins_days_left} days left).`,
        entity_type: 'car',
        entity_id: car.id,
      });
    }
  }
}
