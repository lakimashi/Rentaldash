import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function BookingForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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
    Promise.all([
      api('/api/cars').then(setCars),
      isEdit ? api(`/api/bookings/${id}`).then((b) => {
        setForm({
          car_id: b.car_id,
          customer_name: b.customer_name,
          customer_phone: b.customer_phone || '',
          customer_id_passport: b.customer_id_passport || '',
          start_date: b.start_date,
          end_date: b.end_date,
          status: b.status,
          total_price: b.total_price,
          deposit: b.deposit,
          notes: b.notes || '',
        });
      }) : Promise.resolve()
    ]).catch((e) => setError(e.message));
  }, [id, isEdit]);

  useEffect(() => {
    if (!form.car_id) return;
    const car = cars.find((c) => c.id === Number(form.car_id));
    if (car) setDailyRate(car.base_daily_rate);
  }, [form.car_id, cars]);

  useEffect(() => {
    // Only auto-calc price on creation or if user manually changed dates to avoid overwriting custom prices on edit
    if (isEdit) return;
    if (!form.start_date || !form.end_date) return;
    const start = new Date(form.start_date);
    const end = new Date(form.end_date);
    const days = Math.max(0, Math.ceil((end - start) / (24 * 60 * 60 * 1000)));
    setForm((f) => ({ ...f, total_price: days * dailyRate }));
  }, [form.start_date, form.end_date, dailyRate, isEdit]);

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

    const promise = isEdit
      ? api(`/api/bookings/${id}`, { method: 'PUT', body: payload })
      : api('/api/bookings', { method: 'POST', body: payload });

    promise
      .then(() => navigate('/bookings'))
      .catch((e) => { setError(e.message); setLoading(false); });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/bookings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{isEdit ? 'Edit Booking' : 'New Booking'}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>}

            <div className="space-y-2">
              <Label>Select Vehicle *</Label>
              <Select required value={form.car_id} onChange={(e) => setForm({ ...form, car_id: e.target.value })}>
                <option value="">-- Select Car --</option>
                {cars.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.plate_number} – {c.make} {c.model} ({c.class}) – ${c.base_daily_rate}/day
                    {c.status !== 'active' && c.id !== Number(form.car_id) ? ' (Unavailable)' : ''}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Input type="date" required value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Customer Name *</Label>
              <Input required value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>ID / Passport</Label>
                <Input value={form.customer_id_passport} onChange={(e) => setForm({ ...form, customer_id_passport: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total Price ($)</Label>
                <Input type="number" required value={form.total_price} onChange={(e) => setForm({ ...form, total_price: e.target.value })} min="0" step="0.01" />
              </div>
              <div className="space-y-2">
                <Label>Deposit ($)</Label>
                <Input type="number" value={form.deposit} onChange={(e) => setForm({ ...form, deposit: e.target.value })} min="0" step="0.01" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="reserved">Reserved</option>
                <option value="confirmed">Confirmed</option>
                {isEdit && <option value="active">Active (On Trip)</option>}
                {isEdit && <option value="completed">Completed</option>}
                {isEdit && <option value="cancelled">Cancelled</option>}
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <textarea
                className="flex h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Link to="/bookings">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (isEdit ? 'Update Booking' : 'Create Booking')}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
