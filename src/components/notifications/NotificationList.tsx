import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Notification } from '../../types';
import { Card, Button, Badge, LoadingSpinner, EmptyState } from '../common/StatusBadge';
import { Bell, Check, Trash2, ShoppingCart, Package, AlertTriangle, DollarSign, Info, FileText } from 'lucide-react';

// Helper to check if notification is read (handles both field names)
const isNotificationRead = (notification: Notification) => {
  return notification.is_read ?? notification.isRead ?? false;
};

export default function NotificationList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await apiService.getNotifications({ unread_only: false });
      console.log('📦 Notifications response:', response);

      // ✅ Handle paginated response (content array) and other formats
      let data: any[] = [];
      if (response?.content && Array.isArray(response.content)) {
        data = response.content;
      } else if (response?.data?.content && Array.isArray(response.data.content)) {
        data = response.data.content;
      } else if (response?.data && Array.isArray(response.data)) {
        data = response.data;
      } else if (Array.isArray(response)) {
        data = response;
      }

      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    }
    setIsLoading(false);
  };

  const handleNotificationClick = async (notification: Notification) => {
    console.log('🔔 Notification clicked:', notification);

    const refId = notification.reference_id || notification.referenceId || notification.referenceID;
    const type = notification.type || notification.notificationType;

    // Check if already read using the helper
    const isRead = isNotificationRead(notification);

    if (!isRead) {
      // Optimistically mark as read
      setNotifications(prev =>
        prev.map(n =>
          n.id === notification.id ? { ...n, is_read: true, isRead: true } : n
        )
      );

      try {
        await apiService.markNotificationRead(notification.id);
        await fetchNotifications();
        // ✅ Dispatch event after successful fetch to update sidebar/header
        window.dispatchEvent(new CustomEvent('notification-read'));
      } catch (error) {
        console.error('Error marking notification read:', error);
        await fetchNotifications();
        // Optionally dispatch event even on error (to refresh the badge)
        // window.dispatchEvent(new CustomEvent('notification-read'));
      }
    }

    console.log('🔍 type:', type, 'refId:', refId);

    if (refId) {
      switch (type) {
        case 'order':
          navigate(`/orders?orderId=${refId}`);
          break;
        case 'invoice':
          navigate(`/invoices?invoiceId=${refId}`);
          break;
        case 'dispatch':
          navigate(`/dispatches?dispatchId=${refId}`);
          break;
        case 'payment':
          navigate(`/payments?paymentId=${refId}`);
          break;
        case 'rejection':
          navigate(`/rejections?rejectionId=${refId}`);
          break;
        case 'production':
          navigate(`/production?productionId=${refId}`);
          break;
        default:
          navigate(`/${type}s` || '/notifications');
      }
    } else {
      if (type) {
        navigate(`/${type}s`);
      } else {
        navigate('/notifications');
      }
    }
  };

  const markAsRead = async (id: string) => {
    try {
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true, isRead: true } : n)
      );
      await apiService.markNotificationRead(id);
      await fetchNotifications();
      window.dispatchEvent(new CustomEvent('notification-read'));
    } catch (error) {
      console.error('Error marking notification read:', error);
      await fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, isRead: true }))
      );
      await apiService.markAllNotificationsRead();
      await fetchNotifications();
      window.dispatchEvent(new CustomEvent('notification-read'));
    } catch (error) {
      console.error('Error marking all notifications read:', error);
      await fetchNotifications();
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
      await apiService.deleteNotification(id);
      window.dispatchEvent(new CustomEvent('notification-read'));
    } catch (error) {
      console.error('Error deleting notification:', error);
      await fetchNotifications();
    }
  };

  const getIcon = (type?: string) => {
    switch (type) {
      case 'order': return ShoppingCart;
      case 'dispatch': return Package;
      case 'payment': return DollarSign;
      case 'rejection': return AlertTriangle;
      case 'invoice': return FileText;
      case 'production': return Package;
      default: return Info;
    }
  };

  const getIconColor = (type?: string) => {
    switch (type) {
      case 'order': return 'bg-blue-100 text-blue-600';
      case 'dispatch': return 'bg-emerald-100 text-emerald-600';
      case 'payment': return 'bg-amber-100 text-amber-600';
      case 'rejection': return 'bg-red-100 text-red-600';
      case 'invoice': return 'bg-purple-100 text-purple-600';
      case 'production': return 'bg-indigo-100 text-indigo-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const formatTime = (date: string) => {
    if (!date) return 'N/A';
    const now = new Date();
    const notificationDate = new Date(date);
    const diffMs = now.getTime() - notificationDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // ✅ Use the helper to check if a notification is read
  const unreadCount = notifications.filter(n => !isNotificationRead(n)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <Check className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      <Card>
        {notifications.length === 0 ? (
          <EmptyState message="No notifications" />
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notification) => {
              const Icon = getIcon(notification.type);
              const isRead = isNotificationRead(notification);
              return (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                    !isRead ? 'bg-blue-50/50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${getIconColor(notification.type)}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium truncate ${!isRead ? 'text-slate-900' : 'text-slate-600'}`}>
                            {notification.title}
                          </p>
                          {notification.message && (
                            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{notification.message}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-slate-400 whitespace-nowrap">
                            {formatTime(notification.created_at || notification.createdAt)}
                          </span>
                          {!isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {!isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Mark read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}