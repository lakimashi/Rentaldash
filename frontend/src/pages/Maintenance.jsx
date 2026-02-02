import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Maintenance() {
  const [blocks, setBlocks] = useState([]);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ car_id: '', start_date: '', end_date: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'staff';

  useEffect(() => {
    Promise.all([api('/api/maintenance'), api('/api/cars')])
      .then(([m, c]) => { setBlocks(m); setCars(c); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    api('/api/maintenance', {
      method: 'POST',
      body: { ...form, car_id: Number(form.car_id) },
    })
      .then(() => {
        setForm({ car_id: '', start_date: '', end_date: '', reason: '' });
        setShowForm(false);
        return api('/api/maintenance');
      })
      .then(setBlocks)
      .catch((e) => alert(e.message))
      .finally(() => setSubmitting(false));
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Maintenance</h1>
        {canEdit && (
          <button type="button" onClick={() => setShowForm(!showForm)} className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700">
            {showForm ? 'Cancel' : 'Add maintenance window'}
          </button>
        )}
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4 mb-6 max-w-xl space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Car *</label>
            <select required value={form.car_id} onChange={(e) => setForm({ ...form, car_id: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2">
              <option value="">Select car</option>
              {cars.filter((c) => c.status === 'active').map((c) => <option key={c.id} value={c.id}>{c.plate_number} – {c.make} {c.model}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start date *</label>
              <input type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" min={today} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End date *</label>
              <input type="date" required value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" min={form.start_date || today} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" placeholder="Service, tires..." />
          </div>
          <button type="submit" disabled={submitting} className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50">{submitting ? 'Adding...' : 'Add'}</button>
        </form>
      )}
      {blocks.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">No maintenance blocks. {canEdit && 'Add one above.'}</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Car</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Start – End</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {blocks.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-2 text-sm">{m.plate_number} · {m.make} {m.model}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{m.start_date} – {m.end_date}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{m.reason || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
