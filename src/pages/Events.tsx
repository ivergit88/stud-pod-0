import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Trophy,
  Users,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export const Events: React.FC = () => {
  const { events, eventRegistrations, registerForEvent, deleteEvent } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [registeringEventId, setRegisteringEventId] = useState<string | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  const handleRegister = async (eventId: string) => {
    if (!user) {
      navigate('/вход');
      return;
    }
    if (user.role !== 'student') {
      alert('Только студенты могут записываться на мероприятия.');
      return;
    }

    setRegisteringEventId(eventId);
    try {
      await registerForEvent(eventId);
      alert('Вы успешно записаны на мероприятие!');
    } catch (error) {
      console.error('Failed to register for event:', error);
      alert('Произошла ошибка при записи на мероприятие.');
    } finally {
      setRegisteringEventId(null);
    }
  };

  const handleDelete = async (eventId: string, title: string) => {
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
      <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Мероприятия</h1>
            <p className="mt-2 max-w-2xl text-gray-600">
              Очные события партнёров с понятной географией, временем и прозрачным количеством записавшихся.
            </p>
          </div>
          {user?.role === 'organization' && (
            <Link
              to="/организация/мероприятия/новое"
              className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-4 py-2.5 font-medium text-white hover:bg-blue-800 transition-colors"
            >
              <Plus className="mr-2 h-4 w-4" />
              Создать мероприятие
            </Link>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {events.length > 0 ? (
          events.map((event) => {
            const isRegistered = user
              ? eventRegistrations.some(
                  (registration) =>
                    registration.eventId === event.id && registration.studentId === user.id,
                )
              : false;
            const isRegistering = registeringEventId === event.id;
            const isDeleting = deletingEventId === event.id;
            const canManageEvent = user?.role === 'organization' && user.id === event.organizationId;

            return (
              <article
                key={event.id}
                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div className="relative h-52 overflow-hidden border-b border-gray-200 bg-gray-100">
                  {event.imageUrl ? (
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50 text-green-300">
                      <Calendar className="h-16 w-16" />
                    </div>
                  )}
                  <div className="absolute left-4 top-4 inline-flex items-center rounded-full bg-white/95 px-3 py-1 text-sm font-semibold text-blue-700 shadow-sm">
                    <Trophy className="mr-1.5 h-4 w-4" />
                    {event.pointsReward} баллов
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-4 flex items-center justify-between gap-3 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="mr-1.5 h-4 w-4" />
                      {new Date(event.date).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                      <Users className="mr-1.5 h-3.5 w-3.5" />
                      {event.registrationsCount} записались
                    </div>
                  </div>

                  <h2 className="text-xl font-bold leading-tight text-gray-900">{event.title}</h2>
                  <p className="mt-3 flex-1 text-sm leading-6 text-gray-600">{event.description}</p>

                  <div className="mt-5 space-y-2 text-sm text-gray-500">
                    <div className="flex items-start">
                      <MapPin className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0" />
                      <span className="line-clamp-2">{event.location}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span>Организатор: {event.organizationName}</span>
                    </div>
                  </div>

                  <div className="mt-6">
                    {isRegistered ? (
                      <div className="flex w-full items-center justify-center rounded-xl bg-green-50 py-3 font-medium text-green-700">
                        <CheckCircle className="mr-2 h-5 w-5" />
                        Вы записаны
                      </div>
                    ) : canManageEvent ? (
                      <div className="grid grid-cols-2 gap-3">
                        <Link
                          to={`/организация/мероприятия/${event.id}/редактировать`}
                          className="inline-flex items-center justify-center rounded-xl bg-blue-50 py-3 font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Изменить
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(event.id, event.title)}
                          disabled={isDeleting}
                          className="inline-flex items-center justify-center rounded-xl bg-red-50 py-3 font-medium text-red-700 hover:bg-red-100 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {isDeleting ? 'Удаление...' : 'Удалить'}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleRegister(event.id)}
                        disabled={isRegistering || (user && user.role !== 'student')}
                        className="inline-flex w-full items-center justify-center rounded-xl bg-blue-700 py-3 font-medium text-white hover:bg-blue-800 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isRegistering ? 'Запись...' : 'Записаться на мероприятие'}
                        {!isRegistering && <ArrowRight className="ml-2 h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="col-span-full rounded-3xl border border-gray-200 bg-white py-12 text-center text-gray-500">
            В данный момент нет доступных мероприятий.
          </div>
        )}
      </div>
    </div>
  );
};
