import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, ExternalLink } from 'lucide-react';
import { apiRequest } from '../lib/api';

interface SurveyListItem { id: string; title: string; description: string; sourceFile: string }

export const Surveys: React.FC = () => {
  const [surveys, setSurveys] = useState<SurveyListItem[]>([]);
  useEffect(() => { void apiRequest<{ surveys: SurveyListItem[] }>('/api/surveys').then((data) => setSurveys(data.surveys)); }, []);
  return <div className="mx-auto max-w-5xl space-y-8 py-8"><div><h1 className="text-3xl font-extrabold">Опросы и регистрации</h1><p className="mt-2 text-gray-600">Формы восстановлены по структуре исходных XLSX-выгрузок проекта.</p></div><div className="grid gap-5 md:grid-cols-2">{surveys.map((survey) => <Link key={survey.id} to={`/опросы/${survey.id}`} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"><ClipboardList className="h-8 w-8 text-blue-700"/><h2 className="mt-4 text-xl font-bold">{survey.title}</h2><p className="mt-2 text-sm leading-6 text-gray-600">{survey.description}</p><span className="mt-5 inline-flex items-center font-semibold text-blue-700">Открыть форму <ExternalLink className="ml-2 h-4 w-4"/></span></Link>)}</div></div>;
};
