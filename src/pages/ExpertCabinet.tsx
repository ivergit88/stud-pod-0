import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, CheckCircle2, Clock, GraduationCap, ListChecks, RotateCcw, Rocket, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

const ROLE_CHECKLISTS = {
  student: [
    'Кабинет студента уже заполнен: задача сдана, 105 баллов получены, кейс в портфолио',
    'Вы участвуете в команде из 3 человек по задаче «Цифровой архив газеты»',
    'Откликнитесь на свободную задачу «Анонс фестиваля» — пройдите цикл сами за 2 минуты',
    'Загляните в магазин: мерч Неймарк обменивается на баллы',
  ],
  organization: [
    'В кабинете уже 5 задач: выполненные, на приёмке и в работе',
    'Проверьте заявку студента на «Форме онлайн-записи» — примите или верните на доработку',
    'Создайте свою задачу вручную или через ИИ-помощник — он разложит запрос на подзадачи',
  ],
} as const;

const SCENARIOS = [
  {
    icon: <CheckCircle2 className="h-6 w-6 text-emerald-600" />,
    badge: 'Выполнено',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    title: 'Одиночная задача: от отклика до баллов',
    text: 'Вы сдали афишу летней программы, учреждение приняло работу — 105 баллов и кейс в портфолио уже начислены.',
    link: '/портфолио',
    linkText: 'Открыть портфолио студента',
  },
  {
    icon: <Users className="h-6 w-6 text-blue-600" />,
    badge: 'Команда из 3 человек',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    title: 'Командная работа: цифровой архив газеты',
    text: 'Лидер собрал команду в «Сокомандниках», работа принята — 140 баллов распределены по участникам.',
    link: '/сокомандники',
    linkText: 'Посмотреть командника',
  },
  {
    icon: <Clock className="h-6 w-6 text-amber-600" />,
    badge: 'На приёмке',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    title: 'Задача на проверке у учреждения',
    text: 'Студент сдал форму онлайн-записи. От лица учреждения вы можете принять её или вернуть на доработку.',
    link: '/задачи/demo-task-form',
    linkText: 'Смотреть задачу',
  },
  {
    icon: <Rocket className="h-6 w-6 text-violet-600" />,
    badge: 'Свободна для пробы',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
    title: 'Открытая задача для вашего отклика',
    text: '«Анонс фестиваля», 85 баллов. Откликнитесь, добавьте сокомандника и сдайте результат — весь цикл за пару минут.',
    link: '/задачи/demo-task-announce',
    linkText: 'Откликнуться как студент',
  },
];

const LIFECYCLE = [
  ['Учреждение', 'Публикует запрос простым языком — сам или через ИИ-помощника'],
  ['Студент', 'Выбирает задачу, откликается, при необходимости собирает команду'],
  ['Выполнение', 'Передаёт результат ссылкой через платформу'],
  ['Приёмка', 'Учреждение принимает работу или возвращает на доработку'],
  ['Баллы и кейс', 'Баллы фиксируются, в портфолио появляется карточка кейса'],
];

export const ExpertCabinet: React.FC = () => {
  const { isExpertMode, enterExpertMode, switchExpertRole, user } = useAuth();
  const { tasks, platformStats } = useData();
  const navigate = useNavigate();

  const openRole = async (role: 'student' | 'organization') => {
    if (isExpertMode) {
      switchExpertRole(role);
    } else {
      await enterExpertMode(role);
    }
    navigate(role === 'student' ? '/студент' : '/организация');
  };

  const resetDemo = () => {
    if (!window.confirm('Начать демонстрацию заново? Текущие тестовые данные будут заменены исходными примерами.')) {
      return;
    }
    window.localStorage.removeItem('stud-pod-expert-data-v1');
    window.location.reload();
  };

  return (
    <div className="mx-auto max-w-6xl space-y-10 py-6 sm:py-10">
      <section className="overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl sm:p-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-blue-500/20 px-4 py-2 text-sm font-semibold text-blue-100">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Без регистрации
          </span>
          <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-100">
            <Sparkles className="mr-2 h-4 w-4" />
            Всё уже создано за вас
          </span>
          <span className="inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200">
            Данные остаются только в этом браузере
          </span>
        </div>
        <h1 className="mt-6 text-3xl font-extrabold sm:text-5xl">Кабинет эксперта</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
          Внутри уже развёрнут пример платформы: {tasks.length} задач на разных стадиях, командная работа,
          выполненные задачи с баллами, мероприятие и магазин. Ничего регистрировать не нужно —
          просто откройте платформу глазами студента или учреждения.
        </p>
        <div className="mt-6 flex flex-wrap gap-6 text-sm text-slate-300">
          <div><span className="text-2xl font-extrabold text-white">{platformStats.completedTasks}</span> задач принято и оплачено баллами</div>
          <div><span className="text-2xl font-extrabold text-white">{platformStats.activeTasks}</span> в работе — можно вмешаться</div>
          <div><span className="text-2xl font-extrabold text-white">{platformStats.totalPointsAwarded}</span> баллов начислено участникам</div>
        </div>
      </section>

      {isExpertMode && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-900">
          <span>
            Тестовый режим активен. Сейчас открыт интерфейс: <strong>{user?.role === 'student' ? 'студента' : 'учреждения'}</strong>.
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={() => void openRole('student')} className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100">Как студент</button>
            <button type="button" onClick={() => void openRole('organization')} className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100">Как учреждение</button>
          </div>
        </div>
      )}

      <section>
        <h2 className="text-2xl font-extrabold text-gray-950 sm:text-3xl">Четыре готовых сценария</h2>
        <p className="mt-2 text-gray-600">Каждый открывается в один клик и показывает настоящий рабочий экран платформы.</p>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {SCENARIOS.map((scenario) => (
            <div key={scenario.title} className="flex flex-col rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md sm:p-7">
              <div className="flex items-center justify-between gap-3">
                {scenario.icon}
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${scenario.badgeClass}`}>{scenario.badge}</span>
              </div>
              <h3 className="mt-4 text-lg font-bold leading-snug text-gray-950">{scenario.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-gray-600">{scenario.text}</p>
              <Link to={scenario.link} className="mt-5 inline-flex items-center font-semibold text-blue-700 hover:text-blue-900">
                {scenario.linkText} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-extrabold text-gray-950">Откройте платформу от лица участника</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="flex flex-col rounded-2xl border border-emerald-100 bg-emerald-50/40 p-6">
            <GraduationCap className="h-10 w-10 text-emerald-700" />
            <h3 className="mt-4 text-xl font-bold text-gray-950">Глаза студента</h3>
            <ul className="mt-4 flex-1 space-y-2.5">
              {ROLE_CHECKLISTS.student.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-6 text-gray-700">
                  <ListChecks className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => void openRole('student')} className="mt-6 w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white transition hover:bg-emerald-800">
              Войти как студент
            </button>
          </div>
          <div className="flex flex-col rounded-2xl border border-blue-100 bg-blue-50/40 p-6">
            <Building2 className="h-10 w-10 text-blue-700" />
            <h3 className="mt-4 text-xl font-bold text-gray-950">Глаза учреждения</h3>
            <ul className="mt-4 flex-1 space-y-2.5">
              {ROLE_CHECKLISTS.organization.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-6 text-gray-700">
                  <ListChecks className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                  {item}
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => void openRole('organization')} className="mt-6 w-full rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white transition hover:bg-blue-800">
              Войти как учреждение
            </button>
          </div>
        </div>
        <p className="mt-5 text-sm leading-6 text-gray-500">
          Можно и зарегистрироваться по-настоящему — реальный аккаунт работает так же, но уже с сохранением в базе.
        </p>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-extrabold text-gray-950">Так проходит каждая задача</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-5">
          {LIFECYCLE.map(([title, text], index) => (
            <li key={title} className="list-none rounded-2xl bg-gray-50 p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white">{index + 1}</div>
              <div className="mt-3 font-bold text-gray-950">{title}</div>
              <p className="mt-1 text-sm leading-6 text-gray-600">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-gray-600">
          Хотите чистый лист? Один клик — и демонстрация начнётся заново с исходными примерами.
        </p>
        <button type="button" onClick={resetDemo} className="inline-flex flex-shrink-0 items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-100">
          <RotateCcw className="mr-2 h-4 w-4" /> Начать демонстрацию заново
        </button>
      </div>

      <Link to="/" className="inline-flex text-sm font-semibold text-blue-700 hover:text-blue-900">Вернуться на главную</Link>
    </div>
  );
};
