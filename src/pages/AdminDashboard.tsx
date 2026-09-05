import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Users, BarChart3, CheckCircle, Activity, Ban, Unlock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    (async () => {
      try {
        const res = await fetch('/api/admin/stats', { credentials: 'include' });
        const data = await res.json();
        setStats(data);
      } catch (e) { console.error('Admin stats error:', e); }
      try {
        const res = await fetch('/api/admin/users', { credentials: 'include' });
        const data = await res.json();
        setUsers(data.users || []);
      } catch (e) { console.error('Admin users error:', e); }
    })();
  }, [user, navigate]);

  const handleBlock = async (id: string) => {
    await fetch(`/api/admin/users/${id}/block`, { method: 'POST', credentials: 'include' });
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'blocked' } : u)));
  };

  const handleUnblock = async (id: string) => {
    await fetch(`/api/admin/users/${id}/unblock`, { method: 'POST', credentials: 'include' });
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'active' } : u)));
  };

  if (!user || user.role !== 'admin') return <div>Доступ запрещён</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <ShieldCheck className="w-8 h-8 text-blue-700" />
        <h1 className="text-3xl font-extrabold text-gray-900">Кабинет администратора</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={<Activity className="w-6 h-6 text-blue-600" />} label="Активные задачи" value={stats?.activeTasks ?? '…'} />
        <StatCard icon={<CheckCircle className="w-6 h-6 text-emerald-600" />} label="Выполнено" value={stats?.completedTasks ?? '…'} />
        <StatCard icon={<Users className="w-6 h-6 text-violet-600" />} label="Студентов" value={stats?.students ?? '…'} />
        <StatCard icon={<BarChart3 className="w-6 h-6 text-amber-600" />} label="Организаций" value={stats?.organizations ?? '…'} />
        <StatCard icon={<Users className="w-6 h-6 text-indigo-600" />} label="Ответов обработано" value={stats?.responsesProcessed ?? '…'} />
        <StatCard icon={<BarChart3 className="w-6 h-6 text-rose-600" />} label="Баллов начислено" value={stats?.pointsAwarded ?? '…'} />
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Пользователи</h2>
          <Link to="/" className="text-sm font-medium text-blue-600 hover:text-blue-800">Вернуться на портал</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-700">
            <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
              <tr>
                <th className="px-6 py-3 text-left">Email</th>
                <th className="px-6 py-3 text-left">Роль</th>
                <th className="px-6 py-3 text-left">Имя</th>
                <th className="px-6 py-3 text-left">Вуз</th>
                <th className="px-6 py-3 text-left">Статус</th>
                <th className="px-6 py-3 text-left">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{u.email}</td>
                  <td className="px-6 py-4">{u.role}</td>
                  <td className="px-6 py-4">{u.name || '-'}</td>
                  <td className="px-6 py-4">{u.university || '-'}</td>
                  <td className="px-6 py-4">{u.status}</td>
                  <td className="px-6 py-4">
                    {u.status === 'active' ? (
                      <button onClick={() => handleBlock(u.id)} className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors">
                        <Ban className="w-3.5 h-3.5" /> Заблокировать
                      </button>
                    ) : (
                      <button onClick={() => handleUnblock(u.id)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors">
                        <Unlock className="w-3.5 h-3.5" /> Разблокировать
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-3">{icon}</div>
      <div className="text-3xl font-extrabold text-gray-900">{value}</div>
      <div className="mt-1 text-sm font-medium text-gray-500">{label}</div>
    </div>
  );
}
