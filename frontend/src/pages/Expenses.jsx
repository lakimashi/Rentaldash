import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Trash2, Plus, X, DollarSign } from 'lucide-react';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [carId, setCarId] = useState('');
  const [category, setCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ car_id: '', category: 'maintenance', amount: '', description: '', expense_date: '' });
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'staff';
  const [cars, setCars] = useState([]);

  useEffect(() => {
    Promise.all([fetchExpenses(), api('/api/cars').then(setCars).catch(() => { })]);
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [carId, category]);

  const fetchExpenses = async () => {
    let url = '/api/expenses';
    const params = new URLSearchParams();
    if (carId) params.set('car_id', carId);
    if (category) params.set('category', category);
    if (params.toString()) url += `?${params}`;
    api(url)
      .then(setExpenses)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    api('/api/expenses', {
      method: 'POST',
      body: { ...form, car_id: Number(form.car_id), amount: Number(form.amount) },
    })
      .then(() => {
        setForm({ car_id: '', category: 'maintenance', amount: '', description: '', expense_date: '' });
        setShowForm(false);
        fetchExpenses();
      })
      .catch((e) => alert(e.message))
      .finally(() => setSubmitting(false));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    api(`/api/expenses/${id}`, { method: 'DELETE' })
      .then(() => setExpenses(expenses.filter((e) => e.id !== id)))
      .catch((e) => alert(e.message));
  };

  if (loading && !expenses.length) return <div className="p-8 text-center text-muted-foreground">Loading expenses...</div>;
  if (error) return <div className="p-4 text-red-600 bg-red-50 rounded-lg">{error}</div>;

  const categories = ['maintenance', 'insurance', 'registration', 'cleaning', 'misc', 'fuel'];
  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">Track vehicle costs and spending.</p>
        </div>
        {canEdit && (
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? <><X className="mr-2 h-4 w-4" /> Cancel</> : <><Plus className="mr-2 h-4 w-4" /> Add Expense</>}
          </Button>
        )}
      </div>

      {showForm && canEdit && (
        <Card className="animate-slide-up border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle>Log New Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
              <div>
                <Label>Vehicle *</Label>
                <Select required value={form.car_id} onChange={(e) => setForm({ ...form, car_id: e.target.value })}>
                  <option value="">-- Select Car --</option>
                  {cars.map((c) => <option key={c.id} value={c.id}>{c.plate_number} – {c.make} {c.model}</option>)}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amount ($) *</Label>
                  <Input type="number" required step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <textarea
                  className="flex h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Details about the expense..."
                />
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Expense'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/20 flex justify-between items-center">
          <span className="text-sm font-medium text-muted-foreground">Total Filtered:</span>
          <span className="text-lg font-bold text-gray-900">${totalExpenses.toFixed(2)}</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              {canEdit && <TableHead className="w-[80px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="text-sm text-muted-foreground">
                  {e.expense_date ? new Date(e.expense_date).toLocaleDateString() : '—'}
                </TableCell>
                <TableCell>
                  <div>{e.make} {e.model}</div>
                  <div className="text-xs text-muted-foreground font-mono">{e.plate_number}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">{e.category}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                  {e.description || '—'}
                </TableCell>
                <TableCell className="text-right font-medium">
                  ${e.amount}
                </TableCell>
                {canEdit && (
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {expenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No expenses logged.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
