import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EyeOff, Pause, Play, Square, Volume2, X } from 'lucide-react';

export type AccessibilityFontSize = 'normal' | 'large' | 'xl';
export type AccessibilityColorScheme = 'normal' | 'bw' | 'wb' | 'blue';
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
  speechRate: number;
  clickToRead: boolean;
}

interface AccessibilityPanelProps {
  onClose: () => void;
  onDisable: () => void;
}

const STORAGE_KEY = 'stud-pod-a11y-settings';

const DEFAULT_SETTINGS: AccessibilitySettings = {
  fontSize: 'normal',
  colorScheme: 'normal',
  imagesMode: 'normal',
  fontFamily: 'sans',
  lineHeight: 'normal',
  spacing: 0,
  speechRate: 1,
  clickToRead: false,
};

const COLOR_SCHEMES = {
  normal: {
    bg: '',
    surface: '',
    text: '',
    border: '',
    link: '',
    accentBg: '',
    accentText: '',
    accentBorder: '',
    mutedBg: '',
  },
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
  'a11y-color-normal',
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
      speechRate:
        typeof parsed.speechRate === 'number'
          ? Math.max(0.8, Math.min(1.6, parsed.speechRate))
          : DEFAULT_SETTINGS.speechRate,
      clickToRead:
        typeof parsed.clickToRead === 'boolean'
          ? parsed.clickToRead
          : DEFAULT_SETTINGS.clickToRead,
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
  html.classList.add(`a11y-font-${settings.fontFamily}`);
  html.classList.add(`a11y-line-${settings.lineHeight}`);

  if (settings.colorScheme !== 'normal') {
    html.classList.add(`a11y-color-${settings.colorScheme}`);
  }

  if (settings.imagesMode === 'off') {
    html.classList.add('a11y-no-images');
  } else if (settings.imagesMode === 'bw') {
    html.classList.add('a11y-images-bw');
  }

  if (settings.colorScheme === 'normal') {
    html.style.removeProperty('--a11y-bg');
    html.style.removeProperty('--a11y-surface');
    html.style.removeProperty('--a11y-text');
    html.style.removeProperty('--a11y-border');
    html.style.removeProperty('--a11y-link');
    html.style.removeProperty('--a11y-accent-bg');
    html.style.removeProperty('--a11y-accent-text');
    html.style.removeProperty('--a11y-accent-border');
    html.style.removeProperty('--a11y-muted-bg');
  } else {
    html.style.setProperty('--a11y-bg', palette.bg);
    html.style.setProperty('--a11y-surface', palette.surface);
    html.style.setProperty('--a11y-text', palette.text);
    html.style.setProperty('--a11y-border', palette.border);
    html.style.setProperty('--a11y-link', palette.link);
    html.style.setProperty('--a11y-accent-bg', palette.accentBg);
    html.style.setProperty('--a11y-accent-text', palette.accentText);
    html.style.setProperty('--a11y-accent-border', palette.accentBorder);
    html.style.setProperty('--a11y-muted-bg', palette.mutedBg);
  }

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
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechState, setSpeechState] = useState<'idle' | 'speaking' | 'paused'>('idle');
  const [speechControlsLocked, setSpeechControlsLocked] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const speechLockTimeoutRef = useRef<number | null>(null);
  const pendingSpeakTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    applyAccessibilitySettings(settings);
  }, [settings]);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window) ||
      typeof window.SpeechSynthesisUtterance === 'undefined'
    ) {
      setSpeechSupported(false);
      return;
    }

    const synth = window.speechSynthesis;
    const syncVoices = () => {
      setVoices(synth.getVoices());
      setSpeechSupported(true);
    };

    syncVoices();
    const previousVoicesChanged = synth.onvoiceschanged;
    synth.onvoiceschanged = syncVoices;

    return () => {
      synth.onvoiceschanged = previousVoicesChanged;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (speechState !== 'idle' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          setSpeechState('idle');
          return;
        }
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, speechState]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (speechLockTimeoutRef.current) {
        window.clearTimeout(speechLockTimeoutRef.current);
      }
      if (pendingSpeakTimeoutRef.current) {
        window.clearTimeout(pendingSpeakTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !speechSupported) {
      return;
    }

    const synth = window.speechSynthesis;
    const intervalId = window.setInterval(() => {
      if (synth.paused) {
        setSpeechState((prev) => (prev === 'paused' ? prev : 'paused'));
        return;
      }

      if (synth.speaking || synth.pending) {
        setSpeechState((prev) => (prev === 'speaking' ? prev : 'speaking'));
        return;
      }

      setSpeechState((prev) => (prev === 'idle' ? prev : 'idle'));
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [speechSupported]);

  const updateSettings = (patch: Partial<AccessibilitySettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...patch,
    }));
  };

  const selectedVoice = useMemo(() => {
    if (voices.length === 0) {
      return undefined;
    }

    return (
      voices.find((voice) => voice.lang.toLowerCase().startsWith('ru')) ||
      voices.find((voice) => voice.default) ||
      voices[0]
    );
  }, [voices]);

  const lockSpeechControls = (duration = 700) => {
    if (typeof window === 'undefined') {
      return;
    }

    setSpeechControlsLocked(true);

    if (speechLockTimeoutRef.current) {
      window.clearTimeout(speechLockTimeoutRef.current);
    }

    speechLockTimeoutRef.current = window.setTimeout(() => {
      setSpeechControlsLocked(false);
    }, duration);
  };

  const startSpeech = (text: string) => {
    if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const synth = window.speechSynthesis;
    synth.cancel();

    if (pendingSpeakTimeoutRef.current) {
      window.clearTimeout(pendingSpeakTimeoutRef.current);
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedVoice?.lang || 'ru-RU';
    utterance.rate = settings.speechRate;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onend = () => setSpeechState('idle');
    utterance.onerror = () => setSpeechState('idle');

    setSpeechState('speaking');
    lockSpeechControls(900);

    pendingSpeakTimeoutRef.current = window.setTimeout(() => {
      synth.speak(utterance);
      pendingSpeakTimeoutRef.current = null;
    }, 120);
  };

  useEffect(() => {
    if (!speechSupported || !settings.clickToRead || typeof document === 'undefined') {
      return;
    }

    const body = document.body;
    if (!body) {
      return;
    }

    const getReadableText = (target: EventTarget | null) => {
      if (!(target instanceof Element)) {
        return '';
      }

      if (target.closest('[data-a11y-speech-ignore="true"]')) {
        return '';
      }

      let current: Element | null = target;

      while (current && current !== body) {
        const ariaLabel = current.getAttribute('aria-label')?.trim();
        const text = (ariaLabel || current.textContent || '').replace(/\s+/g, ' ').trim();

        if (text.length >= 2 && text.length <= 500) {
          return text;
        }

        current = current.parentElement;
      }

      return '';
    };

    const handleClickRead = (event: MouseEvent) => {
      startSpeech(getReadableText(event.target));
    };

    const handleFocusRead = (event: FocusEvent) => {
      startSpeech(getReadableText(event.target));
    };

    body.addEventListener('click', handleClickRead, true);
    body.addEventListener('focusin', handleFocusRead);

    return () => {
      body.removeEventListener('click', handleClickRead, true);
      body.removeEventListener('focusin', handleFocusRead);
    };
  }, [selectedVoice, settings.clickToRead, settings.speechRate, speechSupported]);

  const getReadablePageText = () => {
    if (typeof document === 'undefined') {
      return '';
    }

    return document.getElementById('main-content')?.innerText.replace(/\s+/g, ' ').trim() || '';
  };

  const handleSpeak = () => {
    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window) ||
      speechControlsLocked
    ) {
      return;
    }

    const synth = window.speechSynthesis;
    const text = getReadablePageText();
    if (!text) {
      return;
    }

    startSpeech(text);
  };

  const handlePause = () => {
    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window) ||
      speechControlsLocked
    ) {
      return;
    }

    const synth = window.speechSynthesis;

    if (synth.paused) {
      synth.resume();
      setSpeechState('speaking');
      lockSpeechControls();
      return;
    }

    synth.pause();
    setSpeechState('paused');
    lockSpeechControls();
  };

  const handleStop = () => {
    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window) ||
      speechControlsLocked
    ) {
      return;
    }

    if (pendingSpeakTimeoutRef.current) {
      window.clearTimeout(pendingSpeakTimeoutRef.current);
      pendingSpeakTimeoutRef.current = null;
    }

    window.speechSynthesis.cancel();
    setSpeechState('idle');
    lockSpeechControls(500);
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
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <button
                  type="button"
                  onClick={() => updateSettings({ colorScheme: 'normal' })}
                  className={sectionButtonClass(settings.colorScheme === 'normal')}
                >
                  Обычная схема
                </button>
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

            <section className="rounded-2xl border border-gray-200 bg-gray-50 p-4 lg:col-span-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <Volume2 className="h-4 w-4" />
                    Озвучка страницы
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    Читает содержимое текущей страницы через встроенный голос браузера.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleSpeak}
                    disabled={!speechSupported || speechControlsLocked}
                    data-a11y-speech-ignore="true"
                    className="a11y-panel__button inline-flex items-center rounded-xl border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    {speechControlsLocked
                      ? 'Запуск...'
                      : speechState === 'speaking' || speechState === 'paused'
                          ? 'Перезапустить'
                          : 'Озвучить'}
                  </button>
                  <button
                    type="button"
                    onClick={handlePause}
                    disabled={!speechSupported || speechControlsLocked || (speechState !== 'speaking' && speechState !== 'paused')}
                    data-a11y-speech-ignore="true"
                    className="a11y-panel__button inline-flex items-center rounded-xl border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Pause className="mr-2 h-4 w-4" />
                    {speechState === 'paused' ? 'Продолжить' : 'Пауза'}
                  </button>
                  <button
                    type="button"
                    onClick={handleStop}
                    disabled={!speechSupported || speechControlsLocked || speechState === 'idle'}
                    data-a11y-speech-ignore="true"
                    className="a11y-panel__button inline-flex items-center rounded-xl border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Square className="mr-2 h-4 w-4" />
                    Стоп
                  </button>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-gray-900">Скорость озвучки</div>
                  <div className="text-sm font-medium text-gray-600">{settings.speechRate.toFixed(1)}x</div>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.6"
                  step="0.1"
                  value={settings.speechRate}
                  onChange={(event) => updateSettings({ speechRate: Number(event.target.value) })}
                  className="mt-3 w-full"
                  aria-label="Скорость озвучки"
                />
                {!speechSupported && (
                  <div className="mt-3 text-sm text-gray-600">
                    В этом браузере озвучка страницы недоступна.
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateSettings({ clickToRead: !settings.clickToRead })}
                    className={sectionButtonClass(settings.clickToRead)}
                  >
                    {settings.clickToRead ? 'Чтение по нажатию включено' : 'Чтение по нажатию'}
                  </button>
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  `Esc` останавливает озвучку. После запуска браузеру может понадобиться доля
                  секунды, чтобы переключить состояние. Когда включено чтение по нажатию, можно
                  нажать на нужный блок страницы или самой панели `ВДС`, и будет прочитан только он.
                </div>
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
