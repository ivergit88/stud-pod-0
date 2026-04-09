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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
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
                className={`p-6 flex items-start transition-colors cursor-pointer ${notification.read ? 'bg-white' : 'bg-blue-50/50'}`}
                onClick={() => handleOpenNotification(notification.id, notification.link)}
              >
                <div className="flex-shrink-0 mr-4 mt-1">
                  {getIcon((notification as any).type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`text-lg font-medium ${notification.read ? 'text-gray-900' : 'text-blue-900 font-bold'}`}>
                      {notification.title}
                    </h3>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                      {new Date(notification.createdAt).toLocaleDateString()} {new Date(notification.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <p className={`text-sm ${notification.read ? 'text-gray-600' : 'text-gray-800'}`}>
                    {notification.message}
                  </p>
                </div>
                {!notification.read && (
                  <div className="ml-4 flex-shrink-0">
                    <span className="inline-block w-2.5 h-2.5 bg-blue-600 rounded-full"></span>
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
