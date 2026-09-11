// Отправка целей в Яндекс.Метрику.
// Счётчик задаётся переменной VITE_YANDEX_METRIKA_ID в .env (подставляется в index.html при сборке).
// Если счётчик не настроен, вызовы безопасно ничего не делают.

declare global {
  interface Window {
    ym?: (id: number, action: string, target: string, params?: Record<string, unknown>) => void;
    __metrikaId?: number;
  }
}

export const trackGoal = (target: string, params?: Record<string, unknown>): void => {
  const id = window.__metrikaId;
  if (!id || typeof window.ym !== 'function') {
    return;
  }
  try {
    window.ym(id, 'reachGoal', target, params);
  } catch {
    // аналитика не должна ломать пользовательский сценарий
  }
};
