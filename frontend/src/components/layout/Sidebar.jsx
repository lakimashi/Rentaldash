import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    CalendarCheck,
    Calendar,
    Car,
    Book,
    Users,
    Receipt,
    AlertTriangle,
    Wrench,
    BarChart,
    Settings,
    FileText
} from 'lucide-react';
import { cn } from '../../lib/utils';

const links = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/availability', label: 'Availability', icon: CalendarCheck },
    { to: '/calendar', label: 'Calendar', icon: Calendar },
    { to: '/cars', label: 'Cars', icon: Car },
    { to: '/bookings', label: 'Bookings', icon: Book },
    { to: '/customers', label: 'Customers', icon: Users },
    { to: '/expenses', label: 'Expenses', icon: Receipt },
    { to: '/incidents', label: 'Incidents', icon: AlertTriangle },
    { to: '/maintenance', label: 'Maintenance', icon: Wrench },
    { to: '/reports', label: 'Reports', icon: BarChart },
    { to: '/settings', label: 'Settings', icon: Settings, adminOnly: true },
    { to: '/audit', label: 'Audit', icon: FileText, adminOnly: true },
];

export default function Sidebar() {
    const { user } = useAuth();
    const visible = links.filter((l) => !l.adminOnly || user?.role === 'admin');

    return (
        <aside className="hidden h-screen w-64 flex-col border-r bg-card/50 backdrop-blur-xl md:flex">
            <div className="flex h-16 items-center border-b px-6">
                <span className="text-lg font-bold tracking-tight text-primary">RentalDash</span>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
                <nav className="grid items-start px-4 text-sm font-medium">
                    {visible.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all mb-0.5",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                )
                            }
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                        </NavLink>
                    ))}
                </nav>
            </div>
            <div className="mt-auto border-t p-4">
                {/* Helper footer or version info can go here */}
                <p className="text-xs text-center text-muted-foreground">v2.0.0</p>
            </div>
        </aside>
    );
}
