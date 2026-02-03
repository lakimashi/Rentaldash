import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Trash2, Key, Users, Building, Plus, Shield } from 'lucide-react';

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

  // Profile state
  const [profileForm, setProfileForm] = useState({ current_password: '', new_password: '' });
  const [profileMsg, setProfileMsg] = useState('');

  useEffect(() => {
    // Even non-admins can view settings page now for the "Profile" tab
    if (!isAdmin) {
      if (tab === 'company') setTab('profile'); // Switch to profile if not admin
      setLoading(false);
      return;
    }
    api('/api/settings').then(setSettings).catch((e) => setError(e.message)).finally(() => setLoading(false));
    api('/api/users').then(setUsers).catch(() => { });
    api('/api/integrations/api-keys').then(setApiKeys).catch(() => { });
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

  const changePassword = (e) => {
    e.preventDefault();
    setProfileMsg('');
    api('/api/auth/profile', { method: 'PUT', body: profileForm })
      .then(() => {
        setProfileMsg('Password updated successfully.');
        setProfileForm({ current_password: '', new_password: '' });
      })
      .catch(e => alert(e.message));
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>;
  if (error) return <div className="p-4 text-red-600 bg-red-50 rounded-lg">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your agency, users, and profile.</p>
      </div>

      <div className="flex gap-2 border-b overflow-x-auto">
        {isAdmin && (
          <Button variant={tab === 'company' ? 'default' : 'ghost'} onClick={() => setTab('company')} className="rounded-b-none">
            <Building className="mr-2 h-4 w-4" /> Company
          </Button>
        )}
        {isAdmin && (
          <Button variant={tab === 'users' ? 'default' : 'ghost'} onClick={() => setTab('users')} className="rounded-b-none">
            <Users className="mr-2 h-4 w-4" /> Users
          </Button>
        )}
        {isAdmin && (
          <Button variant={tab === 'api' ? 'default' : 'ghost'} onClick={() => setTab('api')} className="rounded-b-none">
            <Key className="mr-2 h-4 w-4" /> API Keys
          </Button>
        )}
        <Button variant={tab === 'profile' ? 'default' : 'ghost'} onClick={() => setTab('profile')} className="rounded-b-none">
          <Shield className="mr-2 h-4 w-4" /> Security
        </Button>
      </div>

      {tab === 'company' && isAdmin && settings && (
        <Card>
          <CardHeader>
            <CardTitle>Company Details</CardTitle>
            <CardDescription>General settings for your rental agency.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveSettings} className="space-y-4 max-w-xl">
              <div className="space-y-2">
                <Label>Agency Name</Label>
                <Input name="agency_name" defaultValue={settings.agency_name} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Input name="currency" defaultValue={settings.currency} />
                </div>
                <div className="space-y-2">
                  <Label>VAT %</Label>
                  <Input name="vat_percent" type="number" defaultValue={settings.vat_percent} min="0" max="100" step="0.01" />
                </div>
              </div>
              <Button type="submit">Save Changes</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {tab === 'users' && isAdmin && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create User</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createUser} className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label>Email</Label>
                  <Input type="email" required value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
                </div>
                <div className="flex-1 space-y-2">
                  <Label>Password</Label>
                  <Input type="password" required value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
                </div>
                <Button type="submit"><Plus className="mr-2 h-4 w-4" /> Add User</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>{u.email}</TableCell>
                      <TableCell className="capitalize">{u.role}</TableCell>
                      <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'api' && isAdmin && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate API Key</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createApiKey} className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label>Key Name</Label>
                  <Input placeholder="e.g. Chatbot Integration" value={keyName} onChange={(e) => setKeyName(e.target.value)} />
                </div>
                <Button type="submit"><Plus className="mr-2 h-4 w-4" /> Generate Key</Button>
              </form>
              {newToken && (
                <div className="mt-4 p-4 bg-green-50 text-green-800 rounded-lg border border-green-200">
                  <p className="font-semibold text-sm">New Key Generated:</p>
                  <code className="block mt-1 p-2 bg-white rounded border border-green-100 select-all font-mono break-all">{newToken}</code>
                  <p className="text-xs mt-1 text-green-700">Copy this now. You won't see it again.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Prefix</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((k) => (
                    <TableRow key={k.id}>
                      <TableCell>{k.name}</TableCell>
                      <TableCell className="font-mono text-muted-foreground">{k.key_prefix}...</TableCell>
                      <TableCell>{new Date(k.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => revokeKey(k.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your account security credentials.</CardDescription>
          </CardHeader>
          <CardContent>
            {profileMsg && <div className="mb-4 p-3 bg-green-100 text-green-800 rounded">{profileMsg}</div>}
            <form onSubmit={changePassword} className="space-y-4 max-w-xl">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input type="password" required value={profileForm.current_password} onChange={(e) => setProfileForm({ ...profileForm, current_password: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input type="password" required minLength={6} value={profileForm.new_password} onChange={(e) => setProfileForm({ ...profileForm, new_password: e.target.value })} />
              </div>
              <Button type="submit">Update Password</Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
