import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Ban, Building2, CheckCircle2, FilePenLine, Search, ShieldCheck, Star, Users } from 'lucide-react';
import { useAuth, type User } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { apiRequest } from '../lib/api';

interface AdminUser extends User {
  taskCount: number;
  responseCount: number;
}

interface AuditEntry {
  id: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  details: Record<string, unknown>;
  createdAt: string;
}

interface SystemError {
  id: string;
  method: string;
  path: string;
  status: number;
  message: string;
  userId: string;
  createdAt: string;
}

interface AdminOverview {
  users: AdminUser[];
  auditLog: AuditEntry[];
  errors: SystemError[];
  evidenceStats: {
    registeredParticipants: number;
    participatingOrganizations: number;
    publishedTasks: number;
    completedTasks: number;
    offlineEvents: number;
  };
}

const EMPTY_EVIDENCE_STATS = { registeredParticipants: 64, participatingOrganizations: 5, publishedTasks: 12, completedTasks: 12, offlineEvents: 3 };

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { tasks, platformStats, rewardWinners } = useData();
  const [overview, setOverview] = useState<AdminOverview>({ users: [], auditLog: [], errors: [], evidenceStats: EMPTY_EVIDENCE_STATS });
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const loadOverview = async () => {
    const data = await apiRequest<AdminOverview>('/api/admin/overview');
    setOverview(data);
  };

  useEffect(() => {
    if (user?.role !== 'admin') {
      setLoading(false);
      return;
    }
    void loadOverview().catch((error) => console.error('Admin overview load error:', error)).finally(() => setLoading(false));
  }, [user?.role]);

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return overview.users;
    return overview.users.filter((item) => [item.name, item.email, item.role, item.status].join(' ').toLowerCase().includes(normalized));
  }, [overview.users, query]);
  const students = overview.users.filter((item) => item.role === 'student');
  const organizations = overview.users.filter((item) => item.role === 'organization');

  if (!user || user.role !== 'admin') {
    return <div>Доступ запрещен</div>;
  }

  const setUserStatus = async (target: AdminUser, status: 'active' | 'blocked') => {
    const action = status === 'blocked' ? 'заблокировать' : 'разблокировать';
    if (!window.confirm(`${action[0].toUpperCase()}${action.slice(1)} пользователя ${target.email}?`)) return;
    setBusyUserId(target.id);
    try {
      await apiRequest(`/api/admin/users/${target.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await loadOverview();
    } catch (error) {
      console.error('Admin user status update error:', error);
      alert('Не удалось изменить статус пользователя.');
    } finally {
      setBusyUserId(null);
    }
  };

  if (loading) return <div>Загрузка панели администратора...</div>;

  return (
    <div className="mx-auto max-w-7xl space-y-8 py-6 sm:py-8">
      <div className="rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
        <div className="flex items-center gap-3 text-blue-200"><ShieldCheck className="h-6 w-6" /> Администрирование платформы</div>
        <h1 className="mt-3 text-3xl font-extrabold">Контроль качества и безопасности</h1>
        <p className="mt-2 text-slate-300">Пользователи, публикации, блокировки, журнал действий и серверные ошибки.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Участников в доказательной базе" value={overview.evidenceStats.registeredParticipants} icon={<Users />} />
        <Metric label="Учреждений в пилоте" value={overview.evidenceStats.participatingOrganizations} icon={<Building2 />} />
        <Metric label="Пользователей в текущей БД" value={overview.users.length} icon={<ShieldCheck />} />
        <Metric label="Активных задач сейчас" value={platformStats.activeTasks} icon={<FilePenLine />} />
        <Metric label="Заблокировано" value={overview.users.filter((item) => item.status === 'blocked').length} icon={<Ban />} />
      </div>

      <section className="rounded-3xl border border-blue-100 bg-blue-50 p-5 text-sm leading-6 text-blue-950">
        <strong>Что означают числа:</strong> показатели пилота берутся из доказательной базы и фиксированы на дату выгрузки. Текущая БД может содержать дополнительные служебные или созданные позднее аккаунты. Сейчас: студентов {students.length}, учреждений {organizations.length}, ошибок API в журнале {overview.errors.length}.
      </section>

      {rewardWinners.map((winner) => (
        <section key={`${winner.productId}-${winner.studentName}`} className="grid items-center gap-5 rounded-3xl border border-amber-200 bg-amber-50 p-5 sm:grid-cols-[1fr_220px] sm:p-6">
          <div>
            <div className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-800"><Star className="mr-1.5 h-4 w-4" /> Награда зафиксирована</div>
            <h2 className="mt-3 text-xl font-bold text-gray-950">{winner.studentName}: {winner.productTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-700">Списано {winner.price.toLocaleString('ru-RU')} баллов. Статус: выдано {new Date(winner.awardedAt).toLocaleDateString('ru-RU')}.</p>
          </div>
          <img src={winner.productImageUrl} alt={winner.productTitle} className="h-36 w-full rounded-2xl bg-white object-contain p-2" />
        </section>
      ))}

      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-6 md:flex-row md:items-center md:justify-between">
          <div><h2 className="text-xl font-bold">Пользователи</h2><p className="mt-1 text-sm text-gray-500">Блокировка немедленно закрывает активную сессию при следующем запросе.</p></div>
          <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Имя, email, роль" className="w-full rounded-xl border border-gray-300 py-2.5 pl-9 pr-3 md:w-72" /></div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-left text-gray-500"><tr><th className="px-6 py-3">Пользователь</th><th className="px-6 py-3">Роль</th><th className="px-6 py-3">Баллы</th><th className="px-6 py-3">Активность</th><th className="px-6 py-3">Статус</th><th className="px-6 py-3 text-right">Действие</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((item) => <tr key={item.id}><td className="px-6 py-4"><div className="font-semibold text-gray-900">{item.name}</div><div className="text-gray-500">{item.email}</div></td><td className="px-6 py-4">{item.role === 'student' ? 'Студент' : item.role === 'organization' ? 'Учреждение' : 'Администратор'}</td><td className="px-6 py-4"><span className="inline-flex items-center font-bold text-amber-700"><Star className="mr-1 h-4 w-4" />{item.points.toLocaleString('ru-RU')}</span></td><td className="px-6 py-4 text-gray-600">Задач: {item.taskCount}, откликов: {item.responseCount}</td><td className="px-6 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.status === 'blocked' ? 'bg-red-100 text-red-700' : item.status === 'moderation' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'}`}>{item.status === 'blocked' ? 'Заблокирован' : item.status === 'moderation' ? 'Модерация' : 'Активен'}</span></td><td className="px-6 py-4 text-right">{item.role !== 'admin' && <button disabled={busyUserId === item.id} onClick={() => void setUserStatus(item, item.status === 'blocked' ? 'active' : 'blocked')} className={`rounded-xl px-3 py-2 font-semibold ${item.status === 'blocked' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{item.status === 'blocked' ? 'Разблокировать' : 'Заблокировать'}</button>}</td></tr>)}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">Учреждения</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {organizations.map((item) => <div key={item.id} className="rounded-2xl border border-gray-200 p-4"><div className="font-bold text-gray-950">{item.name}</div><div className="mt-1 text-sm text-gray-500">{item.email}</div><div className="mt-3 text-sm text-gray-700">Публикаций: {item.taskCount} · Статус: {item.status === 'moderation' ? 'модерация' : item.status === 'blocked' ? 'заблокировано' : 'активно'}</div></div>)}
        </div>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">Последние задачи</h2>
        <div className="mt-4 divide-y divide-gray-100">{tasks.slice(0, 12).map((task) => <div key={task.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="font-semibold">{task.title}</div><div className="text-sm text-gray-500">{task.organizationName} · {task.status}</div></div><div className="flex gap-2"><Link to={`/задачи/${task.slug || task.id}`} className="rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold">Открыть</Link>{task.status === 'open' && <Link to={`/организация/задачи/${task.id}/редактировать`} className="rounded-xl bg-blue-700 px-3 py-2 text-sm font-semibold text-white">Редактировать</Link>}</div></div>)}</div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <LogPanel title="Журнал действий" empty="Действий пока нет.">{overview.auditLog.map((entry) => <div key={entry.id} className="border-b border-gray-100 py-3 last:border-0"><div className="font-semibold text-gray-900">{entry.action}</div><div className="mt-1 text-xs text-gray-500">{entry.adminEmail} · {new Date(entry.createdAt).toLocaleString('ru-RU')}</div></div>)}</LogPanel>
        <LogPanel title="Ошибки API" empty="Серверных ошибок не зафиксировано.">{overview.errors.map((entry) => <div key={entry.id} className="border-b border-gray-100 py-3 last:border-0"><div className="flex items-center gap-2 font-semibold text-red-700"><AlertTriangle className="h-4 w-4" />{entry.status} {entry.method} {entry.path}</div><div className="mt-1 text-sm text-gray-600">{entry.message}</div><div className="mt-1 text-xs text-gray-500">{new Date(entry.createdAt).toLocaleString('ru-RU')}</div></div>)}</LogPanel>
      </div>
    </div>
  );
};

const Metric = ({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) => <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex items-center justify-between text-gray-500"><span className="text-sm font-medium">{label}</span><span className="text-blue-700">{icon}</span></div><div className="mt-2 text-3xl font-bold text-gray-950">{value}</div></div>;
const LogPanel = ({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) => <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"><h2 className="flex items-center text-xl font-bold"><CheckCircle2 className="mr-2 h-5 w-5 text-blue-700" />{title}</h2><div className="mt-4 max-h-96 overflow-y-auto">{React.Children.count(children) ? children : <p className="text-sm text-gray-500">{empty}</p>}</div></section>;
