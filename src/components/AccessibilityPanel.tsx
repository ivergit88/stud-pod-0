import React, { useEffect, useState } from 'react';
import { EyeOff, X } from 'lucide-react';

export type AccessibilityFontSize = 'normal' | 'large' | 'xl';
export type AccessibilityColorScheme = 'bw' | 'wb' | 'blue';
export type AccessibilityImagesMode = 'normal' | 'bw' | 'off';
export type AccessibilityFontFamily = 'default' | 'sans';
export type AccessibilityLineHeight = 'normal' | 'relaxed';

export interface AccessibilitySettings {
  fontSize: AccessibilityFontSize;
  colorScheme: AccessibilityColorScheme;
  imagesMode: AccessibilityImagesMode;
  fontFamily: AccessibilityFontFamily;
  lineHeight: AccessibilityLineHeight;
  spacing: number;
}

interface AccessibilityPanelProps {
  onClose: () => void;
  onDisable: () => void;
}

const STORAGE_KEY = 'stud-pod-a11y-settings';

const DEFAULT_SETTINGS: AccessibilitySettings = {
  fontSize: 'normal',
  colorScheme: 'bw',
  imagesMode: 'normal',
  fontFamily: 'sans',
  lineHeight: 'normal',
  spacing: 0,
};

const COLOR_SCHEMES = {
  bw: {
    bg: '#ffffff',
    surface: '#ffffff',
    text: '#000000',
    border: '#000000',
    link: '#000000',
    accentBg: '#000000',
    accentText: '#ffffff',
    accentBorder: '#000000',
    mutedBg: '#f3f4f6',
  },
  wb: {
    bg: '#000000',
    surface: '#000000',
    text: '#ffffff',
    border: '#ffffff',
    link: '#ffffff',
    accentBg: '#ffffff',
    accentText: '#000000',
    accentBorder: '#ffffff',
    mutedBg: '#111111',
  },
  blue: {
    bg: '#081f3d',
    surface: '#0e2d57',
    text: '#ffe66d',
    border: '#ffe66d',
    link: '#fff3a3',
    accentBg: '#ffe66d',
    accentText: '#081f3d',
    accentBorder: '#ffe66d',
    mutedBg: '#133766',
  },
} as const;

const ROOT_CLASSES = [
  'a11y-font-normal',
  'a11y-font-large',
  'a11y-font-xl',
  'a11y-color-bw',
  'a11y-color-wb',
  'a11y-color-blue',
  'a11y-no-images',
  'a11y-images-bw',
  'a11y-font-default',
  'a11y-font-sans',
  'a11y-line-normal',
  'a11y-line-relaxed',
];

export const loadAccessibilitySettings = (): AccessibilitySettings => {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_SETTINGS;
    }

    const parsed = JSON.parse(raw) as Partial<AccessibilitySettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      spacing:
        typeof parsed.spacing === 'number'
          ? Math.max(0, Math.min(5, parsed.spacing))
          : DEFAULT_SETTINGS.spacing,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const saveAccessibilitySettings = (settings: AccessibilitySettings) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};

export const applyAccessibilitySettings = (settings: AccessibilitySettings) => {
  if (typeof document === 'undefined') {
    return;
  }

  const html = document.documentElement;
  const body = document.body;
  const palette = COLOR_SCHEMES[settings.colorScheme];

  html.classList.remove(...ROOT_CLASSES);
  html.classList.add(`a11y-font-${settings.fontSize}`);
  html.classList.add(`a11y-color-${settings.colorScheme}`);
  html.classList.add(`a11y-font-${settings.fontFamily}`);
  html.classList.add(`a11y-line-${settings.lineHeight}`);

  if (settings.imagesMode === 'off') {
    html.classList.add('a11y-no-images');
  } else if (settings.imagesMode === 'bw') {
    html.classList.add('a11y-images-bw');
  }

  html.style.setProperty('--a11y-bg', palette.bg);
  html.style.setProperty('--a11y-surface', palette.surface);
  html.style.setProperty('--a11y-text', palette.text);
  html.style.setProperty('--a11y-border', palette.border);
  html.style.setProperty('--a11y-link', palette.link);
  html.style.setProperty('--a11y-accent-bg', palette.accentBg);
  html.style.setProperty('--a11y-accent-text', palette.accentText);
  html.style.setProperty('--a11y-accent-border', palette.accentBorder);
  html.style.setProperty('--a11y-muted-bg', palette.mutedBg);

  body.style.letterSpacing = `${settings.spacing}px`;
  saveAccessibilitySettings(settings);
};

export const clearAccessibilitySettings = () => {
  if (typeof document === 'undefined') {
    return;
  }

  const html = document.documentElement;
  const body = document.body;

  html.classList.remove(...ROOT_CLASSES);
  html.style.removeProperty('--a11y-bg');
  html.style.removeProperty('--a11y-surface');
  html.style.removeProperty('--a11y-text');
  html.style.removeProperty('--a11y-border');
  html.style.removeProperty('--a11y-link');
  html.style.removeProperty('--a11y-accent-bg');
  html.style.removeProperty('--a11y-accent-text');
  html.style.removeProperty('--a11y-accent-border');
  html.style.removeProperty('--a11y-muted-bg');
  body.style.letterSpacing = '0px';
};

const sectionButtonClass = (active: boolean) =>
  `a11y-panel__button rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
    active ? 'is-active' : ''
  }`;

export const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({ onClose, onDisable }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => loadAccessibilitySettings());

  useEffect(() => {
    applyAccessibilitySettings(settings);
  }, [settings]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const updateSettings = (patch: Partial<AccessibilitySettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...patch,
    }));
  };

  return (
    <section
      aria-labelledby="a11y-panel-title"
      className="a11y-panel border-b border-gray-200 bg-white shadow-sm"
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 id="a11y-panel-title" className="text-lg font-bold sm:text-xl">
              Настройки доступности
              </h2>
              <p className="mt-1 hidden text-sm text-gray-600 sm:block">
                Изменения применяются сразу и сохраняются для следующих визитов.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start">
              <button
                type="button"
                onClick={onDisable}
                className="a11y-panel__button inline-flex items-center rounded-xl border px-3 py-2 text-sm font-semibold"
              >
                <EyeOff className="mr-2 h-4 w-4" />
                Обычная версия
              </button>
              <button
                type="button"
                onClick={onClose}
                className="a11y-panel__button inline-flex items-center rounded-xl border p-2"
                aria-label="Свернуть настройки доступности"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-sm font-semibold text-gray-900">Размер шрифта</div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => updateSettings({ fontSize: settings.fontSize === 'xl' ? 'large' : 'normal' })}
                  className={sectionButtonClass(settings.fontSize === 'normal' || settings.fontSize === 'large')}
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={() => updateSettings({ fontSize: settings.fontSize === 'normal' ? 'large' : 'xl' })}
                  className={sectionButtonClass(settings.fontSize === 'xl')}
                >
                  A+
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-sm font-semibold text-gray-900">Шрифт</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => updateSettings({ fontFamily: 'default' })}
                  className={sectionButtonClass(settings.fontFamily === 'default')}
                >
                  Стандартный
                </button>
                <button
                  type="button"
                  onClick={() => updateSettings({ fontFamily: 'sans' })}
                  className={sectionButtonClass(settings.fontFamily === 'sans')}
                >
                  Без засечек
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-gray-900">Межбуквенный интервал</div>
                <div className="text-sm font-medium text-gray-600">{settings.spacing}px</div>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="1"
                value={settings.spacing}
                onChange={(event) => updateSettings({ spacing: Number(event.target.value) })}
                className="mt-3 w-full"
                aria-label="Межбуквенный интервал"
              />
            </section>

            <section className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-sm font-semibold text-gray-900">Межстрочный интервал</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => updateSettings({ lineHeight: 'normal' })}
                  className={sectionButtonClass(settings.lineHeight === 'normal')}
                >
                  Обычный
                </button>
                <button
                  type="button"
                  onClick={() => updateSettings({ lineHeight: 'relaxed' })}
                  className={sectionButtonClass(settings.lineHeight === 'relaxed')}
                >
                  Увеличенный
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-gray-50 p-4 lg:col-span-2">
              <div className="text-sm font-semibold text-gray-900">Цветовая схема</div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => updateSettings({ colorScheme: 'bw' })}
                  className={sectionButtonClass(settings.colorScheme === 'bw')}
                >
                  Чёрный на белом
                </button>
                <button
                  type="button"
                  onClick={() => updateSettings({ colorScheme: 'wb' })}
                  className={sectionButtonClass(settings.colorScheme === 'wb')}
                >
                  Белый на чёрном
                </button>
                <button
                  type="button"
                  onClick={() => updateSettings({ colorScheme: 'blue' })}
                  className={sectionButtonClass(settings.colorScheme === 'blue')}
                >
                  Жёлтый на синем
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-gray-50 p-4 lg:col-span-2">
              <div className="text-sm font-semibold text-gray-900">Изображения</div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => updateSettings({ imagesMode: 'normal' })}
                  className={sectionButtonClass(settings.imagesMode === 'normal')}
                >
                  Цветные
                </button>
                <button
                  type="button"
                  onClick={() => updateSettings({ imagesMode: 'bw' })}
                  className={sectionButtonClass(settings.imagesMode === 'bw')}
                >
                  Монохромные
                </button>
                <button
                  type="button"
                  onClick={() => updateSettings({ imagesMode: 'off' })}
                  className={sectionButtonClass(settings.imagesMode === 'off')}
                >
                  Скрыть
                </button>
              </div>
            </section>
          </div>

          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            Подсказка: ссылки на сайте остаются подчёркнутыми, а фокус клавиатуры выделен контрастной
            рамкой.
          </div>
        </div>
      </div>
    </section>
  );
};
