import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Calendar, Star, CheckCircle, Clock, AlertCircle, Send, Pencil, Trash2, Paperclip, MapPin } from 'lucide-react';
import { getTaskFormatLabel } from '../lib/tasks';
import { getTaskTypeLabel, getTaskUrgencyLabel, getTaskWorkloadLabel } from '../lib/task-scoring';
import { isResponseLeader, isStudentInResponse } from '../lib/task-responses';

export const TaskDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    tasks,
    responses,
    studentsDirectory,
    takeTask,
    addTeamMember,
    removeTeamMember,
    submitTask,
    reviewTask,
    deleteTask,
  } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [submissionLink, setSubmissionLink] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewStatus, setReviewStatus] = useState<'completed' | 'needs_revision'>('completed');
  const [coverLetter, setCoverLetter] = useState('');
  const [teammateQuery, setTeammateQuery] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [teamActionStudentId, setTeamActionStudentId] = useState<string | null>(null);

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
  const parentTask = task.parentTaskId
    ? tasks.find((candidate) => candidate.id === task.parentTaskId)
    : null;
  const childTasks = task.taskKind === 'parent'
    ? tasks
        .filter((candidate) => candidate.parentTaskId === task.id)
        .sort((a, b) => a.childOrder - b.childOrder || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    : [];
  const siblingTasks = task.parentTaskId
    ? tasks
        .filter((candidate) => candidate.parentTaskId === task.parentTaskId && candidate.id !== task.id)
        .sort((a, b) => a.childOrder - b.childOrder || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    : [];
  const isProjectOverview = task.taskKind === 'parent';
  
  const studentResponse = isStudent
    ? responses.find((response) => response.taskId === task.id && isStudentInResponse(response, user.id))
    : null;
  const allResponses = isOrgOwner ? responses.filter(r => r.taskId === task.id) : [];
  const canEditTask = isOrgOwner && task.status === 'open' && task.taskKind !== 'parent';
  const canDeleteTask = isOrgOwner && task.status === 'open' && allResponses.length === 0 && task.taskKind !== 'parent';
  const isTeamLeader = Boolean(
    isStudent && user && studentResponse && isResponseLeader(studentResponse, user.id),
  );
  const canManageTeam = Boolean(
    isTeamLeader &&
      studentResponse &&
      (studentResponse.status === 'accepted' ||
        studentResponse.status === 'pending' ||
        studentResponse.status === 'needs_revision'),
  );
  const canSubmitResult = Boolean(studentResponse && isTeamLeader);
  const teamMembers = studentResponse?.teamMembers || [];
  const availableTeammates = isStudent
    ? studentsDirectory.filter((student) => {
        if (!user) {
          return false;
        }

        if (student.id === user.id) {
          return false;
        }

        if (teamMembers.some((member) => member.studentId === student.id)) {
          return false;
        }

        const haystack = [
          student.name,
          student.university,
          student.description,
          ...(student.skills || []),
        ]
          .join(' ')
          .toLowerCase();

        return haystack.includes(teammateQuery.trim().toLowerCase());
      })
    : [];

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

  const handleAddTeamMember = async (studentId: string) => {
    if (!studentResponse) {
      return;
    }

    setTeamActionStudentId(studentId);
    try {
      await addTeamMember(studentResponse.id, studentId);
    } catch (error) {
      console.error('Failed to add team member', error);
      alert('Не удалось добавить участника команды');
    } finally {
      setTeamActionStudentId(null);
    }
  };

  const handleRemoveTeamMember = async (studentId: string) => {
    if (!studentResponse) {
      return;
    }

    setTeamActionStudentId(studentId);
    try {
      await removeTeamMember(studentResponse.id, studentId);
    } catch (error) {
      console.error('Failed to remove team member', error);
      alert('Не удалось убрать участника из команды');
    } finally {
      setTeamActionStudentId(null);
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
                {task.taskKind === 'parent' && (
                  <span className="a11y-task-chip a11y-force-accent inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                    Проект с подзадачами
                  </span>
                )}
                {task.parentTaskTitle && (
                  <span className="a11y-task-chip a11y-force-accent inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                    Часть проекта
                  </span>
                )}
                <span className="a11y-task-chip a11y-force-accent inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {task.category}
                </span>
                <span
                  className={`a11y-task-chip a11y-force-accent inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    task.format === 'online'
                      ? 'bg-blue-50 text-blue-700'
                      : task.format === 'hybrid'
                        ? 'bg-violet-50 text-violet-700'
                        : 'bg-orange-50 text-orange-700'
                  }`}
                >
                  {getTaskFormatLabel(task.format)}
                </span>
                <span className="a11y-task-chip a11y-force-accent inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                  {task.status === 'open'
                    ? 'Опубликована'
                    : task.status === 'in_progress'
                      ? 'В работе'
                      : task.status === 'review'
                        ? 'На проверке'
                        : task.status === 'completed'
                          ? 'Завершена'
                          : 'Отменена'}
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900">{task.title}</h1>
            </div>
            <div className="flex flex-col items-stretch gap-3">
              <div className="a11y-task-points a11y-force-accent flex items-center justify-center rounded-xl border border-amber-100 bg-amber-50 px-4 py-2 text-2xl font-bold text-amber-500">
                <Star className="w-6 h-6 mr-2 fill-current" />
                {task.taskKind === 'parent' ? `${task.pointsReward} баллов суммарно` : `${task.pointsReward} баллов`}
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

          {isProjectOverview && (
            <div className="mb-8 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4">
              <div className="text-sm font-semibold text-emerald-900">Как работает этот проект</div>
              <div className="mt-2 text-sm leading-6 text-emerald-900">
                Организация опубликовала одну большую задачу, а система разбила её на отдельные
                подзадачи. Студенты откликаются не на весь проект сразу, а на конкретные
                подзадачи ниже.
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-white px-3 py-1 font-medium text-emerald-800">
                  Подзадач: {childTasks.length}
                </span>
                <span className="rounded-full bg-white px-3 py-1 font-medium text-emerald-800">
                  Завершено: {childTasks.filter((item) => item.status === 'completed').length}
                </span>
              </div>
            </div>
          )}

          {parentTask && (
            <div className="mb-8 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4">
              <div className="text-sm font-semibold text-emerald-900">Эта задача входит в проект</div>
              <div className="mt-2 text-lg font-bold text-gray-900">{parentTask.title}</div>
              <div className="mt-2 text-sm leading-6 text-gray-700">{parentTask.description}</div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to={parentTask.slug ? `/задачи/${parentTask.slug}` : `/задачи/${parentTask.id}`}
                  className="inline-flex items-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 transition-colors"
                >
                  Открыть обзор проекта
                </Link>
                <span className="rounded-full bg-white px-3 py-2 text-xs font-medium text-emerald-800">
                  Всего подзадач: {parentTask.subtaskCount}
                </span>
              </div>
            </div>
          )}

          {siblingTasks.length > 0 && (
            <div className="mb-8 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4">
              <div className="text-sm font-semibold text-gray-900">Другие подзадачи этого проекта</div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {siblingTasks.map((siblingTask) => (
                  <Link
                    key={siblingTask.id}
                    to={`/задачи/${siblingTask.slug || siblingTask.id}`}
                    className="rounded-2xl border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-blue-300 hover:bg-blue-50"
                  >
                    <div className="text-sm font-semibold text-gray-900">{siblingTask.title}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      {siblingTask.pointsReward} баллов • {new Date(siblingTask.deadline).toLocaleDateString('ru-RU')}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="a11y-surface-card rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-gray-500">Тип</div>
              <div className="mt-2 font-semibold text-gray-900">{getTaskTypeLabel(task.taskType)}</div>
            </div>
            <div className="a11y-surface-card rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-gray-500">Трудоемкость</div>
              <div className="mt-2 font-semibold text-gray-900">{getTaskWorkloadLabel(task.workload)}</div>
            </div>
            <div className="a11y-surface-card rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-gray-500">Срочность</div>
              <div className="mt-2 font-semibold text-gray-900">{getTaskUrgencyLabel(task.urgency)}</div>
            </div>
            <div className="a11y-surface-card rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-gray-500">Исходные материалы от организации</div>
              <div className="mt-2 font-semibold text-gray-900">
                {task.requiresOrgMaterials ? 'Нужны' : 'Не нужны'}
              </div>
            </div>
            <div className="a11y-surface-card rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-gray-500">Очная проверка / выезд</div>
              <div className="mt-2 font-semibold text-gray-900">
                {task.requiresOnsiteCheck ? 'Да' : 'Нет'}
              </div>
            </div>
          </div>

          <div className="a11y-surface-card a11y-force-surface mb-8 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4">
            <div className="text-sm font-semibold text-gray-900">Как сформированы баллы</div>
            <div className="mt-2 text-sm text-gray-700">
              Системный диапазон: {task.pointsMin}-{task.pointsMax} баллов. Базовая рекомендация:
              {' '}{task.pointsRecommended} баллов.
            </div>
            {task.pointsExplanation.length > 0 && (
              <div className="mt-3 space-y-1 text-sm text-gray-800">
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

          {isProjectOverview && childTasks.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Подзадачи проекта</h3>
              <div className="space-y-4">
                {childTasks.map((childTask) => (
                  <div key={childTask.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2">
                          <span className="a11y-task-chip a11y-force-accent rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                            {childTask.category}
                          </span>
                          <span className="a11y-task-chip a11y-force-accent rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                            {childTask.status === 'open'
                              ? 'Опубликована'
                              : childTask.status === 'in_progress'
                                ? 'В работе'
                                : childTask.status === 'review'
                                  ? 'На проверке'
                                  : childTask.status === 'completed'
                                    ? 'Завершена'
                                    : 'Отменена'}
                          </span>
                        </div>
                        <div className="mt-3 text-lg font-bold text-gray-900">{childTask.title}</div>
                        <div className="mt-2 text-sm leading-6 text-gray-700">{childTask.description}</div>
                      </div>
                      <div className="flex flex-col items-start gap-3">
                        <div className="a11y-task-points a11y-force-accent rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                          {childTask.pointsReward} баллов
                        </div>
                        <Link
                          to={`/задачи/${childTask.slug || childTask.id}`}
                          className="inline-flex items-center rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 transition-colors"
                        >
                          Открыть подзадачу
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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

          {parentTask?.attachments && parentTask.attachments.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Материалы проекта</h3>
              <div className="space-y-3">
                {parentTask.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 hover:border-emerald-300 hover:bg-emerald-100 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center text-gray-900 font-medium truncate">
                        <Paperclip className="w-4 h-4 mr-2 flex-shrink-0 text-emerald-700" />
                        <span className="truncate">{attachment.originalName}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {(attachment.size / 1024 / 1024).toFixed(2)} МБ
                      </div>
                    </div>
                    <span className="ml-4 text-sm font-medium text-emerald-800">Скачать</span>
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

          {parentTask?.materialsLink && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Облачные материалы проекта</h3>
              <a
                href={parentTask.materialsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 font-medium hover:bg-emerald-100 transition-colors break-all"
              >
                <Paperclip className="w-4 h-4 mr-2 flex-shrink-0" />
                {parentTask.materialsLink}
              </a>
            </div>
          )}

          {/* Student Actions */}
          {isStudent && !isProjectOverview && (
            <div className="mt-10 pt-8 border-t border-gray-100">
              {!studentResponse ? (
                <div className="a11y-force-surface rounded-2xl border border-blue-100 bg-blue-50 p-6">
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
                      className="a11y-force-accent w-full rounded-xl bg-blue-600 px-6 py-3 font-medium text-white shadow-sm transition-colors hover:bg-blue-700 sm:w-auto"
                    >
                      Откликнуться
                    </button>
                  </form>
                </div>
              ) : studentResponse.status === 'pending' || studentResponse.status === 'accepted' ? (
                <div className="a11y-force-surface rounded-2xl border border-amber-100 bg-amber-50 p-6">
                  <div className="flex items-center mb-4">
                    <Clock className="w-6 h-6 text-amber-600 mr-2" />
                    <h4 className="text-lg font-bold text-amber-900">Задача в работе</h4>
                  </div>
                  <p className="text-amber-800 mb-6">
                    {canSubmitResult
                      ? `Вы как лидер команды отвечаете за отправку результата до ${new Date(task.deadline).toLocaleDateString('ru-RU')}.`
                      : `Вы участвуете в команде по этой задаче. Лидер команды отправит общий результат до ${new Date(task.deadline).toLocaleDateString('ru-RU')}.`}
                  </p>

                  {canSubmitResult ? (
                    <form onSubmit={handleSubmitTask} className="a11y-force-surface space-y-4 rounded-xl border border-amber-200 bg-white p-6">
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
                        className="a11y-force-accent inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Отправить на проверку
                      </button>
                    </form>
                  ) : (
                    <div className="rounded-xl border border-amber-200 bg-white px-5 py-4 text-sm text-amber-900">
                      Вы можете открыть полное ТЗ и следить за статусом, но отправка результата доступна только лидеру команды.
                    </div>
                  )}
                </div>
              ) : studentResponse.status === 'submitted' ? (
                <div className="a11y-force-surface flex items-center rounded-2xl border border-blue-100 bg-blue-50 p-6">
                  <Clock className="w-8 h-8 text-blue-500 mr-4" />
                  <div>
                    <h4 className="text-lg font-bold text-blue-900">Работа отправлена на проверку</h4>
                    <p className="text-blue-700">Организация проверяет ваш результат. Ожидайте начисления баллов.</p>
                  </div>
                </div>
              ) : studentResponse.status === 'completed' ? (
                <div className="a11y-force-surface flex items-center rounded-2xl border border-green-100 bg-green-50 p-6">
                  <CheckCircle className="w-8 h-8 text-green-500 mr-4" />
                  <div>
                    <h4 className="text-lg font-bold text-green-900">Задача успешно выполнена!</h4>
                    <p className="text-green-700">Вам начислено {task.pointsReward} баллов.</p>
                  </div>
                </div>
              ) : studentResponse.status === 'rejected' || studentResponse.status === 'needs_revision' ? (
                <div className="a11y-force-surface rounded-2xl border border-red-100 bg-red-50 p-6">
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
                  {canSubmitResult ? (
                    <form onSubmit={handleSubmitTask} className="a11y-force-surface space-y-4 rounded-xl border border-red-200 bg-white p-6">
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
                        className="a11y-force-accent inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Отправить на проверку
                      </button>
                    </form>
                  ) : (
                    <div className="rounded-xl border border-red-200 bg-white px-5 py-4 text-sm text-red-900">
                      Организация вернула работу на доработку. Исправления собирает и повторно отправляет лидер команды.
                    </div>
                  )}
                </div>
              ) : null}

              {studentResponse && (
                <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">Команда по задаче</h4>
                      <p className="mt-1 text-sm text-gray-600">
                        Лидер собирает состав из анкет студентов платформы. После принятия работы баллы начисляются каждому участнику команды в полном объёме.
                      </p>
                    </div>
                    <div className="a11y-task-chip a11y-force-accent inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                      Участников: {teamMembers.length} / 5
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      to={`/сокомандники?response=${studentResponse.id}`}
                      className="inline-flex items-center rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-800 transition-colors"
                    >
                      Открыть отдельный подбор команды
                    </Link>
                    {teamMembers.map((member) => (
                      <div
                        key={member.studentId}
                        className="min-w-0 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 md:w-auto"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="break-words font-semibold text-gray-900">{member.studentName}</div>
                          <span className="a11y-task-chip a11y-force-accent rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-700">
                            {member.role === 'leader' ? 'Лидер' : 'Участник'}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {[member.university, member.course ? `${member.course} курс` : ''].filter(Boolean).join(' • ') || 'Анкета без уточнений'}
                        </div>
                        {member.skills && member.skills.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {member.skills.slice(0, 3).map((skill) => (
                              <span key={skill} className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                        {canManageTeam && member.role !== 'leader' && (
                          <button
                            type="button"
                            onClick={() => void handleRemoveTeamMember(member.studentId)}
                            disabled={teamActionStudentId === member.studentId}
                            className="mt-3 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                          >
                            {teamActionStudentId === member.studentId ? 'Убираем...' : 'Убрать из команды'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {canManageTeam && (
                    <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                      <h5 className="text-base font-bold text-blue-900">Подобрать сокомандников по анкетам</h5>
                      <p className="mt-1 text-sm text-blue-800">
                        Ищите студентов по имени, вузу, описанию профиля и навыкам. Добавленные участники сразу увидят задачу у себя в кабинете.
                      </p>
                      <input
                        type="text"
                        value={teammateQuery}
                        onChange={(e) => setTeammateQuery(e.target.value)}
                        placeholder="Например: дизайнер, монтаж, МГУ..."
                        className="mt-4 w-full rounded-xl border border-blue-200 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {availableTeammates.length > 0 ? (
                          availableTeammates.slice(0, 8).map((student) => (
                            <div key={student.id} className="min-w-0 rounded-2xl border border-blue-100 bg-white p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="break-words font-semibold text-gray-900">{student.name}</div>
                                  <div className="mt-1 text-xs text-gray-500">
                                    {[student.university, student.course ? `${student.course} курс` : ''].filter(Boolean).join(' • ') || 'Анкета без уточнений'}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => void handleAddTeamMember(student.id)}
                                  disabled={teamActionStudentId === student.id}
                                  className="inline-flex shrink-0 items-center rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                  {teamActionStudentId === student.id ? 'Добавляем...' : 'В команду'}
                                </button>
                              </div>
                              {student.description && (
                                <p className="mt-3 line-clamp-3 text-sm text-gray-600">{student.description}</p>
                              )}
                              {student.skills && student.skills.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {student.skills.slice(0, 4).map((skill) => (
                                    <span key={skill} className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <div className="mt-3 text-xs text-gray-500">
                                Выполнено задач: {student.completedTasksCount} • Баллы: {student.points}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-2xl border border-blue-100 bg-white p-4 text-sm text-gray-600 md:col-span-2">
                            По текущему запросу подходящих анкет не найдено.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Organization Actions */}
          {isOrgOwner && (
            <div className="mt-10 pt-8 border-t border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                {isProjectOverview ? 'Контур проекта' : 'Отклики студентов'}
              </h3>

              {isProjectOverview ? (
                childTasks.length > 0 ? (
                  <div className="space-y-4">
                    {childTasks.map((childTask) => {
                      const childResponses = responses.filter((response) => response.taskId === childTask.id);

                      return (
                        <div key={childTask.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap gap-2">
                                <span className="a11y-task-chip a11y-force-accent rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                                  {childTask.category}
                                </span>
                                <span className="a11y-task-chip a11y-force-accent rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                                  {childTask.status === 'open'
                                    ? 'Опубликована'
                                    : childTask.status === 'in_progress'
                                      ? 'В работе'
                                      : childTask.status === 'review'
                                        ? 'На проверке'
                                        : childTask.status === 'completed'
                                          ? 'Завершена'
                                          : 'Отменена'}
                                </span>
                                <span className="a11y-task-points a11y-force-accent rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                  {childTask.pointsReward} баллов
                                </span>
                              </div>
                              <div className="mt-3 text-lg font-bold text-gray-900">{childTask.title}</div>
                              <div className="mt-2 text-sm text-gray-600">
                                Откликов: {childResponses.length} • Дедлайн: {new Date(childTask.deadline).toLocaleDateString('ru-RU')}
                              </div>
                            </div>
                            <Link
                              to={`/организация/задачи/${childTask.id}`}
                              className="inline-flex items-center rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 transition-colors"
                            >
                              Открыть подзадачу
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500">У проекта пока нет опубликованных подзадач.</p>
                )
              ) : allResponses.length > 0 ? (
                <div className="space-y-6">
                  {allResponses.map(response => (
                    <div key={response.id} className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">Студент: {response.studentName}</h4>
                          <p className="text-sm text-gray-500">Дата отклика: {new Date(response.createdAt).toLocaleDateString('ru-RU')}</p>
                        </div>
                        <span className={`a11y-task-chip a11y-force-accent px-3 py-1 rounded-full text-xs font-medium ${
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

                      {response.teamMembers.length > 0 && (
                        <div className="mb-4 flex flex-wrap gap-2">
                          {response.teamMembers.map((member) => (
                            <span
                              key={member.studentId}
                              className="a11y-task-chip a11y-force-accent rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                            >
                              {member.studentName}
                              {member.role === 'leader' ? ' • лидер' : ''}
                            </span>
                          ))}
                        </div>
                      )}

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
                            <div className="mb-4 grid gap-3 sm:grid-cols-2">
                              <label className="a11y-surface-card flex min-w-0 items-start rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                                <input
                                  type="radio"
                                  name="status"
                                  value="completed"
                                  checked={reviewStatus === 'completed'}
                                  onChange={() => setReviewStatus('completed')}
                                  className="mt-0.5 h-4 w-4 shrink-0 border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="ml-3 flex-1 break-words text-sm font-medium leading-5 text-gray-700">
                                  Принять работу
                                </span>
                              </label>
                              <label className="a11y-surface-card flex min-w-0 items-start rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                                <input
                                  type="radio"
                                  name="status"
                                  value="needs_revision"
                                  checked={reviewStatus === 'needs_revision'}
                                  onChange={() => setReviewStatus('needs_revision')}
                                  className="mt-0.5 h-4 w-4 shrink-0 border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="ml-3 flex-1 break-words text-sm font-medium leading-5 text-gray-700">
                                  Отправить на доработку
                                </span>
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
