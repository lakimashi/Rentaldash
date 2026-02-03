import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Wrench, Plus, X } from 'lucide-react';

export default function Maintenance() {
  const [blocks, setBlocks] = useState([]);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ car_id: '', start_date: '', end_date: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'staff';

  useEffect(() => {
    Promise.all([api('/api/maintenance'), api('/api/cars')])
      .then(([m, c]) => { setBlocks(m); setCars(c); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    api('/api/maintenance', {
      method: 'POST',
      body: { ...form, car_id: Number(form.car_id) },
    })
      .then(() => {
        setForm({ car_id: '', start_date: '', end_date: '', reason: '' });
        setShowForm(false);
        return api('/api/maintenance');
      })
      .then(setBlocks)
      .catch((e) => alert(e.message))
      .finally(() => setSubmitting(false));
  };

  const today = new Date().toISOString().slice(0, 10);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading maintenance schedule...</div>;
  if (error) return <div className="p-4 text-red-600 bg-red-50 rounded-lg">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Maintenance</h1>
          <p className="text-muted-foreground">Schedule and track vehicle maintenance.</p>
        </div>
        {canEdit && (
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? <><X className="mr-2 h-4 w-4" /> Cancel</> : <><Plus className="mr-2 h-4 w-4" /> Schedule Maintenance</>}
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="animate-slide-up border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle>New Maintenance Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
              <div>
                <Label>Vehicle *</Label>
                <Select required value={form.car_id} onChange={(e) => setForm({ ...form, car_id: e.target.value })}>
                  <option value="">-- Select Car --</option>
                  {cars.filter((c) => c.status === 'active').map((c) => (
                    <option key={c.id} value={c.id}>{c.plate_number} – {c.make} {c.model}</option>
                  ))}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Input type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} min={today} />
                </div>
                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <Input type="date" required value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} min={form.start_date || today} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g., Oil change, Tire rotation..." />
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Scheduling...' : 'Schedule Maintenance'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {blocks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No maintenance scheduled.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blocks.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">
                    <div>{m.make} {m.model}</div>
                    <div className="text-xs text-muted-foreground font-mono">{m.plate_number}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {m.start_date} <span className="mx-1">→</span> {m.end_date}
                  </TableCell>
                  <TableCell>{m.reason || '—'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Edit">
                      <Wrench className="h-4 w-4" />
                    </Button>
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
