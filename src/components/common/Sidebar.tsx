import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../lib/api';
import {
  LayoutDashboard,
  Users,
  Package,
  Warehouse,
  ClipboardList,
  FileText,
  CreditCard,
  AlertTriangle,
  Factory,
  Truck,
  Bell,
  Settings,
  UserCircle,
  Users2,
  BarChart3,
} from 'lucide-react';

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'management', 'warehouse_staff', 'production'] },
  { path: '/customers', icon: Users, label: 'Customers', roles: ['admin', 'management'] },
  { path: '/products', icon: Package, label: 'Products', roles: ['admin', 'management', 'warehouse_staff'] },
  { path: '/inventory', icon: Warehouse, label: 'Inventory', roles: ['admin', 'management', 'warehouse_staff'] },
  { path: '/warehouses', icon: Warehouse, label: 'Warehouses', roles: ['admin', 'management'] },
  { path: '/orders', icon: ClipboardList, label: 'Orders', roles: ['admin', 'management', 'warehouse_staff', 'production', 'customer'] },
  { path: '/invoices', icon: FileText, label: 'Invoices', roles: ['admin', 'management', 'warehouse_staff', 'customer'] },
  { path: '/payments', icon: CreditCard, label: 'Payments', roles: ['admin', 'management', 'customer'] },
  { path: '/rejections', icon: AlertTriangle, label: 'Rejections', roles: ['admin', 'management', 'warehouse_staff', 'production'] },
  { path: '/production', icon: Factory, label: 'Production', roles: ['admin', 'management', 'production'] },
  { path: '/dispatches', icon: Truck, label: 'Dispatches', roles: ['admin', 'management', 'warehouse_staff'] },
  { path: '/notifications', icon: Bell, label: 'Notifications', roles: ['admin', 'management', 'warehouse_staff', 'production', 'customer'] },
  { path: '/reports', icon: BarChart3, label: 'Reports', roles: ['admin', 'management'] },
  { path: '/users', icon: Users2, label: 'Users', roles: ['admin'] },
];

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = async () => {
    if (!user) {
      console.log('🔔 Sidebar: No user, skipping fetch');
      return;
    }
    try {
      console.log('🔔 Sidebar: Fetching unread count...');
      const res = await apiService.getNotifications({ unread_only: true });
      console.log('🔔 Sidebar: Raw response:', res);

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
      console.log('🔔 Sidebar: Unread count =', count);
      setUnreadCount(count);
    } catch (e) {
      console.error('Sidebar: Failed to fetch unread count:', e);
    }
  };

  useEffect(() => {
    fetchUnread();

    const handleNotificationRead = () => {
      console.log('🔔 Sidebar: notification-read event received');
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

  const filteredMenu = menuItems.filter(item => user && item.roles.includes(user.role));

  return (
    <aside className="w-64 bg-slate-900 fixed left-0 top-0 bottom-0 flex flex-col">
      <div className="p-4 border-b border-slate-700">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
            <Factory className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">AAL</h1>
            <p className="text-slate-400 text-xs">ERP System</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="px-3 mb-2">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Main Menu</p>
        </div>
        <ul className="space-y-1 px-2">
          {filteredMenu.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const isNotifications = item.path === '/notifications';

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                    {isNotifications && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-700">
        {user?.role === 'admin' && (
          <Link
            to="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </Link>
        )}
        <Link
          to="/profile"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
        >
          <UserCircle className="w-5 h-5" />
          <span className="font-medium">Profile</span>
        </Link>
      </div>
    </aside>
  );
}