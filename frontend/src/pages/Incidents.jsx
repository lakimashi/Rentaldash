import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'staff';

  useEffect(() => {
    api('/api/incidents')
      .then(setIncidents)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Incidents</h1>
        {canEdit && <Link to="/incidents/new" className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700">New incident</Link>}
      </div>
      {incidents.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
          No incident reports yet. {canEdit && <Link to="/incidents/new" className="text-gray-800 font-medium hover:underline">Create one</Link>}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Date</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Car</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Severity</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {incidents.map((i) => (
                <tr key={i.id}>
                  <td className="px-4 py-2 text-sm text-gray-600">{new Date(i.incident_date).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-sm">{i.plate_number} · {i.make} {i.model}</td>
                  <td className="px-4 py-2"><span className={`px-2 py-0.5 rounded text-xs ${i.severity === 'major' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'}`}>{i.severity}</span></td>
                  <td className="px-4 py-2 text-sm">{i.status}</td>
                  <td className="px-4 py-2 text-sm">{i.estimated_cost != null ? `$${i.estimated_cost}` : '—'}</td>
                  <td className="px-4 py-2"><Link to={`/incidents/${i.id}/edit`} className="text-sm text-gray-800 hover:underline">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
