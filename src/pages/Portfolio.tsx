import React, { useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Link } from 'react-router-dom';
import { Award, Briefcase, Calendar, Star, Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { getTaskHref } from '../lib/tasks';

export const Portfolio: React.FC = () => {
  const { user } = useAuth();
  const { tasks, responses } = useData();
  const portfolioRef = useRef<HTMLDivElement>(null);

  if (!user || user.role !== 'student') {
    return <div>Доступ запрещен</div>;
  }

  const completedResponses = responses.filter(r => r.studentId === user.id && r.status === 'completed');
  
  const portfolioItems = completedResponses.map(r => {
    const task = tasks.find(t => t.id === r.taskId);
    return { ...r, task };
  }).filter(r => r.task);

  const totalPoints = user.points || 0;
  const completedCount = completedResponses.length;
  
  const uniqueOrgs = new Set(portfolioItems.map(item => item.task?.organizationId)).size;
  const reviewsCount = portfolioItems.filter(item => item.reviewComment).length;
  
  // Extract unique categories as skills from tasks, and combine with user's registered skills
  const taskSkills = Array.from(new Set(portfolioItems.map(item => item.task?.category).filter(Boolean)));
  const userSkills = (user.skills || []).filter((skill) => skill !== 'Другое (укажите)');
  const skills = Array.from(new Set([...userSkills, ...taskSkills]));

  const handleDownloadPDF = async () => {
    if (!portfolioRef.current) return;
    
    try {
      // Temporarily add a class to ensure the element is styled for print/pdf
      portfolioRef.current.classList.add('pdf-export-mode');
      
      const imgData = await toPng(portfolioRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });
      
      portfolioRef.current.classList.remove('pdf-export-mode');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const horizontalMargin = 8;
      const usableWidth = pageWidth - horizontalMargin * 2;
      const elementWidth = portfolioRef.current.offsetWidth;
      const elementHeight = portfolioRef.current.offsetHeight;
      const scaledImageHeight = (elementHeight * usableWidth) / elementWidth;
      
      let heightLeft = scaledImageHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', horizontalMargin, position, usableWidth, scaledImageHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - scaledImageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', horizontalMargin, position, usableWidth, scaledImageHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `portfolio_${user.name || user.firstName}.pdf`;
      const blob = pdf.output('blob');
      const file = new File([blob], fileName, { type: 'application/pdf' });
      const isMobileViewport = window.matchMedia('(max-width: 768px)').matches;

      if (
        isMobileViewport &&
        'share' in navigator &&
        'canShare' in navigator &&
        navigator.canShare?.({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: 'Портфолио студента',
        });
        return;
      }

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        if (portfolioRef.current) {
          portfolioRef.current.classList.remove('pdf-export-mode');
        }
        return;
      }

      console.error('Error generating PDF:', error);
      alert('Произошла ошибка при создании PDF. Пожалуйста, попробуйте еще раз.');
      if (portfolioRef.current) {
        portfolioRef.current.classList.remove('pdf-export-mode');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Мое портфолио</h1>
          <p className="mt-2 text-gray-600">Ваши достижения и выполненные проекты</p>
        </div>
        <button 
          onClick={handleDownloadPDF}
          className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Скачать PDF-резюме
        </button>
      </div>

      <div ref={portfolioRef} className="bg-gray-50 p-4 rounded-xl print:bg-white print:p-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-sm flex flex-col justify-between print:text-black print:bg-none print:border print:border-gray-200">
            <div>
              <p className="text-blue-100 font-medium mb-1 print:text-gray-500">Студент</p>
              <h2 className="text-2xl font-bold mb-4 text-white print:text-black">{user.name || `${user.firstName} ${user.lastName}`.trim()}</h2>
              <div className="space-y-2 text-sm text-blue-50 print:text-gray-600">
                <p>{user.university || 'Университет не указан'}</p>
                <p>{user.course ? `${user.course} курс` : 'Курс не указан'}</p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-blue-500/30 flex justify-between items-end print:border-gray-200">
              <div>
                <p className="text-blue-200 text-xs uppercase tracking-wider mb-1 print:text-gray-500">Рейтинг</p>
                <div className="flex items-center text-xl font-bold">
                  <Star className="w-5 h-5 mr-1 fill-current text-amber-400" />
                  4.9
                </div>
              </div>
              <div className="text-right">
                <p className="text-blue-200 text-xs uppercase tracking-wider mb-1 print:text-gray-500">Баллы</p>
                <p className="text-2xl font-bold">{totalPoints}</p>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Award className="w-6 h-6 mr-2 text-blue-600" />
              Статистика и навыки
            </h3>
            <div className="mb-8 grid grid-cols-2 gap-4 text-center sm:grid-cols-4 sm:gap-6">
              <div className="min-w-0 rounded-2xl border border-gray-100 bg-gray-50 px-2 py-4">
                <p className="mb-1 text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">{completedCount}</p>
                <p className="text-xs leading-tight text-gray-500 sm:text-sm">Проектов</p>
              </div>
              <div className="min-w-0 rounded-2xl border border-gray-100 bg-gray-50 px-2 py-4">
                <p className="mb-1 text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">{uniqueOrgs}</p>
                <p className="break-words text-xs leading-tight text-gray-500 sm:text-sm">Организации</p>
              </div>
              <div className="min-w-0 rounded-2xl border border-gray-100 bg-gray-50 px-2 py-4">
                <p className="mb-1 text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">{reviewsCount}</p>
                <p className="text-xs leading-tight text-gray-500 sm:text-sm">Отзывов</p>
              </div>
              <div className="min-w-0 rounded-2xl border border-gray-100 bg-gray-50 px-2 py-4">
                <p className="mb-1 text-lg font-bold leading-tight tracking-tight text-gray-900 sm:text-3xl">Топ 10%</p>
                <p className="text-xs leading-tight text-gray-500 sm:text-sm">В рейтинге</p>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Подтвержденные навыки</h4>
              <div className="flex flex-wrap gap-2">
                {skills.length > 0 ? (
                  skills.map((skill, index) => (
                    <span key={index} className="a11y-pill px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100">
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">Навыки появятся после выполнения задач</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Выполненные проекты</h2>
        
        <div className="space-y-6">
          {portfolioItems.length > 0 ? (
            portfolioItems.map(item => (
              <div key={item.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-900">
                      <Link to={getTaskHref(item.task!)} className="hover:text-blue-600 print:text-black print:no-underline">
                        {item.task?.title}
                      </Link>
                    </h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {item.task?.category}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Briefcase className="w-4 h-4 mr-1.5" />
                      {item.task?.organizationName}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1.5" />
                      Сдано: {new Date(item.updatedAt).toLocaleDateString('ru-RU')}
                    </div>
                    <div className="flex items-center font-medium text-amber-600">
                      <Star className="w-4 h-4 mr-1.5 fill-current" />
                      +{item.task?.pointsReward} баллов
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-4">
                    <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                      <span className="font-medium">Задача:</span> {item.task?.description}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Результат:</span> <a href={item.submissionLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{item.submissionLink}</a>
                    </p>
                  </div>

                  {item.reviewComment && (
                    <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs">
                            {item.task?.organizationName.charAt(0)}
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-xs font-medium text-gray-500 mb-1">Отзыв заказчика</p>
                          <p className="text-sm text-gray-800 italic">"{item.reviewComment}"</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm print:hidden">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Пока нет выполненных проектов</h3>
              <p className="text-gray-500 mb-6">Возьмите свою первую задачу в работу, чтобы начать формировать портфолио.</p>
              <Link to="/задачи" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                Перейти в каталог задач
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
