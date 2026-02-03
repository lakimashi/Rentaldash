import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select } from '../components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Search } from 'lucide-react';

const today = new Date().toISOString().slice(0, 10);
const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

export default function Availability() {
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(nextWeek);
  const [carClass, setCarClass] = useState('');
  const [branchId, setBranchId] = useState('');
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    api('/api/cars').then((list) => {
      const uniq = [...new Set(list.map((c) => c.class))].sort();
      setClasses(uniq);
    }).catch(() => { });
    api('/api/branches').then(setBranches).catch(() => { });
  }, []);

  const search = () => {
    setLoading(true);
    const params = new URLSearchParams({ start, end });
    if (carClass) params.set('class', carClass);
    if (branchId) params.set('branch_id', branchId);
    api(`/api/availability?${params}`)
      .then(setCars)
      .catch(() => setCars([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { search(); }, [start, end, carClass, branchId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Check Availability</h1>
        <p className="text-muted-foreground">Find vehicles available for specific dates.</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={carClass} onChange={(e) => setCarClass(e.target.value)}>
                <option value="">All Classes</option>
                {classes.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Branch</Label>
              <Select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                <option value="">All Branches</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
            </div>
            <Button onClick={search} className="w-full">
              <Search className="mr-2 h-4 w-4" /> Search
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading && <div className="text-center py-8 text-muted-foreground">Checking availability...</div>}

        {!loading && cars.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed rounded-xl">
            <p className="text-muted-foreground">No vehicles available for these dates.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cars.map((car) => (
            <Card key={car.id} className="overflow-hidden hover:shadow-lg transition-all">
              <div className="aspect-video bg-muted/50 flex items-center justify-center relative">
                {/* Image placeholder */}
                <span className="text-4xl text-muted-foreground/20 font-bold">{car.make}</span>
              </div>
              <CardHeader>
                <CardTitle className="text-lg">{car.make} {car.model}</CardTitle>
                <p className="text-sm text-muted-foreground">{car.year} • {car.class}</p>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center font-medium">
                  <span>Daily Rate</span>
                  <span>${car.base_daily_rate}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground mt-1">
                  <span>Plate</span>
                  <span className="font-mono">{car.plate_number}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Link to={`/bookings/new?car_id=${car.id}&start=${start}&end=${end}`} className="w-full">
                  <Button className="w-full">Book Now</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
