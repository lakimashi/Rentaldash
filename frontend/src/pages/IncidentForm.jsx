import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function IncidentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'staff';

  const [cars, setCars] = useState([]);
  const [form, setForm] = useState({
    car_id: '', booking_id: '', incident_date: new Date().toISOString().slice(0, 16),
    severity: 'minor', description: '', estimated_cost: '', status: 'open',
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/cars').then(setCars).catch(() => { });
    if (isEdit) {
      api(`/api/incidents/${id}`).then((inc) => {
        setForm({
          car_id: inc.car_id,
          booking_id: inc.booking_id ?? '',
          incident_date: inc.incident_date ? new Date(inc.incident_date).toISOString().slice(0, 16) : form.incident_date,
          severity: inc.severity,
          description: inc.description ?? '',
          estimated_cost: inc.estimated_cost ?? '',
          status: inc.status,
        });
      }).catch((e) => setError(e.message));
    }
  }, [id, isEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canEdit && isEdit) return;
    setError('');
    setLoading(true);
    if (isEdit) {
      api(`/api/incidents/${id}/status`, { method: 'PUT', body: { status: form.status } })
        .then(() => navigate('/incidents'))
        .catch((e) => { setError(e.message); setLoading(false); });
      return;
    }
    const fd = new FormData();
    fd.append('car_id', form.car_id);
    if (form.booking_id) fd.append('booking_id', form.booking_id);
    fd.append('incident_date', form.incident_date);
    fd.append('severity', form.severity);
    fd.append('description', form.description);
    if (form.estimated_cost !== '') fd.append('estimated_cost', form.estimated_cost);
    images.forEach((file) => fd.append('images', file));
    fetch('/api/incidents', {
      method: 'POST',
      credentials: 'include',
      headers: { Authorization: `Bearer ${localStorage.getItem('rental_token')}` },
      body: fd,
    })
      .then((r) => (r.ok ? r.json() : r.json().then((d) => Promise.reject(new Error(d.error)))))
      .then(() => navigate('/incidents'))
      .catch((e) => { setError(e.message); setLoading(false); });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/incidents">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{isEdit ? 'Incident Details' : 'Report Incident'}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Incident Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>}

            <div className="space-y-2">
              <Label>Vehicle *</Label>
              <Select required value={form.car_id} onChange={(e) => setForm({ ...form, car_id: e.target.value })} disabled={isEdit}>
                <option value="">-- Select Car --</option>
                {cars.map((c) => <option key={c.id} value={c.id}>{c.plate_number} – {c.make} {c.model}</option>)}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date & Time *</Label>
                <Input type="datetime-local" required value={form.incident_date} onChange={(e) => setForm({ ...form, incident_date: e.target.value })} disabled={isEdit} />
              </div>
              <div className="space-y-2">
                <Label>Severity *</Label>
                <Select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} disabled={isEdit}>
                  <option value="minor">Minor</option>
                  <option value="major">Major</option>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                className="flex h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                disabled={isEdit}
              />
            </div>

            <div className="space-y-2">
              <Label>Estimated Cost ($)</Label>
              <Input type="number" value={form.estimated_cost} onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })} min="0" step="0.01" disabled={isEdit} />
            </div>

            {!isEdit && (
              <div className="space-y-2">
                <Label>Upload Images</Label>
                <input type="file" multiple accept="image/*" onChange={(e) => setImages(Array.from(e.target.files))} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90" />
              </div>
            )}

            {isEdit && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="open">Open</option>
                  <option value="under_review">Under Review</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </Select>
              </div>
            )}

          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Link to="/incidents">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={loading} variant={isEdit ? 'default' : 'destructive'}>
              {loading ? 'Processing...' : (isEdit ? 'Update Status' : 'Submit Report')}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
