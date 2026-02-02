import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';

export default function BookingForm() {
  const [searchParams] = useSearchParams();
  const preselectedCarId = searchParams.get('car_id');
  const preselectedStart = searchParams.get('start');
  const preselectedEnd = searchParams.get('end');

  const [cars, setCars] = useState([]);
  const [form, setForm] = useState({
    car_id: preselectedCarId ? Number(preselectedCarId) : '',
    customer_name: '',
    customer_phone: '',
    customer_id_passport: '',
    start_date: preselectedStart || new Date().toISOString().slice(0, 10),
    end_date: preselectedEnd || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    status: 'reserved',
    total_price: 0,
    deposit: 0,
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dailyRate, setDailyRate] = useState(0);

  useEffect(() => {
    api('/api/cars').then(setCars).catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.car_id) return;
    const car = cars.find((c) => c.id === Number(form.car_id));
    if (car) setDailyRate(car.base_daily_rate);
  }, [form.car_id, cars]);

  useEffect(() => {
    if (!form.start_date || !form.end_date) return;
    const start = new Date(form.start_date);
    const end = new Date(form.end_date);
    const days = Math.max(0, Math.ceil((end - start) / (24 * 60 * 60 * 1000)));
    setForm((f) => ({ ...f, total_price: days * dailyRate }));
  }, [form.start_date, form.end_date, dailyRate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const payload = {
      ...form,
      car_id: Number(form.car_id),
      total_price: Number(form.total_price),
      deposit: Number(form.deposit),
      customer_id_passport: form.customer_id_passport || null,
      notes: form.notes || null,
    };
    api('/api/bookings', { method: 'POST', body: payload })
      .then(() => (window.location.href = '/bookings'))
      .catch((e) => { setError(e.message); setLoading(false); });
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">New booking</h1>
      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Car *</label>
          <select required value={form.car_id} onChange={(e) => setForm({ ...form, car_id: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2">
            <option value="">Select car</option>
            {cars.filter((c) => c.status === 'active').map((c) => (
              <option key={c.id} value={c.id}>{c.plate_number} – {c.make} {c.model} ({c.class}) – ${c.base_daily_rate}/day</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start date *</label>
            <input type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End date *</label>
            <input type="date" required value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer name *</label>
          <input required value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID / Passport</label>
            <input value={form.customer_id_passport} onChange={(e) => setForm({ ...form, customer_id_passport: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total price</label>
            <input type="number" value={form.total_price} onChange={(e) => setForm({ ...form, total_price: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" min="0" step="0.01" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deposit</label>
            <input type="number" value={form.deposit} onChange={(e) => setForm({ ...form, deposit: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" min="0" step="0.01" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2">
            <option value="draft">Draft</option>
            <option value="reserved">Reserved</option>
            <option value="confirmed">Confirmed</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" rows={2} />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50">{loading ? 'Creating...' : 'Create booking'}</button>
          <Link to="/bookings" className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
