import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, GraduationCap, RotateCcw, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ExpertCabinet: React.FC = () => {
  const { isExpertMode, enterExpertMode, switchExpertRole, user } = useAuth();
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
    if (!window.confirm('Удалить все задачи и действия из локального тестового режима?')) {
      return;
    }
    window.localStorage.removeItem('stud-pod-expert-data-v1');
    window.location.reload();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-6 sm:py-10">
      <section className="overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl sm:p-10">
        <div className="inline-flex items-center rounded-full bg-blue-500/20 px-4 py-2 text-sm font-semibold text-blue-100">
          <ShieldCheck className="mr-2 h-4 w-4" />
          Изолированный тестовый контур
        </div>
        <h1 className="mt-5 text-3xl font-extrabold sm:text-5xl">Кабинет эксперта</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
          Оцените полный маршрут платформы без регистрации. Данные сохраняются только в этом
          браузере и не попадают в базу сайта.
        </p>
      </section>

      {isExpertMode && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-900">
          Тестовый режим активен. Сейчас открыт интерфейс: <strong>{user?.role === 'student' ? 'студента' : 'учреждения'}</strong>.
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <button
          type="button"
          onClick={() => void openRole('organization')}
          className="group rounded-3xl border border-blue-100 bg-white p-7 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
        >
          <Building2 className="h-10 w-10 text-blue-700" />
          <h2 className="mt-5 text-2xl font-bold text-gray-950">От лица учреждения</h2>
          <p className="mt-3 leading-7 text-gray-600">
            Создайте задачу, управляйте публикацией, смотрите отклики и принимайте результат.
          </p>
          <span className="mt-6 inline-flex font-semibold text-blue-700">Открыть кабинет учреждения</span>
        </button>

        <button
          type="button"
          onClick={() => void openRole('student')}
          className="group rounded-3xl border border-emerald-100 bg-white p-7 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
        >
          <GraduationCap className="h-10 w-10 text-emerald-700" />
          <h2 className="mt-5 text-2xl font-bold text-gray-950">От лица студента</h2>
          <p className="mt-3 leading-7 text-gray-600">
            Найдите созданную учреждением задачу, откликнитесь, сдайте результат и проверьте портфолио.
          </p>
          <span className="mt-6 inline-flex font-semibold text-emerald-700">Открыть кабинет студента</span>
        </button>
      </div>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-bold text-gray-950">Рекомендуемый сценарий проверки</h2>
        <ol className="mt-5 grid gap-4 md:grid-cols-4">
          {[
            ['1', 'Учреждение', 'Откройте кабинет и нажмите «Создать задачу».'],
            ['2', 'Заполнение', 'Укажите название, проблему, ожидаемый итог и дедлайн.'],
            ['3', 'Студент', 'Переключите роль, найдите задачу и отправьте отклик.'],
            ['4', 'Приёмка', 'Вернитесь к учреждению, проверьте результат или отправьте на доработку.'],
          ].map(([number, title, text]) => (
            <li key={number} className="list-none rounded-2xl bg-gray-50 p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 font-bold text-white">{number}</div>
              <div className="mt-3 font-bold text-gray-950">{title}</div>
              <p className="mt-1 text-sm leading-6 text-gray-600">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500">Для повторной демонстрации локальные данные можно очистить в один клик.</p>
        <button type="button" onClick={resetDemo} className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50">
          <RotateCcw className="mr-2 h-4 w-4" /> Очистить тестовые данные
        </button>
      </div>

      <Link to="/" className="inline-flex text-sm font-semibold text-blue-700 hover:text-blue-900">Вернуться на главную</Link>
    </div>
  );
};
