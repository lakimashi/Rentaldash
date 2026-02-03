import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [carId, setCarId] = useState('');
  const [category, setCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ car_id: '', category: 'maintenance', amount: '', description: '', expense_date: '' });
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'staff';
  const [cars, setCars] = useState([]);

  useEffect(() => {
    Promise.all([fetchExpenses(), api('/api/cars').then(setCars).catch(() => {})]);
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [carId, category]);

  const fetchExpenses = async () => {
    let url = '/api/expenses';
    const params = new URLSearchParams();
    if (carId) params.set('car_id', carId);
    if (category) params.set('category', category);
    if (params.toString()) url += `?${params}`;
    api(url)
      .then(setExpenses)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    api('/api/expenses', {
      method: 'POST',
      body: { ...form, car_id: Number(form.car_id), amount: Number(form.amount) },
    })
      .then(() => {
        setForm({ car_id: '', category: 'maintenance', amount: '', description: '', expense_date: '' });
        setShowForm(false);
        fetchExpenses();
      })
      .catch((e) => alert(e.message))
      .finally(() => setSubmitting(false));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    api(`/api/expenses/${id}`, { method: 'DELETE' })
      .then(() => setExpenses(expenses.filter((e) => e.id !== id)))
      .catch((e) => alert(e.message));
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  const categories = ['maintenance', 'insurance', 'registration', 'cleaning', 'misc', 'fuel'];
  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Expenses</h1>
        {canEdit && (
          <button type="button" onClick={() => setShowForm(!showForm)} className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700">
            {showForm ? 'Cancel' : 'Add Expense'}
          </button>
        )}
      </div>

      {showForm && canEdit && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4 mb-6 max-w-xl space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Car *</label>
            <select required value={form.car_id} onChange={(e) => setForm({ ...form, car_id: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2">
              <option value="">Select car</option>
              {cars.map((c) => (
                <option key={c.id} value={c.id}>{c.plate_number} – {c.make} {c.model}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2">
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
              <input type="number" required step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" placeholder="0.00" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" rows="2" placeholder="What was this expense for?" />
          </div>
          <button type="submit" disabled={submitting} className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50">
            {submitting ? 'Adding...' : 'Add Expense'}
          </button>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-600">Total Expenses: <span className="text-2xl font-bold text-gray-900">${totalExpenses.toFixed(2)}</span></p>
      </div>

      <div className="flex gap-4 mb-4">
        <select value={carId} onChange={(e) => setCarId(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-sm">
          <option value="">All Cars</option>
          {cars.map((c) => <option key={c.id} value={c.id}>{c.plate_number}</option>)}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-sm">
          <option value="">All Categories</option>
          {categories.map((cat) => <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>)}
        </select>
      </div>

      {expenses.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
          No expenses yet. {canEdit && 'Add one above.'}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Car</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Category</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Description</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Date</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Amount</th>
                {canEdit && <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-2 text-sm">{e.plate_number} · {e.make} {e.model}</td>
                  <td className="px-4 py-2 text-sm"><span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">{e.category}</span></td>
                  <td className="px-4 py-2 text-sm text-gray-600">{e.description || '—'}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{e.expense_date}</td>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">${parseFloat(e.amount).toFixed(2)}</td>
                  {canEdit && (
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => handleDelete(e.id)} className="text-sm text-red-600 hover:underline">Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
