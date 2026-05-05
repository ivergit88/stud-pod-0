import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPendingTaskTemplateCreatePath } from '../lib/task-templates';

export const RegisterOrg: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    inn: '',
    address: '',
    contactPerson: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeData: false,
    agreeRules: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { registerUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (!formData.agreeData || !formData.agreeRules) {
      setError('Необходимо согласиться с правилами и обработкой данных');
      return;
    }

    if (!formData.name || !formData.inn || !formData.email || !formData.contactPerson) {
      setError('Заполните все обязательные поля');
      return;
    }

    // Basic INN validation (10 or 12 digits)
    if (!/^\d{10}$|^\d{12}$/.test(formData.inn)) {
      setError('ИНН должен содержать 10 или 12 цифр');
      return;
    }

    try {
      await registerUser('organization', {
        name: formData.name.trim(),
        inn: formData.inn.trim(),
        address: formData.address.trim(),
        contactPerson: formData.contactPerson.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        status: 'moderation'
      }, formData.password);

      setSuccess(true);
      setTimeout(() => {
        navigate(getPendingTaskTemplateCreatePath() || '/организация');
      }, 2000);
    } catch (err: any) {
      if (err.code !== 'auth/email-already-in-use') {
        console.error("Registration error:", err);
      }
      let errorMessage = 'Ошибка при регистрации. Пожалуйста, попробуйте еще раз.';
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Пользователь с таким email уже зарегистрирован.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Пароль слишком слабый. Он должен содержать не менее 6 символов.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Некорректный формат email адреса.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    }
  };

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-green-50 text-green-800 p-8 rounded-2xl max-w-md text-center border border-green-200">
          <h2 className="text-2xl font-bold mb-4">Заявка отправлена!</h2>
          <p>Ваша заявка на регистрацию организации принята и находится на модерации.</p>
          <p className="mt-2">Мы свяжемся с вами по указанным контактам.</p>
          <p className="text-sm mt-4 text-green-600">Перенаправление в личный кабинет...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-gray-100">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">Регистрация организации</h2>
          <p className="mt-2 text-gray-600">Присоединяйтесь к платформе для публикации задач</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Полное наименование организации *</label>
              <input type="text" name="name" required value={formData.name} onChange={handleChange} placeholder="Например: ГБУК НО «Нижегородский государственный художественный музей»" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ИНН *</label>
              <input type="text" name="inn" required value={formData.inn} onChange={handleChange} placeholder="10 или 12 цифр" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500" />
              <p className="mt-2 text-xs text-gray-500">
                Нужен только для модерации и проверки реальности организации. На публичной странице
                платформы ИНН не показывается.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Контактный телефон *</label>
              <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} placeholder="+7 (___) ___-__-__" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Фактический адрес *</label>
              <input type="text" name="address" required value={formData.address} onChange={handleChange} placeholder="г. Нижний Новгород, ул. ..." className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500" />
            </div>
            
            <div className="sm:col-span-2 pt-4 border-t border-gray-100">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Контактное лицо</h3>
            </div>
            
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">ФИО представителя *</label>
              <input type="text" name="contactPerson" required value={formData.contactPerson} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Рабочая электронная почта *</label>
              <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Придумайте пароль *</label>
              <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Повторите пароль *</label>
              <input type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500" />
            </div>

            <div className="sm:col-span-2 pt-4 border-t border-gray-100 space-y-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input id="agreeData" name="agreeData" type="checkbox" required checked={formData.agreeData} onChange={handleChange} className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded" />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="agreeData" className="font-medium text-gray-700">
                    Я согласен на обработку персональных данных в соответствии с Федеральным законом 152-ФЗ *
                  </label>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input id="agreeRules" name="agreeRules" type="checkbox" required checked={formData.agreeRules} onChange={handleChange} className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded" />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="agreeRules" className="font-medium text-gray-700">
                    Я ознакомлен с <Link to="/правила" className="text-blue-600 hover:underline">правилами площадки</Link> и подтверждаю достоверность указанных данных *
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button type="submit" className="w-full rounded-xl border border-transparent bg-blue-700 px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Подать заявку на регистрацию
            </button>
            <p className="mt-2 text-xs text-center text-gray-500">
              После отправки заявки администратор проверит данные организации.
            </p>
          </div>
          
          <div className="text-center text-sm">
            <Link to="/вход" className="font-medium text-blue-700 hover:text-blue-600">
              Уже есть аккаунт? Войти
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
