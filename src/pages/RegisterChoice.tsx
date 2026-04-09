import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, GraduationCap, ArrowRight } from 'lucide-react';

export const RegisterChoice: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Выберите формат регистрации</h1>
        <p className="mt-3 text-gray-600">
          Студенты ищут и выполняют цифровые задачи. Организации публикуют задачи и мероприятия.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Link
          to="/регистрация-студент"
          className="group rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-300 hover:shadow-md sm:p-8"
        >
          <div className="mb-5 inline-flex rounded-2xl bg-blue-50 p-4 text-blue-700">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Я студент</h2>
          <p className="mt-3 text-gray-600">
            Зарегистрироваться, выбрать задачу, получить опыт, баллы и портфолио.
          </p>
          <div className="mt-6 inline-flex items-center text-sm font-semibold text-blue-700">
            Перейти к регистрации
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        <Link
          to="/регистрация-организация"
          className="group rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-300 hover:shadow-md sm:p-8"
        >
          <div className="mb-5 inline-flex rounded-2xl bg-orange-50 p-4 text-orange-700">
            <Building2 className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Я организация</h2>
          <p className="mt-3 text-gray-600">
            Подать заявку, публиковать задачи и привлекать студентов к цифровым проектам.
          </p>
          <div className="mt-6 inline-flex items-center text-sm font-semibold text-blue-700">
            Перейти к регистрации
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </div>
    </div>
  );
};
