import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function CarForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState({
    plate_number: '', make: '', model: '', year: new Date().getFullYear(), class: 'Sedan',
    branch_id: '', status: 'active', base_daily_rate: 50, vin: '', notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/branches').then(setBranches).catch(() => { });
    if (isEdit) {
      api(`/api/cars/${id}`).then((car) => {
        setForm({
          plate_number: car.plate_number,
          make: car.make,
          model: car.model,
          year: car.year,
          class: car.class,
          branch_id: car.branch_id ?? '',
          status: car.status,
          base_daily_rate: car.base_daily_rate,
          vin: car.vin ?? '',
          notes: car.notes ?? '',
        });
      }).catch((e) => setError(e.message));
    }
  }, [id, isEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const payload = {
      ...form,
      year: Number(form.year),
      base_daily_rate: Number(form.base_daily_rate),
      branch_id: form.branch_id ? Number(form.branch_id) : null,
      vin: form.vin || null,
      notes: form.notes || null,
    };
    (isEdit ? api(`/api/cars/${id}`, { method: 'PUT', body: payload }) : api('/api/cars', { method: 'POST', body: payload }))
      .then(() => navigate('/cars'))
      .catch((e) => { setError(e.message); setLoading(false); });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/cars">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{isEdit ? 'Edit Vehicle' : 'Add New Vehicle'}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plate Number *</Label>
                <Input required value={form.plate_number} onChange={(e) => setForm({ ...form, plate_number: e.target.value })} disabled={isEdit} />
              </div>
              <div className="space-y-2">
                <Label>VIN</Label>
                <Input value={form.vin} onChange={(e) => setForm({ ...form, vin: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Make *</Label>
                <Input required value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Model *</Label>
                <Input required value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Year *</Label>
                <Input type="number" required value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} min="1990" max="2030" />
              </div>
              <div className="space-y-2">
                <Label>Class *</Label>
                <Input value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} placeholder="Sedan, SUV..." />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Branch</Label>
                <Select value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })}>
                  <option value="">— Select Branch —</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Base Daily Rate ($) *</Label>
              <Input type="number" required value={form.base_daily_rate} onChange={(e) => setForm({ ...form, base_daily_rate: e.target.value })} min="0" step="0.01" />
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
            <Link to="/cars">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
