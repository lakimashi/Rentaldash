import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Bell, Check, Clock, AlertCircle, Info } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, []);

  const fetchNotifications = async () => {
    api('/api/notifications')
      .then(setNotifications)
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  };

  const fetchUnreadCount = async () => {
    api('/api/notifications/unread-count')
      .then((data) => setUnreadCount(data.count || 0))
      .catch(() => setUnreadCount(0));
  };

  const markAsRead = async (id) => {
    await api(`/api/notifications/${id}/read`, { method: 'PUT' });
    setNotifications(notifications.map((n) =>
      n.id === id ? { ...n, is_read: true } : n
    ));
    setUnreadCount(Math.max(0, unreadCount - 1));
  };

  const markAllAsRead = async () => {
    await api('/api/notifications/read-all', { method: 'PUT' });
    setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const getEntityLink = (type, entityId) => {
    if (type === 'booking') return `/bookings/${entityId}`;
    if (type === 'car') return `/cars/${entityId}`;
    return '#';
  };

  const getTypeStyles = (type) => {
    switch (type) {
      case 'overdue': return 'border-red-100 bg-red-50 text-red-900';
      case 'expiring': return 'border-yellow-100 bg-yellow-50 text-yellow-900';
      default: return 'border-blue-100 bg-blue-50 text-blue-900';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'overdue': return AlertCircle;
      case 'expiring': return Clock;
      default: return Info;
    }
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading notifications...</div>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Stay updated on bookings and alerts.</p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline" size="sm">
            <Check className="mr-2 h-4 w-4" /> Mark All Read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-xl">
          <Bell className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const Icon = getTypeIcon(n.type);
            return (
              <Card key={n.id} className={cn("transition-all", n.is_read ? 'opacity-60 bg-white' : getTypeStyles(n.type))}>
                <CardContent className="p-4 flex gap-4 items-start">
                  <div className={cn("p-2 rounded-full bg-white/50")}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{n.title}</h3>
                    <p className="text-sm mt-1 mb-2 opacity-90">{n.message}</p>
                    <div className="flex justify-between items-center text-xs opacity-70">
                      <span>{new Date(n.created_at).toLocaleString()}</span>
                      {n.entity_id && (
                        <Link to={getEntityLink(n.entity_type, n.entity_id)} className="underline hover:opacity-100">
                          View Details
                        </Link>
                      )}
                    </div>
                  </div>
                  {!n.is_read && (
                    <Button variant="ghost" size="icon" onClick={() => markAsRead(n.id)} title="Mark as read" className="h-8 w-8">
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
