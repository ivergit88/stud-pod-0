import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { getTaskFormatLabel } from '../lib/tasks';

export const OrgManagement: React.FC = () => {
  const { user } = useAuth();
  const { tasks, responses, events, deleteTask, deleteEvent } = useData();
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  if (!user || user.role !== 'organization') {
    return <div>Доступ запрещен</div>;
  }

  const orgTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.organizationId === user.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [tasks, user.id],
  );
  const executableTasks = useMemo(
    () => orgTasks.filter((task) => task.taskKind !== 'parent'),
    [orgTasks],
  );
  const rootTasks = useMemo(
    () => orgTasks.filter((task) => task.taskKind !== 'subtask'),
    [orgTasks],
  );
  const childTasksByParentId = useMemo(() => {
    const next = new Map<string, typeof orgTasks>();

    for (const task of orgTasks) {
      if (!task.parentTaskId) {
        continue;
      }

      const current = next.get(task.parentTaskId) || [];
      current.push(task);
      next.set(task.parentTaskId, current);
    }

    for (const [parentId, items] of next.entries()) {
      next.set(
        parentId,
        [...items].sort((a, b) => {
          if (a.childOrder !== b.childOrder) {
            return a.childOrder - b.childOrder;
          }

          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }),
      );
    }

    return next;
  }, [orgTasks]);

  const orgEvents = useMemo(
    () =>
      events
        .filter((event) => event.organizationId === user.id)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [events, user.id],
  );

  const handleDeleteTask = async (taskId: string, title: string) => {
    const shouldDelete = window.confirm(`Удалить задачу "${title}"? Это действие нельзя отменить.`);
    if (!shouldDelete) {
      return;
    }

    setDeletingTaskId(taskId);
    try {
      await deleteTask(taskId);
      alert('Задача удалена.');
    } catch (error) {
      console.error('Failed to delete task:', error);
      alert('Не удалось удалить задачу. Если по ней уже есть отклики, удаление запрещено.');
    } finally {
      setDeletingTaskId(null);
    }
  };

  const handleDeleteEvent = async (eventId: string, title: string) => {
    const shouldDelete = window.confirm(`Удалить мероприятие "${title}"? Это действие нельзя отменить.`);
    if (!shouldDelete) {
      return;
    }

    setDeletingEventId(eventId);
    try {
      await deleteEvent(eventId);
      alert('Мероприятие удалено.');
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert('Не удалось удалить мероприятие.');
    } finally {
      setDeletingEventId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Управление публикациями</h1>
          <p className="mt-2 text-gray-600">
            Здесь собраны все ваши задачи и мероприятия: редактирование, статусы и контроль откликов.
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

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Всего задач</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{executableTasks.length}</div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-gray-500">На проверке</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {executableTasks.filter((task) => responses.some((response) => response.taskId === task.id && response.status === 'submitted')).length}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Мероприятий</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{orgEvents.length}</div>
        </div>
      </div>

      <section className="rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="text-xl font-bold text-gray-900">Задачи</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {rootTasks.length > 0 ? (
            rootTasks.map((task) => {
              const childTasks = childTasksByParentId.get(task.id) || [];
              const taskResponses = responses.filter((response) => response.taskId === task.id);
              const isProject = task.taskKind === 'parent' || childTasks.length > 0;
              const canEditTask = task.status === 'open' && task.taskKind !== 'parent';
              const canDeleteTask = task.status === 'open' && taskResponses.length === 0 && childTasks.length === 0;
              const isDeleting = deletingTaskId === task.id;

              return (
                <div key={task.id} className="p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="mb-3 flex flex-wrap gap-2">
                        <span className="a11y-org-badge a11y-force-accent rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                          {task.category}
                        </span>
                        {isProject && (
                          <span className="a11y-org-badge a11y-force-accent rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                            Проект с подзадачами
                          </span>
                        )}
                        <span
                          className={`a11y-org-badge a11y-force-accent rounded-full px-3 py-1 text-xs font-medium ${
                            task.format === 'online'
                              ? 'bg-blue-50 text-blue-700'
                              : task.format === 'hybrid'
                                ? 'bg-violet-50 text-violet-700'
                                : 'bg-orange-50 text-orange-700'
                          }`}
                        >
                          {getTaskFormatLabel(task.format)}
                        </span>
                        <span className="a11y-org-badge a11y-force-accent rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                          {task.status === 'open'
                            ? 'Опубликована'
                            : task.status === 'in_progress'
                              ? 'В работе'
                              : task.status === 'review'
                                ? 'На проверке'
                                : task.status === 'completed'
                                  ? 'Завершена'
                                  : 'Отменена'}
                        </span>
                        <span className="a11y-task-points a11y-force-accent rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                          {isProject ? `${task.pointsReward} баллов суммарно` : `${task.pointsReward} баллов`}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        <Link to={`/организация/задачи/${task.id}`} className="hover:text-blue-600">
                          {task.title}
                        </Link>
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm text-gray-600">{task.description}</p>
                      <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-500">
                        {isProject ? (
                          <>
                            <span className="a11y-task-chip a11y-force-accent rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                              Подзадач: {childTasks.length}
                            </span>
                            <span className="a11y-task-chip a11y-force-accent rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                              Завершено: {childTasks.filter((item) => item.status === 'completed').length}
                            </span>
                          </>
                        ) : (
                          <span className="a11y-task-chip a11y-force-accent rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                            Откликов: {taskResponses.length}
                          </span>
                        )}
                        <span className="a11y-task-chip a11y-force-accent rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                          Дедлайн: {new Date(task.deadline).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {canEditTask && (
                        <Link
                          to={`/организация/задачи/${task.id}/редактировать`}
                          className="inline-flex items-center rounded-xl bg-blue-50 px-4 py-2 font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Изменить
                        </Link>
                      )}
                      {canDeleteTask && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id, task.title)}
                          disabled={isDeleting}
                          className="inline-flex items-center rounded-xl bg-red-50 px-4 py-2 font-medium text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {isDeleting ? 'Удаление...' : 'Удалить'}
                        </button>
                      )}
                      <Link
                        to={`/организация/задачи/${task.id}`}
                        className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Открыть
                      </Link>
                    </div>
                  </div>

                  {childTasks.length > 0 && (
                    <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <div className="mb-3 text-sm font-semibold text-gray-900">Подзадачи проекта</div>
                      <div className="space-y-3">
                        {childTasks.map((childTask) => {
                          const childResponsesCount = responses.filter(
                            (response) => response.taskId === childTask.id,
                          ).length;

                          return (
                            <div
                              key={childTask.id}
                              className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-4 md:flex-row md:items-start md:justify-between"
                            >
                              <div className="min-w-0">
                                <Link
                                  to={`/организация/задачи/${childTask.id}`}
                                  className="text-sm font-semibold text-gray-900 hover:text-blue-600"
                                >
                                  {childTask.title}
                                </Link>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <span className="a11y-org-badge a11y-force-accent rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                                    {childTask.category}
                                  </span>
                                  <span className="a11y-org-badge a11y-force-accent rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                                    {childTask.status === 'open'
                                      ? 'Опубликована'
                                      : childTask.status === 'in_progress'
                                        ? 'В работе'
                                        : childTask.status === 'review'
                                          ? 'На проверке'
                                          : childTask.status === 'completed'
                                            ? 'Завершена'
                                            : 'Отменена'}
                                  </span>
                                  <span className="a11y-task-points a11y-force-accent rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                    {childTask.pointsReward} баллов
                                  </span>
                                </div>
                                <div className="mt-2 text-xs text-gray-500">
                                  Откликов: {childResponsesCount} • Дедлайн: {new Date(childTask.deadline).toLocaleDateString('ru-RU')}
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {childTask.status === 'open' && (
                                  <Link
                                    to={`/организация/задачи/${childTask.id}/редактировать`}
                                    className="inline-flex items-center rounded-xl bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                                  >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Изменить
                                  </Link>
                                )}
                                <Link
                                  to={`/организация/задачи/${childTask.id}`}
                                  className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  Открыть
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-10 text-center text-gray-500">
              У организации пока нет задач.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="text-xl font-bold text-gray-900">Мероприятия</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {orgEvents.length > 0 ? (
            orgEvents.map((event) => {
              const isDeleting = deletingEventId === event.id;

              return (
                <div key={event.id} className="p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="mb-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                          Мероприятие
                        </span>
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                          {new Date(event.date).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm text-gray-600">{event.description}</p>
                      <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
                        <span>{event.location}</span>
                        <span>Записей: {event.registrationsCount}</span>
                        <span>Баллы: {event.pointsReward}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        to={`/организация/мероприятия/${event.id}/редактировать`}
                        className="inline-flex items-center rounded-xl bg-blue-50 px-4 py-2 font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Изменить
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(event.id, event.title)}
                        disabled={isDeleting}
                        className="inline-flex items-center rounded-xl bg-red-50 px-4 py-2 font-medium text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {isDeleting ? 'Удаление...' : 'Удалить'}
                      </button>
                      <Link
                        to="/мероприятия"
                        className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Список мероприятий
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-10 text-center text-gray-500">
              У организации пока нет мероприятий.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
