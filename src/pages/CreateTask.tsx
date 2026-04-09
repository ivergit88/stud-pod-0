import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { YMaps } from '@pbe/react-yandex-maps';
import { Paperclip, ShieldCheck, Sparkles, X } from 'lucide-react';
import { AddressInput } from '../components/AddressInput';
import { useAuth } from '../context/AuthContext';
import { useData, type TaskAttachment, type TaskAttachmentPayload } from '../context/DataContext';
import { apiRequest } from '../lib/api';
import { TASK_FORMAT_OPTIONS, getTaskFormatLabel, type TaskFormat } from '../lib/tasks';
import {
  TASK_TYPE_OPTIONS,
  TASK_URGENCY_OPTIONS,
  TASK_WORKLOAD_OPTIONS,
  calculateOrganizationTrust,
  calculateTaskScorePreview,
  deriveCategoryFromTaskType,
  getTaskTypeLabel,
  type TaskType,
  type TaskUrgency,
  type TaskWorkload,
} from '../lib/task-scoring';

const MAX_TASK_ATTACHMENTS = 3;
const MAX_TASK_ATTACHMENT_SIZE = 5 * 1024 * 1024;

type ExistingTaskAttachmentFormValue = TaskAttachment & {
  kind: 'existing';
};

type NewTaskAttachmentFormValue = {
  kind: 'new';
  tempId: string;
  originalName: string;
  mimeType: string;
  size: number;
  contentBase64: string;
};

type TaskAttachmentFormValue =
  | ExistingTaskAttachmentFormValue
  | NewTaskAttachmentFormValue;

const toDateInputValue = (value: string) => {
  if (!value) {
    return '';
  }

  return value.slice(0, 10);
};

const formatFileSize = (size: number) => {
  if (size < 1024) {
    return `${size} Б`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} КБ`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} МБ`;
};

const readFileAsBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const [, base64 = ''] = result.split(',');
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error || new Error('Не удалось прочитать файл'));
    reader.readAsDataURL(file);
  });

export const CreateTask: React.FC = () => {
  const { user } = useAuth();
  const { tasks, responses, loading, addTask, updateTask } = useData();
  const navigate = useNavigate();
  const { id: taskId } = useParams<{ id: string }>();
  const isEditMode = Boolean(taskId);
  const existingTask = isEditMode ? tasks.find((task) => task.id === taskId) : undefined;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    pointsReward: 40,
    deadline: '',
    format: 'online' as TaskFormat,
    workload: 'up_to_3_hours' as TaskWorkload,
    taskType: 'content' as TaskType,
    urgency: 'normal' as TaskUrgency,
    requiresOrgMaterials: false,
    requiresOnsiteCheck: false,
    location: '',
    materialsLink: '',
    coordinates: undefined as [number, number] | undefined,
  });
  const [simplePrompt, setSimplePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<TaskAttachmentFormValue[]>([]);

  const orgTasks = useMemo(
    () => tasks.filter((task) => task.organizationId === user?.id),
    [tasks, user?.id],
  );
  const trustProfile = useMemo(
    () => calculateOrganizationTrust(orgTasks, responses),
    [orgTasks, responses],
  );
  const scoringPreview = useMemo(
    () =>
      calculateTaskScorePreview(
        {
          format: formData.format,
          workload: formData.workload,
          taskType: formData.taskType,
          urgency: formData.urgency,
          requiresOrgMaterials: formData.requiresOrgMaterials,
          requiresOnsiteCheck: formData.requiresOnsiteCheck,
        },
        trustProfile,
      ),
    [
      formData.format,
      formData.workload,
      formData.taskType,
      formData.urgency,
      formData.requiresOrgMaterials,
      formData.requiresOnsiteCheck,
      trustProfile,
    ],
  );

  useEffect(() => {
    if (!existingTask) {
      return;
    }

    setFormData({
      title: existingTask.title,
      description: existingTask.description,
      requirements: existingTask.requirements || '',
      pointsReward: existingTask.pointsReward,
      deadline: toDateInputValue(existingTask.deadline),
      format: existingTask.format,
      workload: existingTask.workload,
      taskType: existingTask.taskType,
      urgency: existingTask.urgency,
      requiresOrgMaterials: existingTask.requiresOrgMaterials,
      requiresOnsiteCheck: existingTask.requiresOnsiteCheck,
      location: existingTask.location || '',
      materialsLink: existingTask.materialsLink || '',
      coordinates: existingTask.coordinates,
    });
    setAttachments(
      (existingTask.attachments || []).map((attachment) => ({
        ...attachment,
        kind: 'existing' as const,
      })),
    );
  }, [existingTask]);

  useEffect(() => {
    setFormData((prev) => {
      const clampedPoints = Math.min(
        Math.max(prev.pointsReward || scoringPreview.recommended, scoringPreview.minimum),
        scoringPreview.allowedMaximum,
      );

      if (clampedPoints === prev.pointsReward) {
        return prev;
      }

      return {
        ...prev,
        pointsReward: clampedPoints,
      };
    });
  }, [scoringPreview.allowedMaximum, scoringPreview.minimum, scoringPreview.recommended]);

  const handleGenerateAI = async () => {
    if (!simplePrompt.trim()) {
      return;
    }

    setIsGenerating(true);

    try {
      const result = await apiRequest<{ description: string; requirements: string }>(
        '/api/ai/task-brief',
        {
          method: 'POST',
          body: JSON.stringify({
            simplePrompt,
          }),
        },
      );

      setFormData((prev) => ({
        ...prev,
        description: result.description || prev.description,
        requirements: result.requirements || prev.requirements,
      }));
    } catch (error) {
      console.error('AI generation error:', error);
      alert('Ошибка при генерации ТЗ. Попробуйте переформулировать запрос.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!user || user.role !== 'organization') {
    return <div>Доступ запрещен</div>;
  }

  if (isEditMode && loading) {
    return <div>Загрузка задачи...</div>;
  }

  if (isEditMode && !existingTask) {
    return <div>Задача не найдена</div>;
  }

  if (existingTask && existingTask.organizationId !== user.id) {
    return <div>Доступ запрещен</div>;
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    if (name === 'format') {
      setFormData((prev) => ({
        ...prev,
        format: value as TaskFormat,
        requiresOnsiteCheck: value === 'online' ? false : prev.requiresOnsiteCheck,
      }));
      return;
    }

    if (name === 'pointsReward') {
      setFormData((prev) => ({
        ...prev,
        pointsReward: value === '' ? 0 : Number(value),
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleToggle = (
    key: 'requiresOrgMaterials' | 'requiresOnsiteCheck',
    value: boolean,
  ) => {
    if (key === 'requiresOnsiteCheck' && formData.format === 'online' && value) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleAttachmentsChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    const files: File[] = fileList ? Array.from(fileList) : [];
    e.target.value = '';

    if (files.length === 0) {
      return;
    }

    if (attachments.length + files.length > MAX_TASK_ATTACHMENTS) {
      alert(`Можно прикрепить не более ${MAX_TASK_ATTACHMENTS} файлов.`);
      return;
    }

    const oversizedFile = files.find((file) => file.size > MAX_TASK_ATTACHMENT_SIZE);
    if (oversizedFile) {
      alert(`Файл "${oversizedFile.name}" превышает лимит 5 МБ.`);
      return;
    }

    try {
      const preparedAttachments = await Promise.all(
        files.map(async (file) => ({
          kind: 'new' as const,
          tempId: crypto.randomUUID(),
          originalName: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          contentBase64: await readFileAsBase64(file),
        })),
      );

      setAttachments((prev) => [...prev, ...preparedAttachments]);
    } catch (error) {
      console.error('Task attachments read error:', error);
      alert('Не удалось прочитать один из файлов.');
    }
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    setAttachments((prev) =>
      prev.filter((attachment) =>
        attachment.kind === 'existing'
          ? attachment.id !== attachmentId
          : attachment.tempId !== attachmentId,
      ),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (formData.format === 'online' && formData.requiresOnsiteCheck) {
        alert('Для онлайн-задачи нельзя включать очную проверку или выезд.');
        setIsSubmitting(false);
        return;
      }

      if (formData.format !== 'online' && !formData.location.trim()) {
        alert('Для очной или смешанной задачи нужно указать место проведения.');
        setIsSubmitting(false);
        return;
      }

      if (
        formData.pointsReward < scoringPreview.minimum ||
        formData.pointsReward > scoringPreview.allowedMaximum
      ) {
        alert(
          `Сейчас доступно от ${scoringPreview.minimum} до ${scoringPreview.allowedMaximum} баллов. Система рекомендует ${scoringPreview.recommended}.`,
        );
        setIsSubmitting(false);
        return;
      }

      const attachmentPayload: TaskAttachmentPayload[] = attachments.map((attachment) =>
        attachment.kind === 'existing'
          ? {
              kind: 'existing',
              id: attachment.id,
            }
          : {
              kind: 'new',
              originalName: attachment.originalName,
              mimeType: attachment.mimeType,
              size: attachment.size,
              contentBase64: attachment.contentBase64,
            },
      );

      const payload = {
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements,
        category: deriveCategoryFromTaskType(formData.taskType),
        format: formData.format,
        workload: formData.workload,
        taskType: formData.taskType,
        urgency: formData.urgency,
        requiresOrgMaterials: formData.requiresOrgMaterials,
        requiresOnsiteCheck: formData.requiresOnsiteCheck,
        pointsReward: formData.pointsReward,
        deadline: formData.deadline,
        location: formData.location,
        materialsLink: formData.materialsLink.trim(),
        coordinates: formData.coordinates,
        attachments: attachmentPayload,
      };

      if (isEditMode && taskId) {
        await updateTask(taskId, payload);
      } else {
        await addTask({
          ...payload,
          organizationId: user.id,
          organizationName: user.name,
          executorId: undefined,
        });
      }

      navigate('/организация/задачи');
    } catch (error) {
      console.error(isEditMode ? 'Ошибка при обновлении задачи:' : 'Ошибка при создании задачи:', error);
      alert(
        isEditMode
          ? 'Не удалось обновить задачу. Пожалуйста, попробуйте еще раз.'
          : 'Не удалось создать задачу. Пожалуйста, попробуйте еще раз.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const mapsApiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY || '';
  const suggestApiKey = import.meta.env.VITE_YANDEX_MAPS_SUGGEST_API_KEY || mapsApiKey;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? 'Редактирование задачи' : 'Создание новой задачи'}
        </h1>
        <p className="mt-2 text-gray-600">
          {isEditMode
            ? 'Обновите описание, параметры сложности и диапазон баллов, пока задача открыта.'
            : 'Система сама подскажет честный диапазон баллов по параметрам задачи.'}
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 mb-8">
          <div className="flex items-start mb-4">
            <div className="bg-blue-600 p-2 rounded-lg text-white mr-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-blue-900">ИИ-помощник: Перевод в ТЗ</h3>
              <p className="text-sm text-blue-700">
                Опишите задачу простыми словами, а ЯндексGPT превратит ее в понятное техническое
                задание для студента.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <textarea
              value={simplePrompt}
              onChange={(e) => setSimplePrompt(e.target.value)}
              placeholder="Например: нужна афиша для концерта классической музыки"
              className="flex-1 px-4 py-2 border border-blue-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={2}
            />
            <button
              type="button"
              onClick={handleGenerateAI}
              disabled={isGenerating || !simplePrompt.trim()}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:bg-blue-300 flex items-center justify-center whitespace-nowrap"
            >
              {isGenerating ? 'Генерация...' : 'Создать ТЗ'}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название задачи *</label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="Например: Разработка афиши для выставки"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Тип задачи *</label>
              <select
                name="taskType"
                value={formData.taskType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                {TASK_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Предполагаемая трудоемкость *
              </label>
              <select
                name="workload"
                value={formData.workload}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                {TASK_WORKLOAD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Формат выполнения *</label>
            <div className="grid gap-3 sm:grid-cols-3">
              {TASK_FORMAT_OPTIONS.map((option) => {
                const isActive = formData.format === option.value;

                return (
                  <label
                    key={option.value}
                    className={`a11y-format-option cursor-pointer rounded-2xl border px-4 py-3 transition-colors ${
                      isActive
                        ? 'is-active border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="format"
                      value={option.value}
                      checked={isActive}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="text-sm font-semibold">{option.label}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      {option.value === 'online'
                        ? 'Цифровая задача без обязательного выезда.'
                        : option.value === 'hybrid'
                          ? 'Есть и онлайн-часть, и очное взаимодействие.'
                          : 'Нужен выезд или работа на площадке.'}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Срочность *</label>
              <select
                name="urgency"
                value={formData.urgency}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                {TASK_URGENCY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-sm font-medium text-gray-700">Категория для каталога</div>
              <div className="mt-2 inline-flex rounded-full bg-white px-3 py-1 text-sm font-medium text-gray-900 border border-gray-200">
                {getTaskTypeLabel(formData.taskType)}
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 p-4">
              <div className="text-sm font-medium text-gray-700 mb-3">
                Нужны ли студенту исходные материалы от организации?
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleToggle('requiresOrgMaterials', false)}
                  className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                    !formData.requiresOrgMaterials
                      ? 'bg-blue-700 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Нет
                </button>
                <button
                  type="button"
                  onClick={() => handleToggle('requiresOrgMaterials', true)}
                  className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                    formData.requiresOrgMaterials
                      ? 'bg-blue-700 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Да
                </button>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                Укажите, требуется ли студенту получение исходных материалов, данных, доступов или
                иных рабочих материалов от организации-заказчика.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 p-4">
              <div className="text-sm font-medium text-gray-700 mb-3">
                Нужна ли очная проверка или выезд?
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleToggle('requiresOnsiteCheck', false)}
                  className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                    !formData.requiresOnsiteCheck
                      ? 'bg-blue-700 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Нет
                </button>
                <button
                  type="button"
                  onClick={() => handleToggle('requiresOnsiteCheck', true)}
                  disabled={formData.format === 'online'}
                  className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                    formData.requiresOnsiteCheck
                      ? 'bg-blue-700 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400`}
                >
                  Да
                </button>
              </div>
              {formData.format === 'online' && (
                <p className="mt-3 text-xs text-gray-500">
                  Для онлайн-задачи очная проверка недоступна. Если выезд нужен, выберите смешанный
                  или очный формат.
                </p>
              )}
            </div>
          </div>

          <div className="a11y-score-panel rounded-3xl border border-blue-100 bg-blue-50 p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-blue-700 p-2 text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-blue-900">Система расчёта баллов</h3>
                <p className="mt-1 text-sm text-blue-800">
                  Баллы зависят от сложности задачи, а не от ручного решения организации.
                </p>
                <div className="mt-5 grid gap-4 md:grid-cols-4">
                  <div className="a11y-score-card rounded-2xl bg-white p-4 border border-blue-100">
                    <div className="text-xs uppercase tracking-wide text-gray-500">Рекомендовано</div>
                    <div className="mt-2 text-2xl font-bold text-gray-900">
                      {scoringPreview.recommended}
                    </div>
                  </div>
                  <div className="a11y-score-card rounded-2xl bg-white p-4 border border-blue-100">
                    <div className="text-xs uppercase tracking-wide text-gray-500">Системный диапазон</div>
                    <div className="mt-2 text-2xl font-bold text-gray-900">
                      {scoringPreview.minimum}-{scoringPreview.maximum}
                    </div>
                  </div>
                  <div className="a11y-score-card rounded-2xl bg-white p-4 border border-blue-100">
                    <div className="text-xs uppercase tracking-wide text-gray-500">Ваш лимит</div>
                    <div className="mt-2 text-2xl font-bold text-gray-900">
                      {scoringPreview.minimum}-{scoringPreview.allowedMaximum}
                    </div>
                  </div>
                  <div className="a11y-score-card rounded-2xl bg-white p-4 border border-blue-100">
                    <div className="text-xs uppercase tracking-wide text-gray-500">Уровень доверия</div>
                    <div className="mt-2 text-lg font-bold text-gray-900">{trustProfile.label}</div>
                    <div className="mt-1 text-xs text-gray-500">Индекс: {trustProfile.score}/100</div>
                  </div>
                </div>

                <p className="mt-4 text-sm text-blue-900">{trustProfile.description}</p>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {scoringPreview.breakdown.map((item) => (
                    <div key={item.label} className="a11y-score-card rounded-2xl border border-blue-100 bg-white px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-medium text-gray-900">{item.label}</div>
                        <div className="text-sm font-bold text-blue-700">
                          {item.points > 0 ? '+' : ''}
                          {item.points}
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">{item.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Подробное описание *</label>
            <textarea
              name="description"
              required
              value={formData.description}
              onChange={handleChange}
              rows={5}
              placeholder="Опишите суть задачи, контекст и ожидаемый результат..."
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Требования к исполнителю и результату *
            </label>
            <textarea
              name="requirements"
              required
              value={formData.requirements}
              onChange={handleChange}
              rows={4}
              placeholder="Укажите необходимые навыки, форматы файлов, специфические условия..."
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {formData.requiresOrgMaterials
                ? 'Материалы, которые организация передаст студенту'
                : 'Дополнительные материалы к задаче'}
            </label>
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4">
              <label className="a11y-attach-button inline-flex cursor-pointer items-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-blue-700 border border-blue-200 hover:bg-blue-50 transition-colors">
                <Paperclip className="w-4 h-4 mr-2" />
                Прикрепить файлы
                <input
                  type="file"
                  multiple
                  onChange={handleAttachmentsChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.webp,.zip,.rar,.7z"
                />
              </label>
              <p className="mt-3 text-xs text-gray-500">
                {formData.requiresOrgMaterials
                  ? `Загрузите исходники сразу здесь, если они понадобятся студенту. До ${MAX_TASK_ATTACHMENTS} файлов, не более 5 МБ каждый.`
                  : `Поле необязательное. Его можно использовать для примеров, референсов или поясняющих файлов. До ${MAX_TASK_ATTACHMENTS} файлов, не более 5 МБ каждый.`}{' '}
                Для крупных архивов лучше использовать облачную ссылку ниже.
              </p>

              {attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  {attachments.map((attachment) => {
                    const attachmentId =
                      attachment.kind === 'existing' ? attachment.id : attachment.tempId;

                    return (
                      <div
                        key={attachmentId}
                        className="flex items-center justify-between rounded-xl bg-white border border-gray-200 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-gray-900">
                            {attachment.originalName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatFileSize(attachment.size)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(attachmentId)}
                          className="ml-4 inline-flex items-center text-gray-500 hover:text-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ссылка на облако с материалами
            </label>
            <input
              type="url"
              name="materialsLink"
              value={formData.materialsLink}
              onChange={handleChange}
              placeholder="https://disk.yandex.ru/..."
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-2 text-xs text-gray-500">
              Подходит для крупных исходников, видео и архивов, которые не стоит хранить на портале.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Баллы за задачу *
              </label>
              <input
                type="number"
                name="pointsReward"
                required
                min={scoringPreview.minimum}
                max={scoringPreview.allowedMaximum}
                step="10"
                value={formData.pointsReward === 0 ? '' : formData.pointsReward}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-2 text-xs text-gray-500">
                Можно выбрать только от {scoringPreview.minimum} до {scoringPreview.allowedMaximum}{' '}
                баллов. Ниже задача будет занижена, выше система сейчас не пропустит.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Дедлайн *</label>
              <input
                type="date"
                name="deadline"
                required
                value={formData.deadline}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {formData.format === 'online'
                ? 'Адрес учреждения-заказчика для карты'
                : `Место проведения (${getTaskFormatLabel(formData.format)}) *`}
            </label>
            <YMaps
              query={{
                apikey: mapsApiKey,
                suggest_apikey: suggestApiKey,
                lang: 'ru_RU',
                load: 'package.full',
              }}
            >
              <AddressInput
                value={formData.location}
                onChange={(value, coords) =>
                  setFormData((prev) => ({
                    ...prev,
                    location: value,
                    coordinates: coords,
                  }))
                }
                placeholder={
                  formData.format === 'online'
                    ? 'Например: адрес учреждения, выезд не требуется'
                    : 'Укажите место, где проходит очная часть задачи'
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
              />
            </YMaps>
            <p className="mt-2 text-xs text-gray-500">
              {formData.format === 'online'
                ? 'Для онлайн-задачи точка нужна только как метка учреждения-заказчика. Выезд студенту не требуется.'
                : 'Эта точка будет использоваться на карте и поможет студенту понять, где проходит очная часть задачи.'}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm text-gray-700">
            <div className="font-semibold text-gray-900">Почему диапазон ограничен</div>
            <div className="mt-2 space-y-1">
              {scoringPreview.explanation.map((item) => (
                <div key={item}>{item}</div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/организация/задачи')}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-blue-700 text-white font-medium rounded-xl hover:bg-blue-800 transition-colors shadow-sm"
            >
              {isSubmitting
                ? isEditMode
                  ? 'Сохранение...'
                  : 'Публикация...'
                : isEditMode
                  ? 'Сохранить изменения'
                  : 'Опубликовать задачу'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
