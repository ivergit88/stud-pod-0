import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Calendar, Star, CheckCircle, Clock, AlertCircle, Send, Pencil, Trash2, Paperclip, MapPin } from 'lucide-react';
import { getTaskFormatLabel } from '../lib/tasks';
import { getTaskTypeLabel, getTaskUrgencyLabel, getTaskWorkloadLabel } from '../lib/task-scoring';

export const TaskDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { tasks, responses, takeTask, submitTask, reviewTask, deleteTask } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [submissionLink, setSubmissionLink] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewStatus, setReviewStatus] = useState<'completed' | 'needs_revision'>('completed');
  const [coverLetter, setCoverLetter] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const task = tasks.find(t => t.id === id || t.slug === id);

  if (!task) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Задача не найдена</h2>
        <Link to="/задачи" className="text-blue-600 hover:text-blue-800 font-medium">
          Вернуться к каталогу
        </Link>
      </div>
    );
  }

  const isOrgOwner = user?.role === 'organization' && user.id === task.organizationId;
  const isStudent = user?.role === 'student';
  
  const studentResponse = isStudent ? responses.find(r => r.taskId === task.id && r.studentId === user.id) : null;
  const allResponses = isOrgOwner ? responses.filter(r => r.taskId === task.id) : [];
  const canEditTask = isOrgOwner && task.status === 'open';
  const canDeleteTask = isOrgOwner && task.status === 'open' && allResponses.length === 0;

  const handleTakeTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user && user.role === 'student') {
      try {
        await takeTask(task.id, user.id, user.name, coverLetter);
      } catch (error) {
        console.error("Failed to take task", error);
        alert("Ошибка при отклике на задачу");
      }
    } else {
      navigate('/вход');
    }
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (studentResponse) {
      try {
        await submitTask(studentResponse.id, submissionLink);
      } catch (error) {
        console.error("Failed to submit task", error);
        alert("Ошибка при отправке задачи");
      }
    }
  };

  const handleReviewTask = async (responseId: string, e: React.FormEvent) => {
    e.preventDefault();
    try {
      await reviewTask(responseId, reviewStatus, reviewComment);
      setReviewComment('');
    } catch (error) {
      console.error("Failed to review task", error);
      alert("Ошибка при проверке задачи");
    }
  };

  const handleDeleteTask = async () => {
    const shouldDelete = window.confirm(`Удалить задачу "${task.title}"? Это действие нельзя отменить.`);
    if (!shouldDelete) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteTask(task.id);
      navigate('/организация');
    } catch (error) {
      console.error('Failed to delete task', error);
      alert('Не удалось удалить задачу. Если по ней уже есть отклики, удаление запрещено.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link to={isOrgOwner ? "/организация" : "/задачи"} className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
          &larr; Назад
        </Link>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-8 md:p-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {task.category}
                </span>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    task.format === 'online'
                      ? 'bg-blue-50 text-blue-700'
                      : task.format === 'hybrid'
                        ? 'bg-violet-50 text-violet-700'
                        : 'bg-orange-50 text-orange-700'
                  }`}
                >
                  {getTaskFormatLabel(task.format)}
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900">{task.title}</h1>
            </div>
            <div className="flex flex-col items-stretch gap-3">
              <div className="flex items-center justify-center text-2xl font-bold text-amber-500 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">
                <Star className="w-6 h-6 mr-2 fill-current" />
                {task.pointsReward} баллов
              </div>
              {isOrgOwner && (
                <div className="flex flex-wrap gap-3">
                  {canEditTask && (
                    <Link
                      to={`/организация/задачи/${task.id}/редактировать`}
                      className="inline-flex items-center justify-center px-4 py-2 bg-blue-50 text-blue-700 font-medium rounded-xl hover:bg-blue-100 transition-colors"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Изменить
                    </Link>
                  )}
                  {canDeleteTask && (
                    <button
                      type="button"
                      onClick={handleDeleteTask}
                      disabled={isDeleting}
                      className="inline-flex items-center justify-center px-4 py-2 bg-red-50 text-red-700 font-medium rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {isDeleting ? 'Удаление...' : 'Удалить'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-gray-600">
            <div className="flex items-center">
              <Briefcase className="w-5 h-5 mr-3 text-gray-400" />
              <span className="font-medium">{task.organizationName}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-3 text-gray-400" />
              <span>Дедлайн: <span className="font-medium">{new Date(task.deadline).toLocaleDateString('ru-RU')}</span></span>
            </div>
            {(task.location || task.organizationAddress) && (
              <div className="flex items-center">
                <MapPin className="w-5 h-5 mr-3 text-gray-400" />
                <span className="font-medium">{task.location || task.organizationAddress}</span>
              </div>
            )}
          </div>

          {task.format === 'online' && (
            <div className="mb-8 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-900">
              Формат задачи: онлайн. Если на карте указана метка, она показывает учреждение-заказчика,
              выезд студенту не требуется.
            </div>
          )}

          <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-gray-500">Тип</div>
              <div className="mt-2 font-semibold text-gray-900">{getTaskTypeLabel(task.taskType)}</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-gray-500">Трудоемкость</div>
              <div className="mt-2 font-semibold text-gray-900">{getTaskWorkloadLabel(task.workload)}</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-gray-500">Срочность</div>
              <div className="mt-2 font-semibold text-gray-900">{getTaskUrgencyLabel(task.urgency)}</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-gray-500">Исходные материалы от организации</div>
              <div className="mt-2 font-semibold text-gray-900">
                {task.requiresOrgMaterials ? 'Нужны' : 'Не нужны'}
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-gray-500">Очная проверка / выезд</div>
              <div className="mt-2 font-semibold text-gray-900">
                {task.requiresOnsiteCheck ? 'Да' : 'Нет'}
              </div>
            </div>
          </div>

          <div className="mb-8 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4">
            <div className="text-sm font-semibold text-amber-900">Как сформированы баллы</div>
            <div className="mt-2 text-sm text-amber-800">
              Системный диапазон: {task.pointsMin}-{task.pointsMax} баллов. Базовая рекомендация:
              {' '}{task.pointsRecommended} баллов.
            </div>
            {task.pointsExplanation.length > 0 && (
              <div className="mt-3 space-y-1 text-sm text-amber-900">
                {task.pointsExplanation.map((item) => (
                  <div key={item}>{item}</div>
                ))}
              </div>
            )}
          </div>

          <div className="prose max-w-none text-gray-700 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Описание задачи</h3>
            <p className="whitespace-pre-wrap">{task.description}</p>
          </div>

          {task.requirements && (
            <div className="prose max-w-none text-gray-700 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Требования</h3>
              <p className="whitespace-pre-wrap">{task.requirements}</p>
            </div>
          )}

          {task.attachments && task.attachments.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Дополнительные материалы</h3>
              <div className="space-y-3">
                {task.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center text-gray-900 font-medium truncate">
                        <Paperclip className="w-4 h-4 mr-2 flex-shrink-0 text-blue-600" />
                        <span className="truncate">{attachment.originalName}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {(attachment.size / 1024 / 1024).toFixed(2)} МБ
                      </div>
                    </div>
                    <span className="ml-4 text-sm font-medium text-blue-700">Скачать</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {task.materialsLink && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Материалы в облаке</h3>
              <a
                href={task.materialsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-blue-700 font-medium hover:bg-blue-100 transition-colors break-all"
              >
                <Paperclip className="w-4 h-4 mr-2 flex-shrink-0" />
                {task.materialsLink}
              </a>
            </div>
          )}

          {/* Student Actions */}
          {isStudent && (
            <div className="mt-10 pt-8 border-t border-gray-100">
              {!studentResponse ? (
                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                  <div className="mb-4">
                    <h4 className="text-lg font-bold text-blue-900 mb-1">Готовы взяться за задачу?</h4>
                    <p className="text-blue-700 text-sm">Внимательно изучите требования перед тем, как откликнуться.</p>
                  </div>
                  <form onSubmit={handleTakeTask} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Сопроводительное письмо (необязательно)</label>
                      <textarea
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Напишите, почему вы подходите для этой задачи..."
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      Откликнуться
                    </button>
                  </form>
                </div>
              ) : studentResponse.status === 'pending' || studentResponse.status === 'accepted' ? (
                <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
                  <div className="flex items-center mb-4">
                    <Clock className="w-6 h-6 text-amber-600 mr-2" />
                    <h4 className="text-lg font-bold text-amber-900">Задача в работе</h4>
                  </div>
                  <p className="text-amber-800 mb-6">Вы взяли эту задачу. Пожалуйста, отправьте результат до {new Date(task.deadline).toLocaleDateString('ru-RU')}.</p>
                  
                  <form onSubmit={handleSubmitTask} className="space-y-4 bg-white p-6 rounded-xl border border-amber-200">
                    <h5 className="font-bold text-gray-900">Сдача работы</h5>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка на результат (Яндекс Диск, Облако Mail.ru, GitFlic и т.д.)</label>
                      <input
                        type="url"
                        required
                        value={submissionLink}
                        onChange={(e) => setSubmissionLink(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://..."
                      />
                    </div>
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Отправить на проверку
                    </button>
                  </form>
                </div>
              ) : studentResponse.status === 'submitted' ? (
                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 flex items-center">
                  <Clock className="w-8 h-8 text-blue-500 mr-4" />
                  <div>
                    <h4 className="text-lg font-bold text-blue-900">Работа отправлена на проверку</h4>
                    <p className="text-blue-700">Организация проверяет ваш результат. Ожидайте начисления баллов.</p>
                  </div>
                </div>
              ) : studentResponse.status === 'completed' ? (
                <div className="bg-green-50 rounded-2xl p-6 border border-green-100 flex items-center">
                  <CheckCircle className="w-8 h-8 text-green-500 mr-4" />
                  <div>
                    <h4 className="text-lg font-bold text-green-900">Задача успешно выполнена!</h4>
                    <p className="text-green-700">Вам начислено {task.pointsReward} баллов.</p>
                  </div>
                </div>
              ) : studentResponse.status === 'rejected' || studentResponse.status === 'needs_revision' ? (
                <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
                  <div className="flex items-center mb-2">
                    <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
                    <h4 className="text-lg font-bold text-red-900">Работа требует доработки</h4>
                  </div>
                  <p className="text-red-700 mb-4">К сожалению, ваша работа не была принята с первого раза.</p>
                  {studentResponse.reviewComment && (
                    <div className="bg-white p-4 rounded-lg border border-red-200 mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">Комментарий проверяющего:</p>
                      <p className="text-gray-600">{studentResponse.reviewComment}</p>
                    </div>
                  )}
                  <form onSubmit={handleSubmitTask} className="space-y-4 bg-white p-6 rounded-xl border border-red-200">
                    <h5 className="font-bold text-gray-900">Повторная сдача работы</h5>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка на исправленный результат</label>
                      <input
                        type="url"
                        required
                        value={submissionLink}
                        onChange={(e) => setSubmissionLink(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://..."
                      />
                    </div>
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Отправить на проверку
                    </button>
                  </form>
                </div>
              ) : null}
            </div>
          )}

          {/* Organization Actions */}
          {isOrgOwner && (
            <div className="mt-10 pt-8 border-t border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Отклики студентов</h3>
              
              {allResponses.length > 0 ? (
                <div className="space-y-6">
                  {allResponses.map(response => (
                    <div key={response.id} className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">Студент: {response.studentName}</h4>
                          <p className="text-sm text-gray-500">Дата отклика: {new Date(response.createdAt).toLocaleDateString('ru-RU')}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          response.status === 'pending' || response.status === 'accepted' ? 'bg-amber-100 text-amber-800' :
                          response.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                          response.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {response.status === 'pending' || response.status === 'accepted' ? 'В работе' :
                           response.status === 'submitted' ? 'На проверке' :
                           response.status === 'completed' ? 'Принято' : 'Требует доработки'}
                        </span>
                      </div>

                      {response.coverLetter && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700">Сопроводительное письмо:</p>
                          <p className="text-gray-600 bg-white p-3 rounded-lg mt-1 border border-gray-200">{response.coverLetter}</p>
                        </div>
                      )}

                      {response.status === 'submitted' && (
                        <div className="bg-white p-6 rounded-xl border border-blue-200 mt-4">
                          <h5 className="font-bold text-gray-900 mb-2">Результат работы</h5>
                          <div className="mb-4">
                            <a href={response.submissionLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                              {response.submissionLink}
                            </a>
                          </div>

                          <form onSubmit={(e) => handleReviewTask(response.id, e)} className="space-y-4 border-t border-gray-100 pt-4">
                            <h5 className="font-bold text-gray-900">Проверка</h5>
                            <div className="flex space-x-4 mb-4">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="status"
                                  value="completed"
                                  checked={reviewStatus === 'completed'}
                                  onChange={() => setReviewStatus('completed')}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                                <span className="ml-2 text-sm text-gray-700 font-medium">Принять работу</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="status"
                                  value="needs_revision"
                                  checked={reviewStatus === 'needs_revision'}
                                  onChange={() => setReviewStatus('needs_revision')}
                                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                                />
                                <span className="ml-2 text-sm text-gray-700 font-medium">Отправить на доработку</span>
                              </label>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Комментарий к проверке</label>
                              <textarea
                                required
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                rows={3}
                                placeholder="Напишите отзыв..."
                              />
                            </div>
                            <button
                              type="submit"
                              className={`px-4 py-2 text-white font-medium rounded-lg transition-colors ${
                                reviewStatus === 'completed' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                              }`}
                            >
                              Сохранить решение
                            </button>
                          </form>
                        </div>
                      )}

                      {(response.status === 'completed' || response.status === 'needs_revision' || response.status === 'rejected') && response.reviewComment && (
                        <div className="mt-4 bg-white p-4 rounded-lg border border-gray-200">
                          <p className="text-sm font-medium text-gray-700 mb-1">Ваш комментарий:</p>
                          <p className="text-gray-600">{response.reviewComment}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Пока нет откликов на эту задачу.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
