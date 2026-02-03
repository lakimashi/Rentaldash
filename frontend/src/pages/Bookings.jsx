import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Select } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, Check, MoreHorizontal, Pencil } from 'lucide-react';

const statusBadgeVariants = {
  draft: 'secondary',
  reserved: 'default',
  confirmed: 'success',
  active: 'warning',
  completed: 'secondary',
  cancelled: 'destructive'
};

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'staff';

  useEffect(() => {
    let url = '/api/bookings';
    if (status) url += `?status=${status}`;
    api(url)
      .then(setBookings)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [status]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading bookings...</div>;
  if (error) return <div className="p-4 text-red-600 bg-red-50 rounded-lg">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground">Manage reservations and active rentals.</p>
        </div>
        {canEdit && (
          <Link to="/bookings/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Booking
            </Button>
          </Link>
        )}
      </div>

      <div className="flex items-center gap-2 bg-card p-4 rounded-xl border shadow-sm max-w-sm">
        <span className="text-sm font-medium whitespace-nowrap">Filter Status:</span>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full">
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="reserved">Reserved</option>
          <option value="confirmed">Confirmed</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No bookings found.</p>
            {canEdit && <Link to="/bookings/new"><Button variant="outline">Create a booking</Button></Link>}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total Price</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.customer_name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{b.make} {b.model}</span>
                      <span className="text-xs text-muted-foreground font-mono">{b.plate_number}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {b.start_date} <span className="mx-1">→</span> {b.end_date}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariants[b.status] || 'secondary'}>
                      {b.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${b.total_price}
                  </TableCell>
                  <TableCell className="flex gap-1 justify-end">
                    {canEdit && (
                      <Link to={`/bookings/${b.id}/edit`}>
                        <Button size="sm" variant="ghost" title="Edit Booking">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                    {b.status === 'active' && (
                      <Link to={`/bookings/${b.id}/return`}>
                        <Button size="sm" variant="ghost" title="Return Vehicle">
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                      </Link>
                    )}
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
