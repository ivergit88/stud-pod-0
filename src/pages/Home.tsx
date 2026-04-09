import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, GraduationCap, X, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { getTaskFormatLabel, getTaskHref } from '../lib/tasks';

export const Home: React.FC = () => {
  const { user } = useAuth();
  const { tasks, responses } = useData();
  const navigate = useNavigate();
  const [authModalRole, setAuthModalRole] = useState<'student' | 'organization' | null>(null);

  // Get 3 most recent open tasks
  const recentTasks = tasks
    .filter(t => t.status === 'open')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  // Realistic stats based on actual data
  const studentsCount = new Set(responses.map(r => r.studentId)).size || 1;
  const completedTasksCount = tasks.filter(t => t.status === 'completed').length || 0;
  const orgsCount = new Set(tasks.map(t => t.organizationId)).size || 1;

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="a11y-home-hero relative overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#f7fbff_0%,#ffffff_52%,#eef6ff_100%)] px-4 pb-12 pt-16 text-center shadow-sm sm:px-6 lg:px-8 md:pb-20 md:pt-24">
        <div className="a11y-home-decor pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(37,99,235,0.28),transparent)]" />
          <div className="absolute inset-y-0 left-10 w-px bg-[linear-gradient(180deg,transparent,rgba(148,163,184,0.16),transparent)]" />
          <div className="absolute inset-y-0 right-10 w-px bg-[linear-gradient(180deg,transparent,rgba(148,163,184,0.16),transparent)]" />
          <div className="absolute left-8 top-8 h-28 w-28 rounded-full border border-blue-100 bg-white/70" />
          <div className="absolute bottom-10 right-10 h-36 w-36 rounded-full border border-blue-100 bg-blue-50/70" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="a11y-surface-card mb-6 inline-flex items-center rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm">
            Портал цифровых задач от учреждений для студентов
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
            Студенческий подряд
          </h1>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-700 mb-6">
            Цифровые задачи для культуры
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-8">
            Платформа объединяет студентов, которые хотят получать прикладной ИТ-опыт, и
            учреждения культуры и образования, которым нужны цифровые решения.
          </p>
          <div className="grid gap-3 text-left sm:mx-auto sm:max-w-3xl sm:grid-cols-3">
            <div className="a11y-surface-card rounded-2xl border border-white bg-white/80 px-4 py-3 shadow-sm">
              <div className="text-sm font-semibold text-gray-900">Основной сценарий</div>
              <div className="mt-1 text-sm font-medium leading-6 text-gray-700">Публикация и выполнение цифровых задач.</div>
            </div>
            <div className="a11y-surface-card rounded-2xl border border-white bg-white/80 px-4 py-3 shadow-sm">
              <div className="text-sm font-semibold text-gray-900">Дополнительный сценарий</div>
              <div className="mt-1 text-sm font-medium leading-6 text-gray-700">Очные мероприятия и встречи партнёров.</div>
            </div>
            <div className="a11y-surface-card rounded-2xl border border-white bg-white/80 px-4 py-3 shadow-sm">
              <div className="text-sm font-semibold text-gray-900">Результат</div>
              <div className="mt-1 text-sm font-medium leading-6 text-gray-700">Баллы, опыт, портфолио и полезный продукт.</div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8">
          {user ? (
            <Link
              to={user.role === 'organization' ? '/организация' : '/студент'}
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-2xl text-white bg-blue-700 hover:bg-blue-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              Перейти в личный кабинет
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          ) : (
            <>
              <button
                onClick={() => setAuthModalRole('student')}
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-2xl text-white bg-blue-700 hover:bg-blue-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                <GraduationCap className="mr-2 h-6 w-6" />
                Я студент
              </button>
              <button
                onClick={() => setAuthModalRole('organization')}
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-2xl text-blue-700 bg-blue-50 hover:bg-blue-100 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                <Building2 className="mr-2 h-6 w-6" />
                Я организация
              </button>
            </>
          )}
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
            <div className="a11y-step-badge flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-2xl font-bold text-blue-700 shadow-sm transition-colors duration-300 group-hover:-translate-y-1 group-hover:bg-blue-600 group-hover:text-white">1</div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900"><span>Организация размещает задачу</span></h3>
            <p className="text-sm sm:text-base font-medium text-gray-700 leading-relaxed"><span>Учреждения культуры и образования описывают, что нужно сделать: дизайн афиши, текст для соцсетей или сайт.</span></p>
          </div>
          
          <div className="bg-white z-10 flex flex-col items-center text-center space-y-4 group p-4">
            <div className="a11y-step-badge flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-2xl font-bold text-blue-700 shadow-sm transition-colors duration-300 group-hover:-translate-y-1 group-hover:bg-blue-600 group-hover:text-white">2</div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900"><span>Студент выполняет работу</span></h3>
            <p className="text-sm sm:text-base font-medium text-gray-700 leading-relaxed"><span>Студент выбирает задачу по своим навыкам, выполняет её в срок и сдаёт на проверку.</span></p>
          </div>
          
          <div className="bg-white z-10 flex flex-col items-center text-center space-y-4 group p-4">
            <div className="a11y-step-badge flex h-16 w-16 items-center justify-center rounded-2xl border border-green-100 bg-green-50 text-2xl font-bold text-green-700 shadow-sm transition-colors duration-300 group-hover:-translate-y-1 group-hover:bg-green-600 group-hover:text-white">3</div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900"><span>Оба получают пользу</span></h3>
            <p className="text-sm sm:text-base font-medium text-gray-700 leading-relaxed"><span>Организация получает готовый продукт, а студент - баллы, запись в портфолио и опыт.</span></p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid sm:grid-cols-3 gap-6">
        <div className="a11y-accent-card rounded-2xl bg-blue-700 p-8 text-center text-white shadow-md">
          <div className="mb-2 text-4xl font-bold">{studentsCount}</div>
          <div className="text-base font-semibold">Студентов на площадке</div>
        </div>
        <div className="a11y-accent-card rounded-2xl bg-green-700 p-8 text-center text-white shadow-md">
          <div className="mb-2 text-4xl font-bold">{completedTasksCount}</div>
          <div className="text-base font-semibold">Выполнено задач</div>
        </div>
        <div className="a11y-accent-card rounded-2xl bg-orange-600 p-8 text-center text-white shadow-md">
          <div className="mb-2 text-4xl font-bold">{orgsCount}</div>
          <div className="text-base font-semibold">Организаций-партнёров</div>
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
