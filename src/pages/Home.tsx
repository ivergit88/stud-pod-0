import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, GraduationCap, X, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { STARTER_TASK_BANK } from '../lib/task-projects';
import { getTaskFormatLabel, getTaskHref } from '../lib/tasks';

const PRODUCT_METRICS = {
  savedBudgetRubles: 50000,
  codeLines: 18000,
  engineeringHours: 240,
};

const heroProofPoints = [
  'микрозадачи вместо тяжёлых коммерческих заказов',
  'первый подтверждаемый кейс для портфолио студента',
  'быстрая цифровая помощь учреждениям культуры',
];

export const Home: React.FC = () => {
  const { user } = useAuth();
  const { tasks, platformStats } = useData();
  const navigate = useNavigate();
  const [authModalRole, setAuthModalRole] = useState<'student' | 'organization' | null>(null);

  // Get 3 most recent open tasks
  const recentTasks = tasks
    .filter(t => t.status === 'open' && t.taskKind !== 'parent')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const homeMetrics = [
    {
      value: platformStats.totalStudents,
      label: 'Зарегистрированных студентов',
      palette: 'bg-blue-700',
    },
    {
      value: platformStats.totalOrganizations,
      label: 'Организаций в системе',
      palette: 'bg-emerald-700',
    },
    {
      value: platformStats.activeTasks,
      label: 'Активных задач сейчас',
      palette: 'bg-orange-600',
    },
    {
      value: platformStats.completedTasks,
      label: 'Задач доведено до результата',
      palette: 'bg-slate-800',
    },
    {
      value: `${Math.round(PRODUCT_METRICS.savedBudgetRubles / 1000)} 000 ₽`,
      label: 'Сэкономлено бюджетных средств',
      palette: 'bg-violet-700',
    },
    {
      value: `${PRODUCT_METRICS.codeLines.toLocaleString('ru-RU')} / ${PRODUCT_METRICS.engineeringHours} ч`,
      label: 'Строк кода / часов работы',
      palette: 'bg-rose-700',
    },
    {
      value: platformStats.totalResponses,
      label: 'Откликов обработано',
      palette: 'bg-cyan-700',
    },
    {
      value: platformStats.totalPointsAwarded,
      label: 'Баллов уже начислено',
      palette: 'bg-amber-600',
    },
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="a11y-home-hero relative overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#f7fbff_0%,#ffffff_48%,#e7f3ff_100%)] px-4 pb-12 pt-12 shadow-sm sm:px-6 lg:px-10 md:pb-16 md:pt-16">
        <div className="a11y-home-decor pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(37,99,235,0.28),transparent)]" />
          <div className="absolute inset-y-0 left-10 w-px bg-[linear-gradient(180deg,transparent,rgba(148,163,184,0.16),transparent)]" />
          <div className="absolute inset-y-0 right-10 w-px bg-[linear-gradient(180deg,transparent,rgba(148,163,184,0.16),transparent)]" />
        </div>

        <div className="relative z-10 grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="text-left">
            <div className="a11y-surface-card mb-6 inline-flex items-center rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm">
              Портал микрозадач для учреждений культуры и студентов
            </div>
            <h1 className="max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-gray-950 sm:text-5xl md:text-6xl">
              Первый реальный кейс студенту. Цифровая помощь учреждению.
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-700 sm:text-lg">
              Студенческий подряд превращает бытовой запрос учреждения в короткую понятную задачу:
              студент получает опыт и портфолио, а учреждение закрывает цифровую рутину без
              тяжёлого коммерческого подряда.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {heroProofPoints.map((item) => (
                <div key={item} className="a11y-surface-card rounded-2xl border border-white bg-white/85 px-4 py-3 shadow-sm">
                  <div className="text-sm font-semibold leading-6 text-gray-900">{item}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-4 pt-8 sm:flex-row">
              {user ? (
                <Link
                  to={user.role === 'organization' ? '/организация' : '/студент'}
                  className="inline-flex items-center justify-center rounded-2xl bg-blue-700 px-8 py-4 text-lg font-medium text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-blue-800 hover:shadow-xl"
                >
                  Перейти в личный кабинет
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => setAuthModalRole('student')}
                    className="inline-flex items-center justify-center rounded-2xl bg-blue-700 px-8 py-4 text-lg font-medium text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-blue-800 hover:shadow-xl"
                  >
                    <GraduationCap className="mr-2 h-6 w-6" />
                    Хочу кейс в портфолио
                  </button>
                  <button
                    onClick={() => setAuthModalRole('organization')}
                    className="inline-flex items-center justify-center rounded-2xl bg-white px-8 py-4 text-lg font-medium text-blue-800 shadow-lg ring-1 ring-blue-100 transition-all hover:-translate-y-1 hover:bg-blue-50 hover:shadow-xl"
                  >
                    <Building2 className="mr-2 h-6 w-6" />
                    Нужно разгрузить рутину
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="a11y-force-surface rounded-[2rem] border border-white bg-white/80 p-4 shadow-2xl">
            <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-950 text-white">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-300" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <div className="text-xs font-semibold text-slate-300">живой пользовательский путь</div>
              </div>
              <div className="space-y-4 p-5">
                <div className="rounded-2xl bg-white p-4 text-slate-900">
                  <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                    Запрос учреждения
                  </div>
                  <div className="mt-2 text-lg font-bold">Нужно обновить страницу выставки</div>
                  <div className="mt-2 text-sm leading-6 text-slate-600">
                    Система переводит запрос в ТЗ и делит на микрозадачи: тексты, дизайн,
                    публикация, проверка.
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <div className="text-xs text-blue-100">Студент</div>
                    <div className="mt-1 text-2xl font-bold text-white">+40 баллов</div>
                    <div className="mt-1 text-sm text-blue-100">кейс, отзыв, запись в портфолио</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <div className="text-xs text-blue-100">Учреждение</div>
                    <div className="mt-1 text-2xl font-bold text-white">1 задача</div>
                    <div className="mt-1 text-sm text-blue-100">понятный результат без лишней бюрократии</div>
                  </div>
                </div>
                <div className="rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white">
                  От запроса до результата: публикация → отклик → сдача → проверка → портфолио
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      {authModalRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900">
                {authModalRole === 'student' ? 'Студентам' : 'Организациям'}
              </h3>
              <button 
                onClick={() => setAuthModalRole(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <button
                onClick={() => {
                  setAuthModalRole(null);
                  navigate('/вход');
                }}
                className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <LogIn className="h-6 w-6" />
                  </div>
                  <div className="ml-4 text-left">
                    <div className="font-bold text-gray-900">Вход</div>
                    <div className="text-sm text-gray-500">У меня уже есть аккаунт</div>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500" />
              </button>
              
              <button
                onClick={() => {
                  setAuthModalRole(null);
                  navigate(authModalRole === 'student' ? '/регистрация-студент' : '/регистрация-организация');
                }}
                className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <UserPlus className="h-6 w-6" />
                  </div>
                  <div className="ml-4 text-left">
                    <div className="font-bold text-gray-900">Регистрация</div>
                    <div className="text-sm text-gray-500">Создать новый аккаунт</div>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* How it works */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 md:p-12 shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10"></div>
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">Как это работает</h2>
        <div className="grid md:grid-cols-3 gap-8 sm:gap-12 relative">
          <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-blue-100 via-blue-200 to-green-100 -z-10"></div>
          
          <div className="bg-white z-10 flex flex-col items-center text-center space-y-4 group p-4">
            <div className="a11y-step-badge flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-2xl font-bold text-blue-700 shadow-sm transition-colors duration-300 group-hover:-translate-y-1 group-hover:bg-blue-600 group-hover:text-white">
              <span className="a11y-step-number">1</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900"><span>Организация описывает запрос</span></h3>
            <p className="text-sm sm:text-base font-medium text-gray-700 leading-relaxed"><span>Можно опубликовать одну микрозадачу или большой проект, который система разложит на подзадачи.</span></p>
          </div>
          
          <div className="bg-white z-10 flex flex-col items-center text-center space-y-4 group p-4">
            <div className="a11y-step-badge flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-2xl font-bold text-blue-700 shadow-sm transition-colors duration-300 group-hover:-translate-y-1 group-hover:bg-blue-600 group-hover:text-white">
              <span className="a11y-step-number">2</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900"><span>Студент берёт понятный объём</span></h3>
            <p className="text-sm sm:text-base font-medium text-gray-700 leading-relaxed"><span>Короткая задача снижает страх первого реального заказа и даёт безопасный вход в практику.</span></p>
          </div>
          
          <div className="bg-white z-10 flex flex-col items-center text-center space-y-4 group p-4">
            <div className="a11y-step-badge flex h-16 w-16 items-center justify-center rounded-2xl border border-green-100 bg-green-50 text-2xl font-bold text-green-700 shadow-sm transition-colors duration-300 group-hover:-translate-y-1 group-hover:bg-green-600 group-hover:text-white">
              <span className="a11y-step-number">3</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900"><span>Результат фиксируется</span></h3>
            <p className="text-sm sm:text-base font-medium text-gray-700 leading-relaxed"><span>Учреждение принимает работу, студент получает баллы, отзыв и подтверждённый кейс в портфолио.</span></p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="a11y-force-surface rounded-3xl border border-slate-200 bg-slate-950 p-8 text-white shadow-sm">
          <div className="text-sm font-bold uppercase tracking-[0.18em] text-blue-200">
            Для защиты проекта
          </div>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight text-white">
            Не просто сайт, а контур практики с измеримым результатом
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-200">
            Проект показывает социальную миссию, образовательную ценность и реальную реализацию:
            есть рабочий портал, карточки задач, пользовательский путь, метрики и проверка
            результата учреждением.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ['Микроформат', 'Не заменяет фриланс и практику, а даёт короткий безопасный вход в реальную работу.'],
            ['Польза учреждению', 'Закрывает цифровую рутину: тексты, страницы, афиши, оцифровку, аналитику и публикации.'],
            ['Польза студенту', 'Первый кейс, баллы, отзыв, портфолио и уверенность перед стажировкой или работой.'],
            ['Доказуемость', 'Можно показывать число задач, откликов, завершений, баллов, публикаций и обратной связи.'],
          ].map(([title, text]) => (
            <div key={title} className="a11y-surface-card rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="text-lg font-bold text-gray-900">{title}</div>
              <div className="mt-2 text-sm leading-7 text-gray-600">{text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Метрики проекта</h2>
            <p className="mt-1 text-sm text-gray-600">
              Живые показатели платформы и продуктовые метрики, которые показывают практический эффект решения.
            </p>
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {homeMetrics.map((metric) => (
            <div
              key={metric.label}
              className={`a11y-accent-card rounded-2xl p-6 text-white shadow-md ${metric.palette}`}
            >
              <div className="mb-2 break-words text-3xl font-bold leading-tight">{metric.value}</div>
              <div className="text-sm font-semibold leading-6 opacity-95">{metric.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Стартовые задачи для учреждений</h2>
            <p className="mt-1 max-w-3xl text-sm text-gray-600">
              Это примеры задач, которые удобно отдавать в микро-формате: они не выглядят как
              полноценный коммерческий заказ, но дают учреждению полезный результат и не
              перегружают студентов.
            </p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900">
            Крупную задачу можно опубликовать одним проектом: система сама разобьёт её на такие
            подзадачи и автоматически назначит баллы.
          </div>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-gray-100 bg-white shadow-sm">
          <table className="min-w-[960px] w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-5 py-4 font-semibold">Категория</th>
                <th className="px-5 py-4 font-semibold">Задача</th>
                <th className="px-5 py-4 font-semibold">Трудоёмкость</th>
                <th className="px-5 py-4 font-semibold">Что получает учреждение</th>
                <th className="px-5 py-4 font-semibold">Что нужно дать исполнителю</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {STARTER_TASK_BANK.map((item) => (
                <tr key={item.id} className="align-top">
                  <td className="px-5 py-4">
                    <div className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {item.category}
                    </div>
                    <div className="mt-2 text-xs font-medium text-gray-500">{item.complexity}</div>
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold leading-6 text-gray-900">{item.title}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{item.duration}</td>
                  <td className="px-5 py-4 text-sm leading-6 text-gray-700">{item.outcome}</td>
                  <td className="px-5 py-4 text-sm leading-6 text-gray-600">{item.institutionProvides}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent Tasks */}
      <section className="space-y-8">
        <div className="flex justify-between items-end">
          <h2 className="text-3xl font-bold">Последние задачи</h2>
          <Link to="/задачи" className="text-blue-700 font-medium hover:underline flex items-center">
            Смотреть все <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {recentTasks.length > 0 ? recentTasks.map((task) => (
            <div key={task.id} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow flex flex-col h-full">
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full mb-3">
                  {task.category}
                </span>
                <span
                  className={`ml-2 inline-block px-3 py-1 text-xs font-medium rounded-full mb-3 ${
                    task.format === 'online'
                      ? 'bg-blue-50 text-blue-700'
                      : task.format === 'hybrid'
                        ? 'bg-violet-50 text-violet-700'
                        : 'bg-orange-50 text-orange-700'
                  }`}
                >
                  {getTaskFormatLabel(task.format)}
                </span>
                <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1 line-clamp-2">{task.title}</h3>
                <p className="text-sm text-gray-500 flex items-center">
                  <Building2 className="h-3 w-3 mr-1" />
                  {task.organizationName}
                </p>
              </div>
              <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                <div className="font-bold text-blue-700">{task.pointsReward} баллов</div>
                <Link to={getTaskHref(task)} className="text-sm font-medium text-gray-600 hover:text-blue-700">Подробнее</Link>
              </div>
            </div>
          )) : (
            <div className="col-span-3 text-center py-8 text-gray-500 bg-white rounded-2xl border border-gray-200">
              Пока нет открытых задач
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
