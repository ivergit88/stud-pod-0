export type TaskFormat = 'online' | 'hybrid' | 'offline';

export const TASK_FORMAT_LABELS: Record<TaskFormat, string> = {
  online: 'Онлайн',
  hybrid: 'Смешанная',
  offline: 'Очная',
};

export const TASK_FORMAT_OPTIONS: Array<{ value: TaskFormat; label: string }> = [
  { value: 'online', label: 'Онлайн' },
  { value: 'hybrid', label: 'Смешанная' },
  { value: 'offline', label: 'Очная' },
];

export const TASK_FORMAT_MAP_COLORS: Record<TaskFormat, string> = {
  online: '#2563eb',
  hybrid: '#7c3aed',
  offline: '#ea580c',
};

export function getTaskFormatLabel(format?: string): string {
  if (format === 'hybrid' || format === 'offline') {
    return TASK_FORMAT_LABELS[format];
  }

  return TASK_FORMAT_LABELS.online;
}

export function getTaskHref(task: { id: string; slug?: string }): string {
  return `/задачи/${task.slug || task.id}`;
}
