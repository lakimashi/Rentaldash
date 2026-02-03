import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function Header() {
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
    <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-4">
        <Link to="/notifications" className="relative">
          <svg className="w-6 h-6 text-gray-600 hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-2-5.83l2.303-4.36a6.002 6.002 0 01-1.649-5.27l-5.514-3.404a2 2 0 00-2.66-1.832l-1.405-1.405a2 2 0 01-1.649-2.649 5.988-5.988a2 2 0 010-2.66 1.653 5.487-5.487a2 2 0 011.653 2.649l1.405 1.405a2 2 0 012.66-1.649 4.36 6.002 0 015.83-2V11a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
        <span className="text-sm text-gray-600">{user?.email}</span>
        <span className="text-xs text-gray-400">({user?.role})</span>
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
