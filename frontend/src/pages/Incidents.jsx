import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { AlertTriangle, Plus, Eye } from 'lucide-react';

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

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading incident reports...</div>;
  if (error) return <div className="p-4 text-red-600 bg-red-50 rounded-lg">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Incidents</h1>
          <p className="text-muted-foreground">Track and manage vehicle damage and accidents.</p>
        </div>
        {canEdit && (
          <Link to="/incidents/new">
            <Button variant="destructive">
              <Plus className="mr-2 h-4 w-4" /> Report Incident
            </Button>
          </Link>
        )}
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {incidents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No incidents reported.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Estimated Cost</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="text-sm font-medium">
                    {new Date(i.incident_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div>{i.make} {i.model}</div>
                    <div className="text-xs text-muted-foreground font-mono">{i.plate_number}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={i.severity === 'major' ? 'destructive' : 'secondary'}>
                      {i.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{i.status}</TableCell>
                  <TableCell>
                    {i.estimated_cost != null ? `$${i.estimated_cost}` : '—'}
                  </TableCell>
                  <TableCell>
                    <Link to={`/incidents/${i.id}/edit`}>
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                    </Link>
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
