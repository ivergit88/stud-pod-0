import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { apiRequest } from '../lib/api';
import type { User } from '../context/AuthContext';

export const AdminSetup: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [setupToken, setSetupToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiRequest<{ user: User }>('/api/auth/admin-setup', {
        method: 'POST',
        body: JSON.stringify({
          email: 'ershovivan2802@yandex.ru',
          password,
          setupToken,
        }),
      });
      window.location.assign('/администратор');
    } catch (caught: any) {
      setError(caught?.message || 'Не удалось настроить администратора.');
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-lg items-center py-10">
      <form onSubmit={submit} className="w-full rounded-3xl border border-gray-200 bg-white p-7 shadow-sm sm:p-10">
        <ShieldCheck className="h-12 w-12 text-blue-700" />
        <h1 className="mt-5 text-3xl font-extrabold text-gray-950">Настройка администратора</h1>
        <p className="mt-3 leading-7 text-gray-600">Защищённое создание или восстановление кабинета владельца. Ключ настройки берётся из локального файла `.env`, поле `ADMIN_SETUP_TOKEN`.</p>
        {error && <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <label className="mt-6 block text-sm font-semibold text-gray-700">Email</label>
        <input value="ershovivan2802@yandex.ru" readOnly className="mt-2 w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3" />
        <label className="mt-5 block text-sm font-semibold text-gray-700">Новый пароль</label>
        <input type="password" minLength={10} required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3" autoComplete="new-password" />
        <label className="mt-5 block text-sm font-semibold text-gray-700">Ключ настройки из `.env`</label>
        <div className="relative mt-2"><KeyRound className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" /><input type="password" minLength={16} required value={setupToken} onChange={(event) => setSetupToken(event.target.value)} className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4" autoComplete="off" /></div>
        <button disabled={loading} className="mt-7 w-full rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:bg-blue-400">{loading ? 'Настройка...' : 'Создать кабинет администратора'}</button>
      </form>
    </div>
  );
};
