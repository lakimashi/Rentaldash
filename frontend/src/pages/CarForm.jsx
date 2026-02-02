import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';

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
    api('/api/branches').then(setBranches).catch(() => {});
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
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">{isEdit ? 'Edit car' : 'Add car'}</h1>
      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plate number *</label>
            <input required value={form.plate_number} onChange={(e) => setForm({ ...form, plate_number: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" disabled={isEdit} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">VIN</label>
            <input value={form.vin} onChange={(e) => setForm({ ...form, vin: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Make *</label>
            <input required value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
            <input required value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
            <input type="number" required value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" min="1990" max="2030" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
            <input value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" placeholder="Sedan, SUV, Economy..." />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
            <select value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2">
              <option value="">—</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2">
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Base daily rate *</label>
          <input type="number" required value={form.base_daily_rate} onChange={(e) => setForm({ ...form, base_daily_rate: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" min="0" step="0.01" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" rows={2} />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50">{loading ? 'Saving...' : 'Save'}</button>
          <Link to="/cars" className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
