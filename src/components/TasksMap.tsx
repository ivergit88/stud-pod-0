import React, { useEffect, useState } from 'react';
import {
  GeolocationControl,
  Map,
  Placemark,
  YMaps,
  ZoomControl,
  useYMaps,
} from '@pbe/react-yandex-maps';
import { type Event, type Task } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { getTaskFormatLabel, getTaskHref, TASK_FORMAT_MAP_COLORS } from '../lib/tasks';

interface TasksMapProps {
  tasks: Task[];
  events: Event[];
}

const DEFAULT_CENTER: [number, number] = [56.3269, 44.0059];
const EVENT_MARKER_COLOR = '#16a34a';

type TaskMarker = Task & {
  markerCoordinates: [number, number];
  markerAddress: string;
};

type EventMarker = Event & {
  markerCoordinates: [number, number];
};

const MapContent: React.FC<TasksMapProps> = ({ tasks, events }) => {
  const ymaps = useYMaps(['geocode']);
  const navigate = useNavigate();
  const [taskMarkers, setTaskMarkers] = useState<TaskMarker[]>([]);
  const [eventMarkers, setEventMarkers] = useState<EventMarker[]>([]);

  useEffect(() => {
    if (!ymaps) {
      return;
    }

    let cancelled = false;

    const geocodeAddress = async (address: string) => {
      const geocodeResult = await (ymaps as any).geocode(address, { results: 1 });
      const firstGeoObject = geocodeResult?.geoObjects?.get(0);
      const rawCoordinates = firstGeoObject?.geometry?.getCoordinates?.();

      if (
        Array.isArray(rawCoordinates) &&
        rawCoordinates.length === 2 &&
        rawCoordinates.every((item) => typeof item === 'number')
      ) {
        return [rawCoordinates[0], rawCoordinates[1]] as [number, number];
      }

      return null;
    };

    const prepareMarkers = async () => {
      const mappedTasks = await Promise.all(
        tasks.map(async (task) => {
          const markerAddress = task.location || task.organizationAddress || '';

          if (!markerAddress) {
            return null;
          }

          if (task.coordinates) {
            return {
              ...task,
              markerCoordinates: task.coordinates,
              markerAddress,
            } satisfies TaskMarker;
          }

          try {
            const markerCoordinates = await geocodeAddress(markerAddress);
            if (!markerCoordinates) {
              return null;
            }

            return {
              ...task,
              markerCoordinates,
              markerAddress,
            } satisfies TaskMarker;
          } catch (error) {
            console.error('Yandex geocode error for task:', task.title, error);
            return null;
          }
        }),
      );

      const mappedEvents = await Promise.all(
        events.map(async (event) => {
          if (!event.location) {
            return null;
          }

          if (event.coordinates) {
            return {
              ...event,
              markerCoordinates: event.coordinates,
            } satisfies EventMarker;
          }

          try {
            const markerCoordinates = await geocodeAddress(event.location);
            if (!markerCoordinates) {
              return null;
            }

            return {
              ...event,
              markerCoordinates,
            } satisfies EventMarker;
          } catch (error) {
            console.error('Yandex geocode error for event:', event.title, error);
            return null;
          }
        }),
      );

      if (!cancelled) {
        setTaskMarkers(mappedTasks.filter(Boolean) as TaskMarker[]);
        setEventMarkers(mappedEvents.filter(Boolean) as EventMarker[]);
      }
    };

    void prepareMarkers();

    return () => {
      cancelled = true;
    };
  }, [events, tasks, ymaps]);

  useEffect(() => {
    const handleBalloonClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-href]');
      if (target?.dataset.href) {
        navigate(target.dataset.href);
      }
    };

    document.addEventListener('click', handleBalloonClick);
    return () => document.removeEventListener('click', handleBalloonClick);
  }, [navigate]);

  return (
    <Map
      defaultState={{ center: DEFAULT_CENTER, zoom: 12 }}
      width="100%"
      height="100%"
      modules={['geoObject.addon.balloon', 'geoObject.addon.hint']}
    >
      <ZoomControl options={{ float: 'right' }} />
      <GeolocationControl options={{ float: 'left' }} />

      {taskMarkers.map((task) => (
        <Placemark
          key={task.id}
          geometry={task.markerCoordinates}
          properties={{
            hintContent: `${task.title} (${getTaskFormatLabel(task.format)})`,
            balloonContentHeader: `<div style="font-weight:700;font-size:16px;margin-bottom:4px;">${task.title}</div>`,
            balloonContentBody: `
              <div style="margin-bottom:8px;">
                <div style="display:inline-block;padding:2px 8px;background-color:#F3F4F6;color:#111827;border-radius:12px;font-size:12px;margin-bottom:8px;">
                  ${task.category}
                </div>
                <div style="margin-top:8px;"><strong>Формат:</strong> ${getTaskFormatLabel(task.format)}</div>
                <div><strong>Организация:</strong> ${task.organizationName}</div>
                <div><strong>Баллы:</strong> ${task.pointsReward}</div>
                <div><strong>Адрес:</strong> ${task.markerAddress}</div>
                ${
                  task.format === 'online'
                    ? '<div style="margin-top:8px;color:#1D4ED8;">Метка показывает учреждение-заказчика, выезд не требуется.</div>'
                    : ''
                }
              </div>
            `,
            balloonContentFooter: `
              <button
                data-href="${getTaskHref(task)}"
                style="background-color:${TASK_FORMAT_MAP_COLORS[task.format]};color:white;border:none;padding:8px 12px;border-radius:10px;cursor:pointer;width:100%;margin-top:8px;"
              >
                Открыть задачу
              </button>
            `,
          }}
          options={{
            preset: 'islands#dotIcon',
            iconColor: TASK_FORMAT_MAP_COLORS[task.format],
          }}
        />
      ))}

      {eventMarkers.map((event) => (
        <Placemark
          key={`event-${event.id}`}
          geometry={event.markerCoordinates}
          properties={{
            hintContent: `Мероприятие: ${event.title}`,
            balloonContentHeader: `<div style="font-weight:700;font-size:16px;margin-bottom:4px;">${event.title}</div>`,
            balloonContentBody: `
              <div style="margin-bottom:8px;">
                <div style="display:inline-block;padding:2px 8px;background-color:#DCFCE7;color:#166534;border-radius:12px;font-size:12px;margin-bottom:8px;">
                  Мероприятие
                </div>
                <div><strong>Организация:</strong> ${event.organizationName}</div>
                <div><strong>Место:</strong> ${event.location}</div>
                <div><strong>Дата:</strong> ${new Date(event.date).toLocaleDateString('ru-RU')}</div>
                <div><strong>Записались:</strong> ${event.registrationsCount}</div>
              </div>
            `,
            balloonContentFooter: `
              <button
                data-href="/мероприятия"
                style="background-color:${EVENT_MARKER_COLOR};color:white;border:none;padding:8px 12px;border-radius:10px;cursor:pointer;width:100%;margin-top:8px;"
              >
                Открыть мероприятия
              </button>
            `,
          }}
          options={{
            preset: 'islands#dotIcon',
            iconColor: EVENT_MARKER_COLOR,
          }}
        />
      ))}
    </Map>
  );
};

export const TasksMap: React.FC<TasksMapProps> = ({ tasks, events }) => {
  const mapsApiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY || '';

  return (
    <div className="h-[600px] w-full rounded-3xl overflow-hidden border border-gray-200 shadow-sm relative z-0">
      <YMaps
        query={{
          apikey: mapsApiKey,
          lang: 'ru_RU',
          load: 'package.full',
        }}
      >
        <MapContent tasks={tasks} events={events} />
      </YMaps>
    </div>
  );
};
