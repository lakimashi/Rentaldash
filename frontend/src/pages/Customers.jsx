import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Search, Plus, X, User, Trash2 } from 'lucide-react';

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
  const isAdmin = user?.role === 'admin';
  const [selectedIds, setSelectedIds] = useState([]);


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

  if (loading && !customers.length) return <div className="p-8 text-center text-muted-foreground">Loading customers...</div>;
  if (error) return <div className="p-4 text-red-600 bg-red-50 rounded-lg">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">Manage customer profiles and details.</p>
        </div>
        {isAdmin && selectedIds.length > 0 && (
          <Button variant="destructive" onClick={handleBulkDelete}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedIds.length})
          </Button>
        )}
        {canEdit && (
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? <><X className="mr-2 h-4 w-4" /> Cancel</> : <><Plus className="mr-2 h-4 w-4" /> Add Customer</>}
          </Button>
        )}
      </div>

      {showForm && canEdit && (
        <Card className="animate-slide-up border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle>New Customer Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <textarea
                  className="flex h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ID / Passport Number</Label>
                  <Input value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>License Expiry</Label>
                  <Input type="date" value={form.license_expiry} onChange={(e) => setForm({ ...form, license_expiry: e.target.value })} />
                </div>
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Adding...' : 'Save Customer'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by name, email, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 max-w-md"
        />
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {customers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No customers found.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {isAdmin && (
                  <TableHead className="w-[40px]">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={selectedIds.length === customers.length && customers.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </TableHead>
                )}
                <TableHead>Customer</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>ID / License</TableHead>
                <TableHead>Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.id} data-state={selectedIds.includes(c.id) ? 'selected' : ''}>
                  {isAdmin && (
                    <TableCell>
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={selectedIds.includes(c.id)}
                        onChange={() => toggleSelect(c.id)}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      {c.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>{c.email}</div>
                    <div className="text-muted-foreground">{c.phone}</div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>ID: {c.id_number || '—'}</div>
                    <div className="text-xs text-muted-foreground">Exp: {c.license_expiry || '—'}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {c.address}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
