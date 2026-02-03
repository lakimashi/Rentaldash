import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Car, CalendarCheck, AlertTriangle, Coins, TrendingUp, Users } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/reports')
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-32 bg-muted/20 animate-pulse rounded-xl" />
      ))}
    </div>
  );
  if (error) return <div className="p-4 text-red-600 bg-red-50 rounded-lg">{error}</div>;

  const cards = [
    { title: 'Available Today', value: data?.available_today ?? 0, link: '/availability', icon: Car, color: 'text-green-600' },
    { title: 'Bookings Today', value: data?.bookings_today ?? 0, link: '/bookings', icon: CalendarCheck, color: 'text-blue-600' },
    { title: 'Currently Rented', value: data?.active_rentals ?? 0, link: '/bookings', icon: Users, color: 'text-purple-600' },
    { title: 'Pending Incidents', value: data?.pending_incidents ?? 0, link: '/incidents', icon: AlertTriangle, color: 'text-red-600' },
    { title: 'Total Revenue', value: `$${Number(data?.revenue_total ?? 0).toLocaleString()}`, link: '/reports', icon: Coins, color: 'text-yellow-600' },
    { title: 'Utilization', value: `${data?.utilization_percent ?? 0}%`, link: '/reports', icon: TrendingUp, color: 'text-emerald-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        {/* Date filter could go here */}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ title, value, link, icon: Icon, color }) => (
          <Link key={title} to={link} className="block transition-transform hover:scale-[1.02]">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {title}
                </CardTitle>
                <Icon className={cn("h-4 w-4", color)} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Activity or Chart Placeholder could go here */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No recent activity to display.</p>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Link to="/bookings/new" className="text-sm text-primary hover:underline">Create Booking &rarr;</Link>
            <Link to="/cars/new" className="text-sm text-primary hover:underline">Add Car &rarr;</Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
