import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Bell, User, LogOut } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export default function Topbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchUnreadCount();
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const data = await api('/api/notifications/unread-count');
            setUnreadCount(data.count || 0);
        } catch (err) {
            console.error('Failed to fetch unread count:', err);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-6 backdrop-blur-xl transition-all">
            <div className="flex flex-1 items-center gap-4">
                {/* Placeholder for breadcrumb or search if needed later */}
                <h1 className="text-lg font-semibold md:text-xl">Dashboard</h1>
            </div>

            <div className="flex items-center gap-4">
                <Link to="/notifications" className="relative">
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-600 ring-2 ring-white" />
                        )}
                        <span className="sr-only">Notifications</span>
                    </Button>
                </Link>

                <div className="flex items-center gap-3 border-l pl-4">
                    <div className="hidden flex-col items-end text-sm sm:flex">
                        <span className="font-medium text-foreground">{user?.email}</span>
                        <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                        <LogOut className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                    </Button>
                </div>
            </div>
        </header>
    );
}
