import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Plus, Search, Filter, Edit, Trash2, MoreHorizontal } from 'lucide-react';

export default function Cars() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [carClass, setCarClass] = useState('');
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'staff';

  const [selectedIds, setSelectedIds] = useState([]);
  const isAdmin = user?.role === 'admin';

  const [allClasses, setAllClasses] = useState([]);

  const handleDelete = async (carId, plateNumber) => {
    if (!window.confirm(`Are you sure you want to delete car ${plateNumber}? This will set it to inactive.`)) return;
    try {
      await api(`/api/cars/${carId}`, { method: 'DELETE' });
      setCars(cars.filter((c) => c.id !== carId));
      setSelectedIds(selectedIds.filter(id => id !== carId));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (!isAdmin) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} cars?`)) return;

    try {
      await api('/api/cars/bulk-delete', {
        method: 'POST',
        body: { ids: selectedIds },
      });
      setSelectedIds([]);
      // Refresh list
      const list = await api('/api/cars');
      setCars(list);
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(current =>
      current.includes(id) ? current.filter(i => i !== id) : [...current, id]
    );
  };

  useEffect(() => {
    api('/api/cars').then((list) => {
      const uniq = [...new Set(list.map((c) => c.class))].sort();
      setAllClasses(uniq);
    }).catch(() => { });
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

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading fleet data...</div>;
  if (error) return <div className="p-4 text-red-600 bg-red-50 rounded-lg">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fleet Management</h1>
          <p className="text-muted-foreground">Manage your vehicle inventory and status.</p>
        </div>
        {isAdmin && selectedIds.length > 0 && (
          <Button variant="destructive" onClick={handleBulkDelete}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedIds.length})
          </Button>
        )}
        {canEdit && (
          <Link to="/cars/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Vehicle
            </Button>
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by plate, make, or model..." className="pl-9" />
        </div>
        <div className="flex gap-2">
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-[180px]">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="inactive">Inactive</option>
          </Select>
          <Select value={carClass} onChange={(e) => setCarClass(e.target.value)} className="w-[180px]">
            <option value="">All Classes</option>
            {classes.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
      </div>

      {cars.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-xl">
          <p className="text-muted-foreground mb-4">No cars found matching your criteria.</p>
          {canEdit && <Link to="/cars/new"><Button variant="outline">Add your first car</Button></Link>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cars.map((car) => (
            <Card key={car.id} className={`overflow-hidden hover:shadow-md transition-shadow ${selectedIds.includes(car.id) ? 'ring-2 ring-primary' : ''}`}>
              <div className="aspect-video bg-muted relative flex items-center justify-center">
                {car.images && car.images[0] ? (
                  <img src={`${import.meta.env.VITE_API_URL || ''}${car.images[0].url_path}`} alt={`${car.make} ${car.model}`} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-muted-foreground text-4xl font-light">{car.make[0]}</span>
                )}
                <Badge
                  variant={car.status === 'active' ? 'success' : car.status === 'maintenance' ? 'warning' : 'secondary'}
                  className="absolute top-2 right-2"
                >
                  {car.status}
                </Badge>
                {isAdmin && (
                  <input
                    type="checkbox"
                    className="absolute top-2 left-2 h-5 w-5 rounded border-gray-300 z-10"
                    checked={selectedIds.includes(car.id)}
                    onChange={(e) => { e.stopPropagation(); toggleSelect(car.id); }}
                  />
                )}
              </div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{car.make} {car.model}</CardTitle>
                    <p className="text-sm text-muted-foreground">{car.year} • {car.class}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Daily Rate</span>
                  <span className="font-semibold">${car.base_daily_rate}</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-muted-foreground">Plate</span>
                  <span className="font-mono bg-muted px-1 rounded">{car.plate_number}</span>
                </div>
              </CardContent>
              {canEdit && (
                <CardFooter className="pt-2 border-t flex justify-end gap-2 bg-muted/20">
                  <Link to={`/cars/${car.id}/edit`}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to={`/cars/${car.id}/documents`}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Documents">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(car.id, car.plate_number)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>)}
    </div>
  );
}
