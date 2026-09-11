import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../lib/api';

interface Survey { id: string; title: string; description: string; sourceFile: string; questions: Array<{ id: string; label: string; type: string }> }

export const SurveyDetails: React.FC = () => {
  const { id } = useParams();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => { void apiRequest<{ survey: Survey }>(`/api/surveys/${id}`).then((data) => setSurvey(data.survey)); }, [id]);
  if (!survey) return <div>Загрузка формы...</div>;
  if (submitted) return <div className="mx-auto max-w-xl rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-700"/><h1 className="mt-4 text-2xl font-bold">Ответ сохранён локально</h1><p className="mt-2 text-emerald-900">Демонстрационная форма воспроизводит структуру выгрузки. Для рабочего сбора ответов подключается выбранный владельцем сервис форм.</p><Link to="/опросы" className="mt-6 inline-flex font-semibold text-blue-700">К списку форм</Link></div>;
  return <form onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }} className="mx-auto max-w-2xl space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-9"><div><h1 className="text-3xl font-extrabold">{survey.title}</h1><p className="mt-2 text-gray-600">{survey.description}</p><p className="mt-2 text-xs text-gray-400">Источник: {survey.sourceFile}</p></div>{survey.questions.map((question) => <label key={question.id} className="block"><span className="text-sm font-semibold text-gray-800">{question.label}</span><input required className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3"/></label>)}<button className="w-full rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800">Отправить</button></form>;
};
