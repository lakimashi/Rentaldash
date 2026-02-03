import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ReturnChecklist() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'staff';
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checklist, setChecklist] = useState({
    fuel_level: '',
    exterior_condition: '',
    interior_condition: '',
    tire_condition: '',
    damage_notes: '',
  });

  useEffect(() => {
    api(`/api/bookings/${id}`)
      .then(setBooking)
      .catch(() => navigate('/bookings'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    api(`/api/bookings/${id}`, {
      method: 'PUT',
      body: { status: 'completed', ...checklist },
    })
      .then(() => navigate('/bookings'))
      .catch((err) => alert(err.message))
      .finally(() => setSubmitting(false));
  };

  if (loading) return <div className="text-gray-500">Loading booking...</div>;
  if (!booking) return <div className="text-red-600">Booking not found</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Return Checklist</h1>
        <Link to="/bookings" className="text-sm text-gray-600 hover:underline">Back to Bookings</Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking #{booking.id}</h2>
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-6">
          <div>
            <span className="font-medium text-gray-900">Customer:</span> {booking.customer_name}
          </div>
          <div>
            <span className="font-medium text-gray-900">Phone:</span> {booking.customer_phone || '—'}
          </div>
          <div>
            <span className="font-medium text-gray-900">Car:</span> {booking.plate_number} · {booking.make} {booking.model}
          </div>
          <div>
            <span className="font-medium text-gray-900">Dates:</span> {booking.start_date} – {booking.end_date}
          </div>
        </div>
      </div>

      {canEdit ? (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Condition</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fuel Level *</label>
            <select required value={checklist.fuel_level} onChange={(e) => setChecklist({ ...checklist, fuel_level: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2">
              <option value="">Select fuel level</option>
              <option value="empty">Empty</option>
              <option value="quarter">Quarter tank</option>
              <option value="half">Half tank</option>
              <option value="three_quarter">Three-quarter tank</option>
              <option value="full">Full</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Exterior Condition *</label>
            <textarea required value={checklist.exterior_condition} onChange={(e) => setChecklist({ ...checklist, exterior_condition: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" rows="3" placeholder="Describe exterior condition (scratches, dents, cleanliness...)" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Interior Condition *</label>
            <textarea required value={checklist.interior_condition} onChange={(e) => setChecklist({ ...checklist, interior_condition: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" rows="3" placeholder="Describe interior condition (seats, floors, odors, cleanliness...)" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tire Condition *</label>
            <textarea required value={checklist.tire_condition} onChange={(e) => setChecklist({ ...checklist, tire_condition: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" rows="2" placeholder="Describe tire condition (tread, pressure, damage...)" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Damage Notes</label>
            <textarea value={checklist.damage_notes} onChange={(e) => setChecklist({ ...checklist, damage_notes: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" rows="3" placeholder="Note any damage, issues, or concerns" />
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className="flex-1 bg-green-600 text-white px-4 py-3 rounded hover:bg-green-700 disabled:opacity-50">
              {submitting ? 'Completing Return...' : 'Complete Return'}
            </button>
            <Link to="/bookings" className="px-4 py-3 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">
              Cancel
            </Link>
          </div>
        </form>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-gray-500">You do not have permission to complete vehicle returns.</p>
          <Link to="/bookings" className="mt-4 inline-block text-sm text-gray-700 hover:underline">Back to Bookings</Link>
        </div>
      )}
    </div>
  );
}
