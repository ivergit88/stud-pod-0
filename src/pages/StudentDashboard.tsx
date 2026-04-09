import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Link } from 'react-router-dom';
import { Briefcase, Clock, CheckCircle, Star, ChevronRight } from 'lucide-react';
import { getTaskHref, getTaskFormatLabel } from '../lib/tasks';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { tasks, responses } = useData();

  if (!user || user.role !== 'student') {
    return <div>Доступ запрещен</div>;
  }

  const studentResponses = responses.filter(r => r.studentId === user.id);
  const activeTasksCount = studentResponses.filter(
    r =>
      r.status === 'pending' ||
      r.status === 'accepted' ||
      r.status === 'submitted' ||
      r.status === 'needs_revision',
  ).length;
  const completedTasksCount = studentResponses.filter(r => r.status === 'completed').length;
  
  // Get recent active tasks
  const activeResponses = studentResponses
    .filter(
      r =>
        r.status === 'pending' ||
        r.status === 'accepted' ||
        r.status === 'submitted' ||
        r.status === 'needs_revision',
    )
    .slice(0, 3);

  const activeTasksDetails = activeResponses
    .map(r => {
      const task = tasks.find(t => t.id === r.taskId);
      return { ...r, task };
    })
    .filter(r => r.task)
    .sort((a, b) =>
      new Date(a.task!.deadline).getTime() - new Date(b.task!.deadline).getTime(),
    );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Личный кабинет студента</h1>
        <p className="mt-2 text-gray-600">Добро пожаловать, {user.name}!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 mr-4">
            <Star className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Накоплено баллов</p>
            <p className="text-2xl font-bold text-gray-900">{user.points || 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 mr-4">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Задач в работе</p>
            <p className="text-2xl font-bold text-gray-900">{activeTasksCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 rounded-xl bg-green-50 text-green-600 mr-4">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Выполнено задач</p>
            <p className="text-2xl font-bold text-gray-900">{completedTasksCount}</p>
          </div>
        </div>
      </div>

      <Link
        to="/магазин"
        className="mb-8 flex items-center justify-between rounded-2xl bg-blue-700 px-5 py-4 text-white shadow-sm md:hidden"
      >
        <div>
          <div className="text-sm text-blue-100">Баллы и награды</div>
          <div className="mt-1 text-lg font-bold">Обменять баллы</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{user.points || 0}</div>
          <div className="text-xs text-blue-100">доступно</div>
        </div>
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.7fr_1fr]">
        <div className="space-y-8">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Мои текущие задачи</h2>
              <Link to="/задачи" className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center">
                Все задачи <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {activeTasksDetails.length > 0 ? (
                activeTasksDetails.map((item) => (
                  <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                        <Link to={getTaskHref(item.task!)} className="hover:text-blue-600">
                          {item.task?.title}
                        </Link>
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.status === 'pending' || item.status === 'accepted' ? 'bg-amber-100 text-amber-800' :
                        item.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                        item.status === 'needs_revision' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status === 'pending' || item.status === 'accepted' ? 'В работе' :
                         item.status === 'submitted' ? 'На проверке' :
                         item.status === 'needs_revision' ? 'Доработка' : 'Неизвестно'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.task?.description}</p>
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                      <div className="flex items-center text-gray-500">
                        <Briefcase className="w-4 h-4 mr-1.5" />
                        {item.task?.organizationName}
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            item.task?.format === 'online'
                              ? 'bg-blue-50 text-blue-700'
                              : item.task?.format === 'hybrid'
                                ? 'bg-violet-50 text-violet-700'
                                : 'bg-orange-50 text-orange-700'
                          }`}
                        >
                          {getTaskFormatLabel(item.task?.format)}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            Math.ceil((new Date(item.task!.deadline).getTime() - Date.now()) / (24 * 60 * 60 * 1000)) <= 3
                              ? 'bg-red-50 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          Дедлайн: {new Date(item.task!.deadline).toLocaleDateString('ru-RU')}
                        </span>
                        <div className="font-medium text-blue-600">
                          +{item.task?.pointsReward} баллов
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <p>У вас пока нет активных задач.</p>
                  <Link to="/задачи" className="mt-4 inline-block px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100">
                    Найти задачу
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 p-6 text-white shadow-sm md:block">
            <h2 className="text-xl font-bold text-white">Обменяйте баллы</h2>
            <p className="mt-3 text-sm leading-6 text-blue-100">
              У вас {user.points || 0} баллов. Их можно потратить на сувенирную продукцию и
              брендированную одежду в магазине платформы.
            </p>
            <div className="mt-6 rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-blue-100">Доступно сейчас</div>
              <div className="mt-2 text-3xl font-bold text-white">{user.points || 0}</div>
            </div>
            <Link
              to="/магазин"
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-white py-3 font-medium text-blue-800 hover:bg-blue-50 transition-colors"
            >
              Перейти в магазин
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
