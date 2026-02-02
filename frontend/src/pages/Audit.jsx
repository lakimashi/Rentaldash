import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Audit() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdmin) { setLoading(false); return; }
    api('/api/audit?limit=200')
      .then(setLogs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  if (!isAdmin) return <div className="text-gray-600">You need admin access to view the audit log.</div>;
  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Audit Log</h1>
      {logs.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">No audit entries yet.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Time</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">User</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Action</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Entity</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-2 text-sm text-gray-600">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm">{log.user_email || '—'}</td>
                  <td className="px-4 py-2 text-sm">{log.action}</td>
                  <td className="px-4 py-2 text-sm">{log.entity_type}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{log.entity_id || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
