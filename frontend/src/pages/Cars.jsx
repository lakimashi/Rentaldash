import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Cars() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [carClass, setCarClass] = useState('');
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'staff';

  const [allClasses, setAllClasses] = useState([]);

  useEffect(() => {
    api('/api/cars').then((list) => {
      const uniq = [...new Set(list.map((c) => c.class))].sort();
      setAllClasses(uniq);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    let url = '/api/cars';
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (carClass) params.set('class', carClass);
    if (params.toString()) url += `?${params}`;
    api(url)
      .then(setCars)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [status, carClass]);

  const classes = allClasses.length ? allClasses : [...new Set(cars.map((c) => c.class))].sort();

  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Cars</h1>
        {canEdit && <Link to="/cars/new" className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700">Add car</Link>}
      </div>
      <div className="flex gap-4 mb-4">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="maintenance">Maintenance</option>
          <option value="inactive">Inactive</option>
        </select>
        <select value={carClass} onChange={(e) => setCarClass(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-sm">
          <option value="">All classes</option>
          {classes.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      {cars.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
          No cars yet. {canEdit && <Link to="/cars/new" className="text-gray-800 font-medium hover:underline">Add one</Link>}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Plate</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Make / Model</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Year</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Class</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Rate</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                {canEdit && <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cars.map((car) => (
                <tr key={car.id}>
                  <td className="px-4 py-2 text-sm text-gray-900">{car.plate_number}</td>
                  <td className="px-4 py-2 text-sm">{car.make} {car.model}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{car.year}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{car.class}</td>
                  <td className="px-4 py-2 text-sm">${car.base_daily_rate}/day</td>
                  <td className="px-4 py-2 text-sm"><span className={`px-2 py-0.5 rounded text-xs ${car.status === 'active' ? 'bg-green-100 text-green-800' : car.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>{car.status}</span></td>
                  {canEdit && <td className="px-4 py-2 text-right"><Link to={`/cars/${car.id}/edit`} className="text-sm text-gray-800 hover:underline">Edit</Link></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
