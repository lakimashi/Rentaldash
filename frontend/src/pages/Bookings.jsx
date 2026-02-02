import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const statusColors = { draft: 'bg-gray-100 text-gray-700', reserved: 'bg-blue-100 text-blue-800', confirmed: 'bg-green-100 text-green-800', active: 'bg-yellow-100 text-yellow-800', completed: 'bg-gray-100 text-gray-600', cancelled: 'bg-red-100 text-red-800' };

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'staff';

  useEffect(() => {
    let url = '/api/bookings';
    if (status) url += `?status=${status}`;
    api(url)
      .then(setBookings)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [status]);

  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Bookings</h1>
        {canEdit && <Link to="/bookings/new" className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700">New booking</Link>}
      </div>
      <div className="mb-4">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="reserved">Reserved</option>
          <option value="confirmed">Confirmed</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      {bookings.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
          No bookings yet. {canEdit && <Link to="/bookings/new" className="text-gray-800 font-medium hover:underline">Create one</Link>}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Customer</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Car</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Dates</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-2 text-sm text-gray-900">{b.customer_name}</td>
                  <td className="px-4 py-2 text-sm">{b.plate_number} · {b.make} {b.model}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{b.start_date} – {b.end_date}</td>
                  <td className="px-4 py-2"><span className={`px-2 py-0.5 rounded text-xs ${statusColors[b.status] || 'bg-gray-100'}`}>{b.status}</span></td>
                  <td className="px-4 py-2 text-sm">${b.total_price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
