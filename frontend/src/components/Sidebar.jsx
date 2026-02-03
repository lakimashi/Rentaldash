import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Overview' },
  { to: '/availability', label: 'Availability' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/cars', label: 'Cars' },
  { to: '/bookings', label: 'Bookings' },
  { to: '/customers', label: 'Customers' },
  { to: '/expenses', label: 'Expenses' },
  { to: '/incidents', label: 'Incidents' },
  { to: '/maintenance', label: 'Maintenance' },
  { to: '/reports', label: 'Reports' },
  { to: '/settings', label: 'Settings', adminOnly: true },
  { to: '/audit', label: 'Audit', adminOnly: true },
];

export default function Sidebar() {
  const { user } = useAuth();
  const visible = links.filter((l) => !l.adminOnly || user?.role === 'admin');
  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <span className="font-semibold text-gray-800">Rental Dashboard</span>
      </div>
      <nav className="flex-1 p-2 space-y-0.5">
        {visible.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-sm ${isActive ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'}`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
