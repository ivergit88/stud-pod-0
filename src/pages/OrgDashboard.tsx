import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { getTaskFormatLabel } from '../lib/tasks';

export const OrgDashboard: React.FC = () => {
  const { user } = useAuth();
  const { tasks, responses, events } = useData();

  if (!user || user.role !== 'organization') {
    return <div>Доступ запрещен</div>;
  }

  const orgTasks = useMemo(
    () => tasks.filter((task) => task.organizationId === user.id),
    [tasks, user.id],
  );
  const orgEvents = useMemo(
    () => events.filter((event) => event.organizationId === user.id),
    [events, user.id],
  );

  const tasksNeedingReview = orgTasks.filter((task) =>
    responses.some((response) => response.taskId === task.id && response.status === 'submitted'),
  );
  const recentTasks = [...orgTasks]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);
  const upcomingEvents = [...orgEvents]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50 to-white p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Кабинет организации</h1>
            <p className="mt-2 text-gray-600">{user.name}</p>
            <p className="mt-3 max-w-2xl text-sm text-gray-600">
              Здесь собраны текущие публикации, задачи на проверке и ближайшие мероприятия.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/организация/задачи/новая"
              className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-4 py-2.5 font-medium text-white hover:bg-blue-800 transition-colors"
            >
              <Plus className="mr-2 h-4 w-4" />
              Создать задачу
            </Link>
            <Link
              to="/организация/мероприятия/новое"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Создать мероприятие
            </Link>
          </div>
        </div>
      </div>

      {user.status === 'moderation' && (
        <div className="a11y-accent-card rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-base font-medium leading-7 text-amber-900">
          Заявка организации находится на модерации. В пилотной версии это не мешает работе, а на
          следующем этапе публикации будут подтверждаться администратором вручную.
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Активные задачи</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {orgTasks.filter((task) => task.status === 'open' || task.status === 'in_progress' || task.status === 'review').length}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Требуют проверки</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{tasksNeedingReview.length}</div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Завершено задач</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {orgTasks.filter((task) => task.status === 'completed').length}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Мероприятий</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{orgEvents.length}</div>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.55fr_1fr]">
        <section className="rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
            <h2 className="text-xl font-bold text-gray-900">Последние задачи</h2>
            <Link to="/организация/задачи" className="text-sm font-medium text-blue-600 hover:text-blue-800">
              Открыть управление публикациями
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentTasks.length > 0 ? (
              recentTasks.map((task) => {
                const responsesCount = responses.filter((response) => response.taskId === task.id).length;

                return (
                  <div key={task.id} className="p-6">
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                        {task.category}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          task.format === 'online'
                            ? 'bg-blue-50 text-blue-700'
                            : task.format === 'hybrid'
                              ? 'bg-violet-50 text-violet-700'
                              : 'bg-orange-50 text-orange-700'
                        }`}
                      >
                        {getTaskFormatLabel(task.format)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900">
                          <Link to={`/организация/задачи/${task.id}`} className="hover:text-blue-600">
                            {task.title}
                          </Link>
                        </h3>
                        <p className="mt-2 line-clamp-2 text-sm text-gray-600">{task.description}</p>
                      </div>
                      <div className="text-sm text-gray-500">
                        <div>Откликов: {responsesCount}</div>
                        <div className="mt-1">Дедлайн: {new Date(task.deadline).toLocaleDateString('ru-RU')}</div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-10 text-center text-gray-500">
                <p>У организации пока нет задач.</p>
                <Link
                  to="/организация/задачи/новая"
                  className="mt-4 inline-flex items-center rounded-xl bg-blue-50 px-4 py-2 font-medium text-blue-700 hover:bg-blue-100"
                >
                  Создать первую задачу
                </Link>
              </div>
            )}
          </div>
        </section>

        <div className="grid gap-8">
          <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Что требует внимания</h2>
            {tasksNeedingReview.length > 0 ? (
              <div className="space-y-3">
                {tasksNeedingReview.slice(0, 3).map((task) => (
                  <Link
                    key={task.id}
                    to={`/организация/задачи/${task.id}`}
                    className="block rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 hover:bg-amber-100 transition-colors"
                  >
                    <div className="text-sm font-semibold text-amber-900">{task.title}</div>
                    <div className="mt-1 text-xs text-amber-700">Студент отправил работу на проверку</div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Сейчас нет задач, которые ждут проверки.</p>
            )}
          </section>

          <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Ближайшие мероприятия</h2>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                    <div className="font-semibold text-gray-900">{event.title}</div>
                    <div className="mt-1 text-sm text-gray-500">
                      {new Date(event.date).toLocaleDateString('ru-RU')} • {event.registrationsCount} регистраций
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Ближайших мероприятий пока нет.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
