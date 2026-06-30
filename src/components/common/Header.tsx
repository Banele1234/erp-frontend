import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bell, LogOut, UserCircle, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiService } from '../../lib/api';

export default function Header() {
  const { user, customer, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = async () => {
    if (!user) {
      console.log('🔔 Header: No user, skipping fetch');
      return;
    }
    try {
      console.log('🔔 Header: Fetching unread count...');
      const res = await apiService.getNotifications({ unread_only: true });
      console.log('🔔 Header: Raw response:', res);

      // ✅ Extract notifications from paginated or array response
      let data: any[] = [];
      if (res?.content && Array.isArray(res.content)) {
        data = res.content;
      } else if (res?.data?.content && Array.isArray(res.data.content)) {
        data = res.data.content;
      } else if (res?.data && Array.isArray(res.data)) {
        data = res.data;
      } else if (Array.isArray(res)) {
        data = res;
      }

      // ✅ Client‑side filter: only count unread notifications
      const unread = data.filter(n => {
        const isRead = n.isRead ?? n.is_read ?? true;
        return !isRead;
      });

      const count = unread.length;
      console.log('🔔 Header: Unread count =', count);
      setUnreadCount(count);
    } catch (e) {
      console.error('Header: Failed to fetch unread count:', e);
    }
  };

  useEffect(() => {
    fetchUnread();

    const handleNotificationRead = () => {
      console.log('🔔 Header: notification-read event received');
      fetchUnread();
    };
    window.addEventListener('notification-read', handleNotificationRead);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUnread();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const interval = setInterval(fetchUnread, 30000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notification-read', handleNotificationRead);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  const roleLabels: Record<string, string> = {
    admin: 'Administrator',
    management: 'Management',
    warehouse_staff: 'Warehouse Staff',
    customer: 'Customer',
    production: 'Production',
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="font-semibold text-slate-800">Auto Ancillaries Limited</h2>
          <p className="text-xs text-slate-500">ERP & Inventory Management System</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link
          to="/notifications"
          className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user?.full_name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="text-left hidden md:block">
              <p className="font-medium text-slate-800 text-sm">{user?.full_name}</p>
              <p className="text-xs text-slate-500">
                {customer?.company_name || roleLabels[user?.role || '']}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="font-medium text-slate-800">{user?.full_name}</p>
                  <p className="text-sm text-slate-500">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {roleLabels[user?.role || '']}
                  </span>
                </div>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50"
                  onClick={() => setShowDropdown(false)}
                >
                  <UserCircle className="w-4 h-4" />
                  Profile
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 w-full"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}