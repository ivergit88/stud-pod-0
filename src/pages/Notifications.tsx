import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Bell, CheckCircle, Clock, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Notifications: React.FC = () => {
  const { user } = useAuth();
  const { notifications, markNotificationAsRead } = useData();
  const navigate = useNavigate();

  if (!user) {
    return <div>Доступ запрещен</div>;
  }

  const userNotifications = notifications
    .filter(n => n.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleOpenNotification = async (id: string, link?: string) => {
    try {
      await markNotificationAsRead(id);
      if (link) {
        navigate(link);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const getIcon = (type?: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'warning':
        return <Clock className="w-6 h-6 text-amber-500" />;
      case 'info':
      default:
        return <Info className="w-6 h-6 text-blue-500" />;
    }
  };

  return (
    <div className="notifications-page mx-auto max-w-4xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-8 flex min-w-0 items-center justify-between">
        <div className="min-w-0">
          <h1 className="flex items-center text-3xl font-bold text-gray-900">
            <Bell className="w-8 h-8 mr-3 text-blue-600" />
            Уведомления
          </h1>
          <p className="mt-2 text-gray-600">История ваших уведомлений и системных сообщений</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {userNotifications.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {userNotifications.map(notification => (
              <div 
                key={notification.id} 
                className={`a11y-notification-card cursor-pointer p-4 transition-colors sm:p-6 ${notification.read ? 'bg-white' : 'bg-blue-50/50'} flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start`}
                onClick={() => handleOpenNotification(notification.id, notification.link)}
              >
                <div className="flex-shrink-0 sm:mr-4 sm:mt-1">
                  {getIcon((notification as any).type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <h3 className={`text-lg font-medium ${notification.read ? 'text-gray-900' : 'text-blue-900 font-bold'}`}>
                      {notification.title}
                    </h3>
                    <span className="text-xs text-gray-500 sm:ml-4 sm:whitespace-nowrap">
                      {new Date(notification.createdAt).toLocaleDateString()} {new Date(notification.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <p className={`text-sm ${notification.read ? 'text-gray-600' : 'text-gray-800'}`}>
                    {notification.message}
                  </p>
                </div>
                {!notification.read && (
                  <div className="flex-shrink-0 sm:ml-4">
                    <span className="a11y-notification-count a11y-force-accent inline-flex min-h-6 items-center justify-center rounded-full bg-blue-600 px-2 text-xs font-semibold text-white">
                      Новое
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нет уведомлений</h3>
            <p className="text-gray-500">У вас пока нет новых уведомлений.</p>
          </div>
        )}
      </div>
    </div>
  );
};
