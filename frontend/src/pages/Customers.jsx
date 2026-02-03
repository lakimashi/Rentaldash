import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', phone: '', name: '', address: '', id_number: '', license_expiry: '' });
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'staff';

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (search || search === '') fetchCustomers(search);
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [search]);

  const fetchCustomers = async (searchTerm = '') => {
    let url = '/api/customers';
    if (searchTerm) url += `?search=${encodeURIComponent(searchTerm)}`;
    api(url)
      .then(setCustomers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    api('/api/customers', { method: 'POST', body: form })
      .then(() => {
        setForm({ email: '', phone: '', name: '', address: '', id_number: '', license_expiry: '' });
        setShowForm(false);
        fetchCustomers(search);
      })
      .catch((e) => alert(e.message))
      .finally(() => setSubmitting(false));
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
        {canEdit && (
          <button type="button" onClick={() => setShowForm(!showForm)} className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700">
            {showForm ? 'Cancel' : 'Add Customer'}
          </button>
        )}
      </div>
      
      {showForm && canEdit && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4 mb-6 max-w-xl space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" rows="2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
              <input value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License Expiry</label>
              <input type="date" value={form.license_expiry} onChange={(e) => setForm({ ...form, license_expiry: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50">
            {submitting ? 'Adding...' : 'Add Customer'}
          </button>
        </form>
      )}

      <div className="mb-4">
        <input type="text" placeholder="Search by name, email, phone, or ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="border border-gray-300 rounded px-3 py-2 w-full md:w-96" />
      </div>

      {customers.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
          No customers yet. {canEdit && 'Add one above.'}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Name</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Email</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Phone</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">ID Number</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">License Expiry</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {customers.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-2 text-sm text-gray-900">{c.name}</td>
                  <td className="px-4 py-2 text-sm">{c.email || '—'}</td>
                  <td className="px-4 py-2 text-sm">{c.phone || '—'}</td>
                  <td className="px-4 py-2 text-sm">{c.id_number || '—'}</td>
                  <td className="px-4 py-2 text-sm">{c.license_expiry || '—'}</td>
                  <td className="px-4 py-2 text-right">
                    <Link to={`/customers/${c.id}`} className="text-sm text-gray-800 hover:underline">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
