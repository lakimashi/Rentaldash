import 'dotenv/config';
import bcrypt from 'bcrypt';
import pool from '../src/db.js';

const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@demo.com';
const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'DemoAdmin123!';

async function seed() {
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await pool.query(
    `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'admin')
     ON CONFLICT (email) DO UPDATE SET password_hash = excluded.password_hash, role = 'admin'`,
    [adminEmail, passwordHash]
  );
  await pool.query(
    `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'staff')
     ON CONFLICT (email) DO NOTHING`,
    ['staff@demo.com', passwordHash]
  );

  const branchRes = await pool.query(
    `INSERT INTO branches (name, address, phone) VALUES ('Main Branch', '123 Main St', '+1234567890')`
  );
  let branchId = 1;
  const branchRow = await pool.query('SELECT id FROM branches ORDER BY id DESC LIMIT 1');
  if (branchRow.rows[0]) branchId = branchRow.rows[0].id;

  const carClasses = ['Economy', 'Sedan', 'SUV', 'Luxury'];
  for (let i = 1; i <= 8; i++) {
    await pool.query(
      `INSERT INTO cars (plate_number, make, model, year, class, branch_id, status, base_daily_rate)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', $7)
       ON CONFLICT (plate_number) DO NOTHING`,
      [`DEMO-${100 + i}`, `Make${i}`, `Model${i}`, 2020 + (i % 4), carClasses[i % 4], branchId, 50 + i * 10]
    );
  }

  const carIdsRes = await pool.query('SELECT id FROM cars ORDER BY id LIMIT 8');
  const carIds = carIdsRes.rows.map((r) => r.id);
  if (carIds.length >= 3) {
    const today = new Date().toISOString().slice(0, 10);
    const pastStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const pastEnd = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const futureStart = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const futureEnd = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    await pool.query(
      `INSERT INTO bookings (car_id, customer_name, customer_phone, start_date, end_date, status, total_price, deposit)
       VALUES ($1, 'Past Customer', '+111', $2, $3, 'completed', 200, 50)`,
      [carIds[0], pastStart, pastEnd]
    );
    await pool.query(
      `INSERT INTO bookings (car_id, customer_name, customer_phone, start_date, end_date, status, total_price, deposit)
       VALUES ($1, 'Current Customer', '+222', $2, $3, 'active', 300, 75)`,
      [carIds[1], today, futureStart]
    );
    await pool.query(
      `INSERT INTO bookings (car_id, customer_name, customer_phone, start_date, end_date, status, total_price, deposit)
       VALUES ($1, 'Future Customer', '+333', $2, $3, 'confirmed', 250, 50)`,
      [carIds[2], futureStart, futureEnd]
    );
  }

  if (carIds.length >= 1) {
    const mStart = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const mEnd = new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await pool.query(
      `INSERT INTO maintenance_blocks (car_id, start_date, end_date, reason) VALUES ($1, $2, $3, 'Scheduled service')`,
      [carIds[0], mStart, mEnd]
    );
  }

  if (carIds.length >= 2) {
    await pool.query(
      `INSERT INTO incidents (car_id, incident_date, severity, description, estimated_cost, status)
       VALUES ($1, datetime('now'), 'major', 'Demo incident', 500, 'open')`,
      [carIds[1]]
    );
  }

  console.log('Seed completed. Admin:', adminEmail, 'Password:', adminPassword);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
