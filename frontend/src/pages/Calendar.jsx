import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export default function CalendarPage() {
  const [bookings, setBookings] = useState([]);
  const [date, setDate] = useState(new Date());
  const [carFilter, setCarFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/api/cars').then((list) => {
      setCars(list);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [date]);

  const fetchBookings = async () => {
    setLoading(true);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    let url = `/api/bookings?from=${year}-${month.toString().padStart(2, '0')}-01&to=${year}-${month.toString().padStart(2, '0')}-31`;
    
    if (carFilter) url += `&car_id=${carFilter}`;
    if (statusFilter) url += `&status=${statusFilter}`;
    
    api(url)
      .then(setBookings)
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  };

  const getBookingForDate = (date) => {
    return bookings.filter((b) => {
      const start = new Date(b.start_date);
      const end = new Date(b.end_date);
      const checkDate = new Date(date);
      return checkDate >= start && checkDate <= end;
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-200 text-gray-800',
      reserved: 'bg-yellow-200 text-yellow-800',
      confirmed: 'bg-blue-200 text-blue-800',
      active: 'bg-red-200 text-red-800',
      completed: 'bg-green-200 text-green-800',
      cancelled: 'bg-gray-300 text-gray-600',
    };
    return colors[status] || 'bg-gray-200 text-gray-800';
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Calendar</h1>
      
      <div className="flex gap-4 mb-6 flex-wrap">
        <select value={carFilter} onChange={(e) => setCarFilter(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-sm">
          <option value="">All Cars</option>
          {cars.map((c) => (
            <option key={c.id} value={c.id}>{c.plate_number} – {c.make} {c.model}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-sm">
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="reserved">Reserved</option>
          <option value="confirmed">Confirmed</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <Calendar 
              onChange={setDate}
              value={date}
              view="month"
              className="w-full"
            />
          </div>
        </div>

        <div>
          {loading ? (
            <div className="text-gray-500">Loading...</div>
          ) : (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">
                {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              {getBookingForDate(date).length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center text-gray-500">
                  No bookings for this day
                </div>
              ) : (
                <div className="space-y-2">
                  {getBookingForDate(date).map((booking) => (
                    <div key={booking.id} className={`bg-white border border-gray-200 rounded-lg p-3 ${getStatusColor(booking.status)}`}>
                      <Link to={`/bookings/${booking.id}`} className="block">
                        <p className="font-medium text-sm">{booking.customer_name}</p>
                        <p className="text-xs opacity-75">{booking.plate_number} · {booking.make} {booking.model}</p>
                        <p className="text-xs font-medium">
                          {new Date(booking.start_date).toLocaleDateString()} – {new Date(booking.end_date).toLocaleDateString()}
                        </p>
                        <p className="text-xs font-bold">${parseFloat(booking.total_price).toFixed(2)}</p>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Legend</h3>
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-yellow-200"></span>
            <span>Reserved</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-blue-200"></span>
            <span>Confirmed</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-red-200"></span>
            <span>Active</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-200"></span>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-gray-300"></span>
            <span>Cancelled</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-gray-200"></span>
            <span>Draft</span>
          </div>
        </div>
      </div>
    </div>
  );
}
