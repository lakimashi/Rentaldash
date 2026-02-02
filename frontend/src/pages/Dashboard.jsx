import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/reports')
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  const cards = [
    { title: 'Available today', value: data?.available_today ?? 0, link: '/availability' },
    { title: 'Bookings today', value: data?.bookings_today ?? 0, link: '/bookings' },
    { title: 'Currently rented', value: data?.active_rentals ?? 0, link: '/bookings' },
    { title: 'Pending incidents', value: data?.pending_incidents ?? 0, link: '/incidents' },
    { title: 'Revenue total', value: `$${Number(data?.revenue_total ?? 0).toFixed(0)}`, link: '/reports' },
    { title: 'Utilization', value: `${data?.utilization_percent ?? 0}%`, link: '/reports' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ title, value, link }) => (
          <Link key={title} to={link} className="bg-white p-5 rounded-lg border border-gray-200 hover:border-gray-300 transition">
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
