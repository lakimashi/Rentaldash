import pool from '../db.js';

/**
 * Two ranges overlap if: A.start < B.end AND B.start < A.end
 */
function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Get available cars for [startDate, endDate).
 * A car is available if:
 * - No booking with status reserved/confirmed/active overlaps the range
 * - No maintenance block overlaps the range
 * - No open major incident blocks it (default)
 */
export async function getAvailableCars({ start, end, class: carClass, branch_id }) {
  const startDate = start;
  const endDate = end;

  let carsQuery = `
    SELECT c.id, c.plate_number, c.make, c.model, c.year, c.class, c.branch_id, c.base_daily_rate,
           b.name AS branch_name
    FROM cars c
    LEFT JOIN branches b ON c.branch_id = b.id
    WHERE c.status = 'active'
  `;
  const params = [];
  let idx = 1;
  if (carClass) {
    carsQuery += ` AND c.class = $${idx}`;
    params.push(carClass);
    idx++;
  }
  if (branch_id) {
    carsQuery += ` AND c.branch_id = $${idx}`;
    params.push(branch_id);
    idx++;
  }
  carsQuery += ' ORDER BY c.class, c.plate_number';

  const carsResult = await pool.query(carsQuery, params);
  const cars = carsResult.rows;

  const available = [];
  for (const car of cars) {
    const hasBooking = await pool.query(
      `SELECT 1 FROM bookings WHERE car_id = $1 AND status IN ('reserved', 'confirmed', 'active')
       AND start_date < $3 AND end_date > $2 LIMIT 1`,
      [car.id, startDate, endDate]
    );
    if (hasBooking.rows.length > 0) continue;


    const hasMaintenance = await pool.query(
      `SELECT 1 FROM maintenance_blocks WHERE car_id = $1 AND start_date < $3 AND end_date > $2 LIMIT 1`,
      [car.id, startDate, endDate]
    );
    if (hasMaintenance.rows.length > 0) continue;

    const hasMajorIncident = await pool.query(
      `SELECT 1 FROM incidents WHERE car_id = $1 AND severity = 'major' AND status = 'open' LIMIT 1`,
      [car.id]
    );
    if (hasMajorIncident.rows.length > 0) continue;

    const images = await pool.query('SELECT url_path FROM car_images WHERE car_id = $1', [car.id]);
    available.push({
      ...car,
      base_daily_rate: parseFloat(car.base_daily_rate),
      images: images.rows.map((r) => r.url_path),
    });
  }
  return available;
}

/**
 * Check if a car has any conflict (booking or maintenance) for [start, end).
 * Optionally exclude a booking id (for updates).
 */
export async function hasConflict(carId, startDate, endDate, excludeBookingId = null) {
  let bookingQuery = `
    SELECT 1 FROM bookings WHERE car_id = $1 AND status IN ('reserved', 'confirmed', 'active')
    AND start_date < $3 AND end_date > $2
  `;
  const params = [carId, startDate, endDate];
  if (excludeBookingId) {
    params.push(excludeBookingId);
    bookingQuery += ` AND id != $${params.length}`;
  }
  bookingQuery += ' LIMIT 1';
  const booking = await pool.query(bookingQuery, params);
  if (booking.rows.length > 0) return true;

  const maintenance = await pool.query(
    `SELECT 1 FROM maintenance_blocks WHERE car_id = $1 AND start_date < $3 AND end_date > $2 LIMIT 1`,
    [carId, startDate, endDate]
  );
  return maintenance.rows.length > 0;
}
