import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const OTHER_SKILL_OPTION = 'Другое (укажите)';

const SKILLS_LIST = [
  'Программирование',
  'Веб-разработка',
  'Графический дизайн',
  'Тексты и переводы',
  'Социальные сети',
  'Видео и аудио',
  OTHER_SKILL_OPTION
];

export const RegisterStudent: React.FC = () => {
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    middleName: '',
    email: '',
    password: '',
    confirmPassword: '',
    university: '',
    otherUniversity: '',
    course: 1,
    specialty: '',
    skills: [] as string[],
    otherSkill: '',
    agreeData: false,
    agreeRules: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { registerUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      if (name === 'agreeData' || name === 'agreeRules') {
        setFormData({ ...formData, [name]: checked });
      } else {
        // Handle skills checkboxes
        if (checked) {
          setFormData({ ...formData, skills: [...formData.skills, name] });
        } else {
          setFormData({
            ...formData,
            skills: formData.skills.filter(s => s !== name),
            otherSkill: name === OTHER_SKILL_OPTION ? '' : formData.otherSkill,
          });
        }
      }
    } else {
      setFormData({
        ...formData,
        [name]: name === 'course' ? Number(value) : value,
        ...(name === 'university' && value !== 'Другое' ? { otherUniversity: '' } : {}),
      });
    }
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

    if (!formData.lastName || !formData.firstName || !formData.email || !formData.university || !formData.specialty) {
      setError('Заполните все обязательные поля');
      return;
    }

    if (formData.university === 'Другое' && !formData.otherUniversity.trim()) {
      setError('Укажите учебное заведение');
      return;
    }

    if (formData.skills.includes(OTHER_SKILL_OPTION) && !formData.otherSkill.trim()) {
      setError('Если выбрали "Другое", укажите свой навык');
      return;
    }

    const finalUniversity =
      formData.university === 'Другое' ? formData.otherUniversity.trim() : formData.university;

    const finalSkills = formData.skills.filter((skill) => skill !== OTHER_SKILL_OPTION);
    if (formData.skills.includes(OTHER_SKILL_OPTION) && formData.otherSkill.trim()) {
      finalSkills.push(formData.otherSkill.trim());
    }

    try {
      await registerUser('student', {
        lastName: formData.lastName.trim(),
        firstName: formData.firstName.trim(),
        middleName: formData.middleName.trim(),
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
        email: formData.email.trim(),
        university: finalUniversity,
        course: formData.course,
        description: formData.specialty.trim(), // Using description for specialty
        skills: finalSkills,
      }, formData.password);
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/студент');
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
          <h2 className="text-2xl font-bold mb-4">Регистрация успешна!</h2>
          <p>Вы успешно зарегистрированы в системе.</p>
          <p className="text-sm mt-4 text-green-600">Перенаправление в личный кабинет...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-gray-100">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">Регистрация студента</h2>
          <p className="mt-2 text-gray-600">Создайте профиль для поиска задач</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия *</label>
              <input type="text" name="lastName" required value={formData.lastName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Имя *</label>
              <input type="text" name="firstName" required value={formData.firstName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Отчество</label>
              <input type="text" name="middleName" value={formData.middleName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Адрес электронной почты *</label>
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
            
            <div className="sm:col-span-2 pt-4 border-t border-gray-100">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Образование</h3>
            </div>
            
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Учебное заведение *</label>
              <select name="university" required value={formData.university} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-white">
                <option value="">Выберите учебное заведение</option>
                <option value="ННГУ им. Лобачевского">ННГУ им. Лобачевского</option>
                <option value="НГТУ им. Алексеева">НГТУ им. Алексеева</option>
                <option value="НИУ ВШЭ - Нижний Новгород">НИУ ВШЭ - Нижний Новгород</option>
                <option value="НГЛУ им. Добролюбова">НГЛУ им. Добролюбова</option>
                <option value="Мининский университет">Мининский университет</option>
                <option value="Нижегородский радиотехнический колледж">Нижегородский радиотехнический колледж</option>
                <option value="Другое">Другое</option>
              </select>
            </div>
            {formData.university === 'Другое' && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Укажите учебное заведение *</label>
                <input
                  type="text"
                  name="otherUniversity"
                  required
                  value={formData.otherUniversity}
                  onChange={handleChange}
                  placeholder="Введите название вуза или колледжа"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Курс обучения *</label>
              <select name="course" required value={formData.course} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-white">
                {[1, 2, 3].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Направление подготовки *</label>
              <input type="text" name="specialty" required value={formData.specialty} onChange={handleChange} placeholder="Например: Программная инженерия" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500" />
            </div>

            <div className="sm:col-span-2 pt-4 border-t border-gray-100">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Навыки</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {SKILLS_LIST.map(skill => (
                  <div key={skill} className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id={`skill-${skill}`}
                        name={skill}
                        type="checkbox"
                        checked={formData.skills.includes(skill)}
                        onChange={handleChange}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor={`skill-${skill}`} className="font-medium text-gray-700">{skill}</label>
                    </div>
                  </div>
                ))}
              </div>
              {formData.skills.includes(OTHER_SKILL_OPTION) && (
                <div className="mt-3">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Уточните навык *</label>
                  <input
                    type="text"
                    name="otherSkill"
                    value={formData.otherSkill}
                    onChange={handleChange}
                    placeholder="Например: UX-исследования, саунд-дизайн, motion-дизайн"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Можно указать один основной навык, по которому вас будут находить для задач и команды.
                  </p>
                </div>
              )}
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
                    Я ознакомлен с <Link to="/правила" className="text-blue-600 hover:underline">правилами площадки</Link> *
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button type="submit" className="w-full rounded-xl border border-transparent bg-blue-700 px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Зарегистрироваться
            </button>
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
