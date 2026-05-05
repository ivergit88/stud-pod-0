import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Search, MapPin, Briefcase, Filter, Star, List, Map as MapIcon } from 'lucide-react';
import { TasksMap } from '../components/TasksMap';
import { getTaskFormatLabel, getTaskHref } from '../lib/tasks';
import { TASK_TYPE_OPTIONS } from '../lib/task-scoring';

export const TaskCatalog: React.FC = () => {
  const { tasks, events } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [mapFilter, setMapFilter] = useState<'all' | 'online' | 'hybrid' | 'offline' | 'events'>('all');

  const categories = ['all', ...TASK_TYPE_OPTIONS.map((option) => option.label)];
  const mapFilters = [
    { value: 'all' as const, label: 'Все' },
    { value: 'online' as const, label: 'Онлайн' },
    { value: 'hybrid' as const, label: 'Смешанные' },
    { value: 'offline' as const, label: 'Очные' },
    { value: 'events' as const, label: 'Мероприятия' },
  ];

  const filteredTasks = tasks.filter(task => {
    if (task.taskKind === 'parent') {
      return false;
    }

    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory;
    const isPublished = task.status === 'open';
    
    return matchesSearch && matchesCategory && isPublished;
  });

  const visibleMapTasks = filteredTasks.filter((task) =>
    mapFilter === 'all' ? true : mapFilter === 'events' ? false : task.format === mapFilter,
  );

  const visibleMapEvents = events.filter((event) => mapFilter === 'all' || mapFilter === 'events');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Каталог задач</h1>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <List className="w-4 h-4 mr-2" />
            Список
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'map' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MapIcon className="w-4 h-4 mr-2" />
            Карта
          </button>
        </div>
      </div>

      <div className="mb-8 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Поиск по названию или описанию задачи..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-2xl border border-gray-300 bg-gray-50 py-3 pl-11 pr-4 leading-5 placeholder-gray-500 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 sm:text-sm"
          />
        </div>

        <div className="mt-5 border-t border-gray-100 pt-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-600">
            <Filter className="h-4 w-4 text-gray-400" />
            Тип задачи
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`a11y-category-chip rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {category === 'all' ? 'Все категории' : category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {viewMode === 'map' ? (
        <div className="space-y-6">
          <div className="rounded-3xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-900">
            Подсказка: цвет метки показывает формат задачи и помогает быстро увидеть, где нужна
            очная часть или где проходит мероприятие. Для выбора исполнителя удобнее вернуться к
            списку.
          </div>

          <div className="flex flex-wrap gap-2">
            {mapFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setMapFilter(filter.value)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  mapFilter === filter.value
                    ? 'bg-blue-700 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <div className="a11y-task-chip a11y-force-accent inline-flex items-center rounded-full bg-white px-3 py-2 border border-gray-200 text-gray-700">
              <span className="mr-2 h-3 w-3 rounded-full bg-blue-600" />
              Онлайн
            </div>
            <div className="a11y-task-chip a11y-force-accent inline-flex items-center rounded-full bg-white px-3 py-2 border border-gray-200 text-gray-700">
              <span className="mr-2 h-3 w-3 rounded-full bg-violet-600" />
              Смешанная
            </div>
            <div className="a11y-task-chip a11y-force-accent inline-flex items-center rounded-full bg-white px-3 py-2 border border-gray-200 text-gray-700">
              <span className="mr-2 h-3 w-3 rounded-full bg-orange-500" />
              Очная
            </div>
            <div className="a11y-task-chip a11y-force-accent inline-flex items-center rounded-full bg-white px-3 py-2 border border-gray-200 text-gray-700">
              <span className="mr-2 h-3 w-3 rounded-full bg-green-600" />
              Мероприятие
            </div>
          </div>

          <TasksMap tasks={visibleMapTasks} events={visibleMapEvents} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.length > 0 ? (
            filteredTasks.map(task => (
              <div key={task.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="a11y-category-chip inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {task.category}
                      </span>
                      {task.parentTaskTitle && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                          Часть проекта
                        </span>
                      )}
                      <span
                        className={`a11y-task-chip a11y-force-accent inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                    <div className="flex items-center text-amber-500 font-bold">
                      <Star className="w-4 h-4 mr-1 fill-current" />
                      {task.pointsReward}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    <Link to={getTaskHref(task)} className="hover:text-blue-600">
                      {task.title}
                    </Link>
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {task.description}
                  </p>
                  {task.parentTaskTitle && (
                    <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                      Относится к проекту: {task.parentTaskTitle}
                    </div>
                  )}
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Briefcase className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{task.organizationName}</span>
                    </div>
                    {(task.location || task.organizationAddress) && (
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">
                          {task.location || task.organizationAddress}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Дедлайн: {new Date(task.deadline).toLocaleDateString('ru-RU')}
                  </span>
                  <Link
                    to={getTaskHref(task)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Подробнее
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-gray-100">
              <p className="text-gray-500 text-lg">По вашему запросу задач не найдено.</p>
              <button 
                onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
                className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
              >
                Сбросить фильтры
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
