import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { YMaps } from '@pbe/react-yandex-maps';
import { Calendar, Image as ImageIcon, MapPin, Medal } from 'lucide-react';
import { AddressInput } from '../components/AddressInput';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

const EVENT_POINTS_MIN = 10;
const EVENT_POINTS_MAX = 80;

const toDateTimeLocalValue = (value: string) => {
  if (!value) {
    return '';
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value.slice(0, 16);
  }

  const localTime = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60_000);
  return localTime.toISOString().slice(0, 16);
};

export const CreateEvent: React.FC = () => {
  const { user } = useAuth();
  const { events, loading, addEvent, updateEvent } = useData();
  const navigate = useNavigate();
  const { id: eventId } = useParams<{ id: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = Boolean(eventId);
  const existingEvent = isEditMode ? events.find((event) => event.id === eventId) : undefined;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    coordinates: undefined as [number, number] | undefined,
    pointsReward: 40,
    imageUrl: '',
  });

  useEffect(() => {
    if (!existingEvent) {
      return;
    }

    setFormData({
      title: existingEvent.title,
      description: existingEvent.description,
      date: toDateTimeLocalValue(existingEvent.date),
      location: existingEvent.location,
      coordinates: existingEvent.coordinates,
      pointsReward: Math.min(
        EVENT_POINTS_MAX,
        Math.max(EVENT_POINTS_MIN, existingEvent.pointsReward),
      ),
      imageUrl: existingEvent.imageUrl || '',
    });
  }, [existingEvent]);

  if (!user || user.role !== 'organization') {
    return <div>Доступ запрещен</div>;
  }

  if (isEditMode && loading) {
    return <div>Загрузка мероприятия...</div>;
  }

  if (isEditMode && !existingEvent) {
    return <div>Мероприятие не найдено</div>;
  }

  if (existingEvent && existingEvent.organizationId !== user.id) {
    return <div>Доступ запрещен</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (
        formData.pointsReward < EVENT_POINTS_MIN ||
        formData.pointsReward > EVENT_POINTS_MAX
      ) {
        alert(`Для мероприятия можно указать от ${EVENT_POINTS_MIN} до ${EVENT_POINTS_MAX} баллов.`);
        setIsSubmitting(false);
        return;
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        location: formData.location,
        coordinates: formData.coordinates,
        pointsReward: Number(formData.pointsReward),
        imageUrl: formData.imageUrl,
      };

      if (isEditMode && eventId) {
        await updateEvent(eventId, payload);
      } else {
        await addEvent({
          ...payload,
          organizationId: user.id,
          organizationName: user.name || '',
        });
      }

      navigate('/мероприятия');
    } catch (error) {
      console.error(isEditMode ? 'Error updating event:' : 'Error creating event:', error);
      alert(
        isEditMode
          ? 'Произошла ошибка при обновлении мероприятия.'
          : 'Произошла ошибка при создании мероприятия.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const mapsApiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY || '';
  const suggestApiKey = import.meta.env.VITE_YANDEX_MAPS_SUGGEST_API_KEY || mapsApiKey;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? 'Редактировать мероприятие' : 'Создать мероприятие'}
        </h1>
        <p className="mt-2 text-gray-600">
          {isEditMode
            ? 'Обновите дату, место и баллы, чтобы карточка события и карта были актуальными.'
            : 'Публикуйте очные события аккуратно: карта и список сразу используют эти данные.'}
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Название мероприятия *
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
              placeholder="Например: Мастер-класс по дизайну"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Описание *
            </label>
            <textarea
              id="description"
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
              placeholder="Подробно опишите, что будет на мероприятии..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Дата и время *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="datetime-local"
                  id="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="pointsReward" className="block text-sm font-medium text-gray-700 mb-1">
                Баллы за участие *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Medal className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  id="pointsReward"
                  required
                  min={EVENT_POINTS_MIN}
                  max={EVENT_POINTS_MAX}
                  value={formData.pointsReward}
                  onChange={(e) => setFormData({ ...formData, pointsReward: Number(e.target.value) })}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Для мероприятий доступно от {EVENT_POINTS_MIN} до {EVENT_POINTS_MAX} баллов.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm text-gray-700">
            Для мероприятий действует более узкий диапазон, чем для задач. Логика такая: задача
            даёт баллы за готовый измеримый результат, а мероприятие - за участие и вовлечение.
            Поэтому верхняя граница здесь ниже и не конкурирует с задачами, где требуется готовый результат.
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Место проведения *
            </label>
            <YMaps
              query={{
                apikey: mapsApiKey,
                suggest_apikey: suggestApiKey,
                lang: 'ru_RU',
                load: 'package.full',
              }}
            >
              <AddressInput
                value={formData.location}
                onChange={(value, coords) =>
                  setFormData((prev) => ({
                    ...prev,
                    location: value,
                    coordinates: coords,
                  }))
                }
                placeholder="Укажите точный адрес проведения мероприятия"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
              />
            </YMaps>
            <div className="mt-2 flex items-start text-xs text-gray-500">
              <MapPin className="mt-0.5 mr-1.5 h-3.5 w-3.5 flex-shrink-0" />
              Карта использует этот адрес напрямую, поэтому лучше выбирать точку из подсказок.
            </div>
          </div>

          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Ссылка на обложку
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ImageIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="url"
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm text-gray-700">
            После публикации мероприятие сразу появится в списке и на карте, если адрес удалось
            определить. Для этого мы сохраняем и текст адреса, и координаты.
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate('/мероприятия')}
              className="w-full rounded-xl border border-gray-300 px-6 py-3 text-center font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-blue-700 px-6 py-3 text-center font-medium text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {isSubmitting
                ? isEditMode
                  ? 'Сохранение...'
                  : 'Создание...'
                : isEditMode
                  ? 'Сохранить изменения'
                  : 'Создать мероприятие'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
