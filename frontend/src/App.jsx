import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Availability from './pages/Availability';
import Cars from './pages/Cars';
import CarForm from './pages/CarForm';
import Bookings from './pages/Bookings';
import BookingForm from './pages/BookingForm';
import Incidents from './pages/Incidents';
import IncidentForm from './pages/IncidentForm';
import Maintenance from './pages/Maintenance';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Audit from './pages/Audit';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="availability" element={<Availability />} />
          <Route path="cars" element={<Cars />} />
          <Route path="cars/new" element={<CarForm />} />
          <Route path="cars/:id/edit" element={<CarForm />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="bookings/new" element={<BookingForm />} />
          <Route path="incidents" element={<Incidents />} />
          <Route path="incidents/new" element={<IncidentForm />} />
          <Route path="incidents/:id/edit" element={<IncidentForm />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="audit" element={<Audit />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
