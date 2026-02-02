import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [settings, setSettings] = useState(null);
  const [users, setUsers] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('company');
  const [userForm, setUserForm] = useState({ email: '', password: '', role: 'staff' });
  const [keyName, setKeyName] = useState('');
  const [newToken, setNewToken] = useState(null);

  useEffect(() => {
    if (!isAdmin) { setLoading(false); return; }
    api('/api/settings').then(setSettings).catch((e) => setError(e.message)).finally(() => setLoading(false));
    api('/api/users').then(setUsers).catch(() => {});
    api('/api/integrations/api-keys').then(setApiKeys).catch(() => {});
  }, [isAdmin]);

  const saveSettings = (e) => {
    e.preventDefault();
    const form = e.target;
    const el = (name) => form.elements[name];
    api('/api/settings', {
      method: 'PUT',
      body: {
        agency_name: el('agency_name')?.value,
        currency: el('currency')?.value,
        vat_percent: el('vat_percent')?.value ? Number(el('vat_percent').value) : undefined,
      },
    }).then(setSettings).catch((e) => alert(e.message));
  };

  const createUser = (e) => {
    e.preventDefault();
    api('/api/users', { method: 'POST', body: userForm })
      .then(() => api('/api/users').then(setUsers))
      .then(() => setUserForm({ email: '', password: '', role: 'staff' }))
      .catch((e) => alert(e.message));
  };

  const createApiKey = (e) => {
    e.preventDefault();
    if (!keyName.trim()) return;
    api('/api/integrations/api-keys', { method: 'POST', body: { name: keyName.trim() } })
      .then((data) => {
        setNewToken(data.token);
        setKeyName('');
        return api('/api/integrations/api-keys');
      })
      .then(setApiKeys)
      .catch((e) => alert(e.message));
  };

  const revokeKey = (id) => {
    if (!confirm('Revoke this API key?')) return;
    api(`/api/integrations/api-keys/${id}`, { method: 'DELETE' })
      .then(() => api('/api/integrations/api-keys').then(setApiKeys))
      .catch((e) => alert(e.message));
  };

  if (!isAdmin) return <div className="text-gray-600">You need admin access to view settings.</div>;
  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Settings</h1>
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button type="button" onClick={() => setTab('company')} className={`px-4 py-2 text-sm font-medium ${tab === 'company' ? 'border-b-2 border-gray-800 text-gray-900' : 'text-gray-600'}`}>Company</button>
        <button type="button" onClick={() => setTab('users')} className={`px-4 py-2 text-sm font-medium ${tab === 'users' ? 'border-b-2 border-gray-800 text-gray-900' : 'text-gray-600'}`}>Users</button>
        <button type="button" onClick={() => setTab('api')} className={`px-4 py-2 text-sm font-medium ${tab === 'api' ? 'border-b-2 border-gray-800 text-gray-900' : 'text-gray-600'}`}>API keys</button>
      </div>
      {tab === 'company' && settings && (
        <form onSubmit={saveSettings} className="max-w-xl space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agency name</label>
            <input name="agency_name" defaultValue={settings.agency_name} className="w-full border border-gray-300 rounded px-3 py-2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <input name="currency" defaultValue={settings.currency} className="w-full border border-gray-300 rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">VAT %</label>
              <input name="vat_percent" type="number" defaultValue={settings.vat_percent} className="w-full border border-gray-300 rounded px-3 py-2" min="0" max="100" step="0.01" />
            </div>
          </div>
          <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700">Save</button>
        </form>
      )}
      {tab === 'users' && (
        <div className="max-w-xl">
          <form onSubmit={createUser} className="space-y-4 mb-6">
            <h2 className="font-medium text-gray-900">Create user</h2>
            <div className="grid grid-cols-2 gap-4">
              <input type="email" required placeholder="Email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} className="border border-gray-300 rounded px-3 py-2" />
              <input type="password" required placeholder="Password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} className="border border-gray-300 rounded px-3 py-2" minLength={6} />
            </div>
            <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} className="border border-gray-300 rounded px-3 py-2">
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
              <option value="readonly">Read-only</option>
            </select>
            <button type="submit" className="ml-2 bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700">Create</button>
          </form>
          <table className="w-full border border-gray-200 rounded overflow-hidden">
            <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Email</th><th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Role</th></tr></thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((u) => (
                <tr key={u.id}><td className="px-4 py-2 text-sm">{u.email}</td><td className="px-4 py-2 text-sm">{u.role}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === 'api' && (
        <div className="max-w-3xl space-y-8">
          {newToken && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded text-sm">
              <p className="font-medium text-amber-800">Copy this token now; it won’t be shown again.</p>
              <code className="block mt-2 break-all text-amber-900">{newToken}</code>
              <button type="button" onClick={() => setNewToken(null)} className="mt-2 text-amber-700 hover:underline">Dismiss</button>
            </div>
          )}
          <form onSubmit={createApiKey} className="flex gap-2">
            <input value={keyName} onChange={(e) => setKeyName(e.target.value)} placeholder="Key name (e.g. Chatbot)" className="flex-1 border border-gray-300 rounded px-3 py-2" />
            <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700">Generate</button>
          </form>
          <table className="w-full border border-gray-200 rounded overflow-hidden">
            <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Name</th><th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Created</th><th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Action</th></tr></thead>
            <tbody className="divide-y divide-gray-200">
              {apiKeys.map((k) => (
                <tr key={k.id}><td className="px-4 py-2 text-sm">{k.name}</td><td className="px-4 py-2 text-sm text-gray-600">{new Date(k.created_at).toLocaleDateString()}</td><td className="px-4 py-2 text-right"><button type="button" onClick={() => revokeKey(k.id)} className="text-red-600 hover:underline text-sm">Revoke</button></td></tr>
              ))}
            </tbody>
          </table>

          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h2 className="font-semibold text-gray-900 mb-3">API usage (for chatbots / external apps)</h2>
            <p className="text-sm text-gray-600 mb-3">Use your API key in the header. Base URL: same origin as this app, or in dev use <code className="bg-white px-1 rounded">http://localhost:3001</code>.</p>
            <p className="text-sm font-medium text-gray-700 mb-1">Authentication</p>
            <pre className="text-xs bg-white border border-gray-200 rounded p-2 mb-4 overflow-x-auto">Authorization: Bearer YOUR_API_KEY
X-API-Key: YOUR_API_KEY</pre>

            <p className="text-sm font-medium text-gray-700 mb-1">Get available cars (date range)</p>
            <pre className="text-xs bg-white border border-gray-200 rounded p-2 mb-4 overflow-x-auto">{`GET /api/availability?start=2025-02-01&end=2025-02-05
Optional: &class=SUV&branch_id=1`}</pre>

            <p className="text-sm font-medium text-gray-700 mb-1">Get all cars</p>
            <pre className="text-xs bg-white border border-gray-200 rounded p-2 mb-4 overflow-x-auto">GET /api/cars
Optional: ?status=active&class=Sedan</pre>

            <p className="text-sm font-medium text-gray-700 mb-1">Get branches</p>
            <pre className="text-xs bg-white border border-gray-200 rounded p-2 mb-4 overflow-x-auto">GET /api/branches</pre>

            <p className="text-sm font-medium text-gray-700 mb-1">Create a booking (POST)</p>
            <pre className="text-xs bg-white border border-gray-200 rounded p-2 mb-4 overflow-x-auto">{`POST /api/bookings
Content-Type: application/json

{
  "car_id": 1,
  "customer_name": "John Doe",
  "customer_phone": "+1234567890",
  "start_date": "2025-02-01",
  "end_date": "2025-02-05",
  "status": "reserved",
  "total_price": 250,
  "deposit": 50
}`}</pre>

            <p className="text-sm font-medium text-gray-700 mb-1">Get bookings</p>
            <pre className="text-xs bg-white border border-gray-200 rounded p-2 overflow-x-auto">GET /api/bookings
Optional: ?status=confirmed&from=2025-02-01&to=2025-02-28</pre>
          </div>
        </div>
      )}
    </div>
  );
}
