import { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/reports')
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const exportCsv = async (type) => {
    const token = localStorage.getItem('rental_token');
    const res = await fetch(`/api/reports/export/${type}`, {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Utilization</p>
          <p className="text-2xl font-semibold text-gray-900">{data?.utilization_percent ?? 0}%</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Revenue total</p>
          <p className="text-2xl font-semibold text-gray-900">${Number(data?.revenue_total ?? 0).toFixed(0)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Active rentals</p>
          <p className="text-2xl font-semibold text-gray-900">{data?.active_rentals ?? 0}</p>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Export CSV</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => exportCsv('bookings').catch((e) => alert(e.message || 'Export failed'))} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm">Bookings</button>
          <button type="button" onClick={() => exportCsv('cars').catch((e) => alert(e.message || 'Export failed'))} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm">Cars</button>
          <button type="button" onClick={() => exportCsv('incidents').catch((e) => alert(e.message || 'Export failed'))} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm">Incidents</button>
        </div>
      </div>
    </div>
  );
}
