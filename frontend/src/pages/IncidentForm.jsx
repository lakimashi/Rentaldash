import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

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
    api('/api/cars').then(setCars).catch(() => {});
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
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">{isEdit ? 'Edit incident' : 'New incident'}</h1>
      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Car *</label>
          <select required value={form.car_id} onChange={(e) => setForm({ ...form, car_id: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" disabled={isEdit}>
            <option value="">Select car</option>
            {cars.map((c) => <option key={c.id} value={c.id}>{c.plate_number} – {c.make} {c.model}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Incident date *</label>
          <input type="datetime-local" required value={form.incident_date} onChange={(e) => setForm({ ...form, incident_date: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" disabled={isEdit} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Severity *</label>
          <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" disabled={isEdit}>
            <option value="minor">Minor</option>
            <option value="major">Major</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" rows={3} disabled={isEdit} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estimated cost</label>
          <input type="number" value={form.estimated_cost} onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" min="0" step="0.01" disabled={isEdit} />
        </div>
        {isEdit && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2">
              <option value="open">Open</option>
              <option value="under_review">Under Review</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        )}
        {!isEdit && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photos</label>
            <input type="file" accept="image/*" multiple onChange={(e) => setImages([...e.target.files])} className="w-full border border-gray-300 rounded px-3 py-2" />
          </div>
        )}
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50">{loading ? 'Saving...' : isEdit ? 'Update status' : 'Create incident'}</button>
          <Link to="/incidents" className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
