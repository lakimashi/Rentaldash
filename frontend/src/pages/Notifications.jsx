import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

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

  const getTypeColor = (type) => {
    const colors = {
      overdue: 'bg-red-100 text-red-800 border-red-200',
      expiring: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      system: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getEntityLink = (type, entityId) => {
    if (type === 'booking') return `/bookings/${entityId}`;
    if (type === 'car') return `/cars/${entityId}`;
    return '#';
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
        {unreadCount > 0 && (
          <button type="button" onClick={markAllAsRead} className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm">
            Mark All as Read ({unreadCount})
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
          No notifications yet.
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div key={n.id} className={`bg-white border rounded-lg p-4 ${n.is_read ? 'border-gray-200 opacity-75' : getTypeColor(n.type)}`}>
              <div className="flex justify-between items-start mb-2">
                <h3 className={`text-lg font-medium ${n.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                  {n.title}
                </h3>
                {!n.is_read && (
                  <button onClick={() => markAsRead(n.id)} className="text-sm text-blue-600 hover:underline">
                    Mark as read
                  </button>
                )}
              </div>
              <p className={`text-sm mb-2 ${n.is_read ? 'text-gray-600' : 'text-gray-800'}`}>
                {n.message}
              </p>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{new Date(n.created_at).toLocaleString()}</span>
                {n.entity_id && (
                  <Link to={getEntityLink(n.entity_type, n.entity_id)} className="text-gray-600 hover:underline">
                    View {n.entity_type}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
