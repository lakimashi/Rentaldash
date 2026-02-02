import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

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
    }).catch(() => {});
    api('/api/branches').then(setBranches).catch(() => {});
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
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Availability</h1>
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Start</label>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="border border-gray-300 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">End</label>
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="border border-gray-300 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Class</label>
          <select value={carClass} onChange={(e) => setCarClass(e.target.value)} className="border border-gray-300 rounded px-3 py-2">
            <option value="">All</option>
            {classes.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Branch</label>
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="border border-gray-300 rounded px-3 py-2">
            <option value="">All</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <button type="button" onClick={search} className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700">Search</button>
      </div>
      {loading && <p className="text-gray-500">Loading...</p>}
      {!loading && cars.length === 0 && <p className="text-gray-500">No available cars for this range. Try different dates or filters.</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cars.map((car) => (
          <div key={car.id} className="bg-white border border-gray-200 rounded-lg p-4">
            {car.images?.[0] && <img src={car.images[0]} alt="" className="w-full h-32 object-cover rounded mb-2" />}
            <p className="font-medium text-gray-900">{car.make} {car.model} ({car.year})</p>
            <p className="text-sm text-gray-500">{car.plate_number} · {car.class}</p>
            <p className="text-sm font-medium text-gray-700 mt-1">${car.base_daily_rate}/day</p>
            <Link to={`/bookings/new?car_id=${car.id}&start=${start}&end=${end}`} className="inline-block mt-2 text-sm text-gray-800 font-medium hover:underline">Create Booking</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
