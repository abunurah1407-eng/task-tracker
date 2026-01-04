import { useState, useEffect } from 'react';
import { Notification } from '../types';
import { api } from '../services/api';
import { Bell, X, Check } from 'lucide-react';

interface NotificationPanelProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationPanel({ userId, isOpen, onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, userId]);

  const loadNotifications = async () => {
    try {
      const [all, unreadData] = await Promise.all([
        api.getNotifications(),
        api.getUnreadCount(),
      ]);
      setNotifications(all.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
      setUnreadCount(unreadData.count);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationAsRead(id);
      await loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      await loadNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Bell className="text-indigo-600" size={24} />
            <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Mark all as read
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No notifications</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    notification.read
                      ? 'bg-gray-50 border-gray-200'
                      : 'bg-indigo-50 border-indigo-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-800">
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date((notification as any).created_at || notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="text-indigo-600 hover:text-indigo-700 transition-colors"
                        title="Mark as read"
                      >
                        <Check size={20} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

