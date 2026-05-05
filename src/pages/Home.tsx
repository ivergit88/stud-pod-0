import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Archive, ArrowRight, BarChart3, Bot, Building2, CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck, ClipboardList, FileText, GraduationCap, LogIn, Palette, Sparkles, Trophy, UserPlus, Users, X, type LucideIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import {
  clearPendingTaskTemplate,
  getTaskTemplateCreatePath,
  savePendingTaskTemplate,
  type TaskTemplateId,
} from '../lib/task-templates';
import { getTaskFormatLabel, getTaskHref } from '../lib/tasks';
import storyAiHelp from '../assets/story/ai-help.png';
import storyCommunity from '../assets/story/community.png';
import storyForInstitutions from '../assets/story/for-institutions.png';
import storyForStudents from '../assets/story/for-students.png';
import storyFourSteps from '../assets/story/four-steps.png';
import storyPointsMerch from '../assets/story/points-merch.png';
import storyStart from '../assets/story/start.png';
import storyStudentCase from '../assets/story/student-case.png';

const PRODUCT_METRICS = {
  savedBudgetRubles: 52740,
  codeLines: 18849,
  engineeringHours: 247,
};

const heroProofPoints = [
  'микрозадачи с проверяемым результатом',
  'кейс в портфолио после принятия работы',
  'прикладные цифровые задачи для учреждений',
];

const taskJourneySteps = [
  {
    label: 'Запрос учреждения',
    title: 'Сотрудник описывает потребность простым языком',
    text: 'Например: библиотеке нужно обновить страницу мероприятия, собрать материалы и добавить форму записи для посетителей.',
    icon: Building2,
    accent: 'from-blue-600 to-cyan-500',
    chips: ['потребность', 'материалы', 'ожидаемый результат'],
  },
  {
    label: 'Структура и ИИ-подсказка',
    title: 'Портал помогает оформить рабочую карточку',
    text: 'Модуль предлагает формулировку, результат, сроки, материалы, ограничения, формат выполнения и рекомендуемые баллы. Учреждение может принять подсказку или заполнить вручную.',
    icon: Bot,
    accent: 'from-indigo-600 to-blue-500',
    chips: ['структура задачи', 'подзадачи', 'оценка баллов'],
  },
  {
    label: 'Выбор студентом',
    title: 'Студент выбирает посильный микроэтап',
    text: 'В каталоге видны категория, формат, баллы, сроки и ожидаемый результат, поэтому участник понимает объём до отклика.',
    icon: Users,
    accent: 'from-emerald-600 to-teal-500',
    chips: ['каталог', 'команда', 'полное описание'],
  },
  {
    label: 'Проверка результата',
    title: 'Работа не теряется в переписках',
    text: 'Статусы фиксируют путь: взято в работу, на проверке, доработка или принято учреждением.',
    icon: CheckCircle2,
    accent: 'from-amber-500 to-orange-500',
    chips: ['на проверке', 'доработка', 'принято'],
  },
  {
    label: 'Баллы и портфолио',
    title: 'Итог фиксируется как кейс',
    text: 'После принятия результата в профиле сохраняется карточка кейса: исходная задача, роль участника, выполненные действия, инструменты и подтверждение учреждения.',
    icon: Trophy,
    accent: 'from-rose-600 to-orange-500',
    chips: ['баллы', 'отзыв', 'кейс'],
  },
];

const storySlides = [
  {
    label: 'Смысл проекта',
    title: 'Запрос учреждения проходит полный рабочий цикл',
    text: 'Учреждение публикует задачу, студент откликается и передает результат, учреждение проверяет работу, а итог фиксируется в портфолио.',
    image: storyStudentCase,
    alt: 'Иллюстрация с общей идеей портала Студенческий подряд',
    bullets: ['понятная польза двум аудиториям', 'цифровая задача без сложного входа', 'подтверждённый кейс в портфолио'],
  },
  {
    label: 'Маршрут',
    title: 'Платформа объясняет путь в четыре понятных шага',
    text: 'Пользователь видит последовательность без лишних терминов: оставить задачу, оформить карточку, выполнить результат и пройти проверку.',
    image: storyFourSteps,
    alt: 'Постер с четырьмя шагами работы платформы',
    bullets: ['запрос', 'оформление', 'выполнение', 'принятие результата'],
  },
  {
    label: 'Учреждениям',
    title: 'Сотруднику учреждения не нужно писать техническое задание',
    text: 'Основной вход для музея, библиотеки или ДК остается простым: описать потребность простыми словами, приложить материалы и отслеживать статус работы.',
    image: storyForInstitutions,
    alt: 'Постер о пользе портала для учреждений культуры',
    bullets: ['простая публикация', 'контроль статусов', 'готовый цифровой результат'],
  },
  {
    label: 'Студентам',
    title: 'Студент видит посильный объём и понятную награду',
    text: 'Студент выбирает задачу по уровню и формату, может работать один или в команде, получает баллы и карточку кейса после принятия результата.',
    image: storyForStudents,
    alt: 'Постер о возможностях портала для студентов',
    bullets: ['реальные задачи', 'командная работа', 'портфолио и баллы'],
  },
  {
    label: 'ИИ-модуль',
    title: 'ИИ помогает оформить запрос, но не заменяет платформу',
    text: 'Модуль подсказывает структуру, подзадачи, сроки, материалы, формат выполнения и рекомендуемые баллы. При этом задачу можно создать вручную.',
    image: storyAiHelp,
    alt: 'Постер о том, как ИИ помогает оформить задачу',
    bullets: ['структура задачи', 'подзадачи', 'автооценка баллов'],
  },
  {
    label: 'Мотивация',
    title: 'Баллы и портфолио превращают помощь в измеримый прогресс',
    text: 'После принятия результата студент получает не просто галочку, а зафиксированную работу: что сделал, для кого, какие навыки применил.',
    image: storyPointsMerch,
    alt: 'Постер про баллы, кейсы и поощрения',
    bullets: ['баллы', 'кейс', 'поощрения партнеров'],
  },
  {
    label: 'Поддержка',
    title: 'Портал не оставляет участника один на один с задачей',
    text: 'Командный подбор, помощь, сообщество и понятные статусы снижают страх первой реальной задачи и помогают довести работу до результата.',
    image: storyCommunity,
    alt: 'Постер о сообществе и поддержке участников',
    bullets: ['сокомандники', 'помощь', 'обратная связь'],
  },
  {
    label: 'Старт',
    title: 'Две главные дороги: оставить задачу или выбрать задачу',
    text: 'Пользователь выбирает свой путь: учреждение размещает запрос, студент находит посильную задачу и начинает работу.',
    image: storyStart,
    alt: 'Постер с инструкцией как начать пользоваться платформой',
    bullets: ['зарегистрироваться', 'создать или выбрать задачу', 'довести результат до проверки'],
  },
];

type ServiceCatalogItem = {
  templateId: TaskTemplateId;
  category: string;
  title: string;
  text: string;
  result: string;
  provides: string;
  duration: string;
  points: string;
  icon: LucideIcon;
  accent: string;
  examples: string[];
};

const serviceCatalog: ServiceCatalogItem[] = [
  {
    templateId: 'visitor-assistant',
    category: 'Навигация и ответы',
    title: 'Умный помощник для посетителей',
    text: 'Чат-бот или FAQ-блок для частых вопросов: часы работы, адрес, запись, контакты, стоимость, правила посещения.',
    result: 'Посетители быстрее находят ответы, а сотрудникам меньше приходится отвечать на однотипные сообщения.',
    provides: 'Список частых вопросов, контакты, ссылки и правила учреждения.',
    duration: '1-3 дня',
    points: '30-60 баллов',
    icon: Bot,
    accent: 'from-blue-700 to-cyan-500',
    examples: ['бот ВКонтакте', 'FAQ на сайте', 'сценарий ответов'],
  },
  {
    templateId: 'event-page',
    category: 'Сайт и события',
    title: 'Страница мероприятия или выставки',
    text: 'Одностраничный раздел с описанием события, фотографиями, датой, местом, программой и кнопкой записи.',
    result: 'У мероприятия появляется понятная цифровая страница, которую можно отправлять посетителям и партнёрам.',
    provides: 'Текст, фотографии, дату, место проведения и контакт для записи.',
    duration: '2-5 дней',
    points: '40-90 баллов',
    icon: FileText,
    accent: 'from-indigo-700 to-blue-500',
    examples: ['лендинг события', 'страница выставки', 'анонс с записью'],
  },
  {
    templateId: 'visual-style',
    category: 'Дизайн и соцсети',
    title: 'Единый стиль афиш и постов',
    text: 'Набор шаблонов для афиш, постов, историй и объявлений, чтобы публикации учреждения выглядели цельно.',
    result: 'Учреждение получает готовые макеты и может быстрее выпускать аккуратные материалы для мероприятий.',
    provides: 'Логотип, цвета, текст мероприятия, фотографии и примеры прошлых публикаций.',
    duration: '2-4 дня',
    points: '35-80 баллов',
    icon: Palette,
    accent: 'from-rose-700 to-orange-500',
    examples: ['афиша', 'пост ВКонтакте', 'шаблон объявления'],
  },
  {
    templateId: 'archive-cards',
    category: 'Архив и оцифровка',
    title: 'Карточки экспонатов и архивных материалов',
    text: 'Структурирование фотографий, документов, описаний и ссылок в таблицу или каталог для дальнейшей публикации.',
    result: 'Разрозненные материалы превращаются в понятную базу: её легче искать, проверять и переносить на сайт.',
    provides: 'Папку с материалами, желаемые поля карточки и пример заполнения.',
    duration: '3-7 дней',
    points: '45-110 баллов',
    icon: Archive,
    accent: 'from-emerald-700 to-teal-500',
    examples: ['таблица экспонатов', 'каталог фото', 'описания материалов'],
  },
  {
    templateId: 'application-form',
    category: 'Формы и заявки',
    title: 'Запись, обратная связь и сбор заявок',
    text: 'Форма регистрации на мероприятие, анкета обратной связи или простой сбор заявок от посетителей.',
    result: 'Заявки собираются в одном месте, а учреждение получает понятную таблицу участников или обращений.',
    provides: 'Поля формы, текст согласия, почту для уведомлений и правила обработки заявок.',
    duration: '1-3 дня',
    points: '25-60 баллов',
    icon: ClipboardCheck,
    accent: 'from-amber-600 to-orange-500',
    examples: ['форма записи', 'анкета посетителя', 'таблица заявок'],
  },
  {
    templateId: 'digital-audit',
    category: 'Проверка и аналитика',
    title: 'Проверка сайта, мобильной версии и публикаций',
    text: 'Быстрый аудит страницы, мобильного отображения, ссылок, текстов, карточек и базовых показателей посещаемости.',
    result: 'Учреждение получает список проблем и понятные рекомендации, что исправить в первую очередь.',
    provides: 'Ссылки на страницы, доступ к статистике при наличии и список приоритетных вопросов.',
    duration: '1-4 дня',
    points: '20-70 баллов',
    icon: BarChart3,
    accent: 'from-slate-800 to-blue-700',
    examples: ['мобильная проверка', 'чек-лист ошибок', 'отчёт по странице'],
  },
];

export const Home: React.FC = () => {
  const { user } = useAuth();
  const { tasks, platformStats } = useData();
  const navigate = useNavigate();
  const pageRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLElement | null>(null);
  const journeyRef = useRef<HTMLElement | null>(null);
  const [authModalRole, setAuthModalRole] = useState<'student' | 'organization' | null>(null);
  const [activeJourneyStep, setActiveJourneyStep] = useState(0);
  const [activeStorySlide, setActiveStorySlide] = useState(0);
  const storyTouchStartRef = useRef<number | null>(null);
  const storyWheelTimeRef = useRef(0);

  useEffect(() => {
    const page = pageRef.current;
    const hero = heroRef.current;
    if (!page || !hero) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobileViewport = window.matchMedia('(max-width: 640px)').matches;
    if (reduceMotion || isMobileViewport) {
      page.querySelectorAll('.home-scroll-reveal').forEach((element) => {
        element.classList.add('is-visible');
      });
      return;
    }

    let pointerFrame = 0;
    const setHeroPointer = (clientX: number, clientY: number) => {
      window.cancelAnimationFrame(pointerFrame);
      pointerFrame = window.requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
        hero.style.setProperty('--home-pointer-x', `${(x * 100).toFixed(2)}%`);
        hero.style.setProperty('--home-pointer-y', `${(y * 100).toFixed(2)}%`);
        hero.style.setProperty('--home-tilt-x', (x - 0.5).toFixed(3));
        hero.style.setProperty('--home-tilt-y', (y - 0.5).toFixed(3));
      });
    };

    const handlePointerMove = (event: PointerEvent) => setHeroPointer(event.clientX, event.clientY);
    const handlePointerLeave = () => {
      hero.style.setProperty('--home-pointer-x', '50%');
      hero.style.setProperty('--home-pointer-y', '45%');
      hero.style.setProperty('--home-tilt-x', '0');
      hero.style.setProperty('--home-tilt-y', '0');
    };

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.12 }
    );

    page.querySelectorAll('.home-scroll-reveal').forEach((element) => {
      revealObserver.observe(element);
    });

    let scrollFrame = 0;
    const handleScroll = () => {
      window.cancelAnimationFrame(scrollFrame);
      scrollFrame = window.requestAnimationFrame(() => {
        const progress = Math.min(window.scrollY / 900, 1);
        page.style.setProperty('--home-scroll-depth', progress.toFixed(3));
      });
    };

    hero.addEventListener('pointermove', handlePointerMove);
    hero.addEventListener('pointerleave', handlePointerLeave);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.cancelAnimationFrame(pointerFrame);
      window.cancelAnimationFrame(scrollFrame);
      hero.removeEventListener('pointermove', handlePointerMove);
      hero.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('scroll', handleScroll);
      revealObserver.disconnect();
    };
  }, []);

  // Get 3 most recent open tasks
  const recentTasks = tasks
    .filter(t => t.status === 'open' && t.taskKind !== 'parent')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const homeMetrics = [
    {
      value: platformStats.totalStudents,
      label: 'Зарегистрированных студентов',
      palette: 'bg-blue-700',
    },
    {
      value: platformStats.totalOrganizations,
      label: 'Организаций в системе',
      palette: 'bg-emerald-700',
    },
    {
      value: platformStats.activeTasks,
      label: 'Активных задач сейчас',
      palette: 'bg-orange-600',
    },
    {
      value: platformStats.completedTasks,
      label: 'Задач доведено до результата',
      palette: 'bg-slate-800',
    },
    {
      value: `${PRODUCT_METRICS.savedBudgetRubles.toLocaleString('ru-RU')} ₽`,
      label: 'Сэкономлено бюджетных средств',
      palette: 'bg-violet-700',
    },
    {
      value: `${PRODUCT_METRICS.codeLines.toLocaleString('ru-RU')} / ${PRODUCT_METRICS.engineeringHours} ч`,
      label: 'Строк кода / часов работы',
      palette: 'bg-rose-700',
    },
    {
      value: platformStats.totalResponses,
      label: 'Откликов обработано',
      palette: 'bg-cyan-700',
    },
    {
      value: platformStats.totalPointsAwarded,
      label: 'Баллов уже начислено',
      palette: 'bg-amber-600',
    },
  ];

  const activeJourney = taskJourneySteps[activeJourneyStep];
  const ActiveJourneyIcon = activeJourney.icon;
  const activeStory = storySlides[activeStorySlide];
  const changeStorySlide = (direction: -1 | 1) => {
    setActiveStorySlide((current) => (current + direction + storySlides.length) % storySlides.length);
  };

  const changeJourneyStep = (direction: -1 | 1) => {
    setActiveJourneyStep((current) => (current + direction + taskJourneySteps.length) % taskJourneySteps.length);
  };

  const handleStoryKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      changeStorySlide(-1);
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      changeStorySlide(1);
    }
  };

  const handleStoryImageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const relativeX = event.clientX - bounds.left;
    changeStorySlide(relativeX < bounds.width / 2 ? -1 : 1);
  };

  const handleStoryWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    const horizontalDelta = event.deltaX;
    const verticalDelta = event.shiftKey ? event.deltaY : 0;
    const primaryDelta = Math.abs(horizontalDelta) >= Math.abs(verticalDelta) ? horizontalDelta : verticalDelta;

    if (Math.abs(primaryDelta) < 18) return;

    event.preventDefault();
    const now = Date.now();
    if (now - storyWheelTimeRef.current < 420) return;

    storyWheelTimeRef.current = now;
    changeStorySlide(primaryDelta > 0 ? 1 : -1);
  };

  const handleStoryPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'touch') return;
    storyTouchStartRef.current = event.clientX;
  };

  const handleStoryPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'touch' || storyTouchStartRef.current === null) return;
    const delta = event.clientX - storyTouchStartRef.current;
    storyTouchStartRef.current = null;
    if (Math.abs(delta) < 48) return;
    changeStorySlide(delta > 0 ? -1 : 1);
  };

  const handleServiceTaskStart = (templateId?: TaskTemplateId) => {
    if (templateId && (!user || user.role === 'organization')) {
      savePendingTaskTemplate(templateId);
    } else {
      clearPendingTaskTemplate();
    }

    if (!user) {
      setAuthModalRole('organization');
      return;
    }

    navigate(
      user.role === 'organization' && templateId
        ? getTaskTemplateCreatePath(templateId)
        : user.role === 'organization'
          ? '/организация/задачи/новая'
          : '/задачи',
    );
  };

  return (
    <div ref={pageRef} className="home-page space-y-16 pb-16">
      {/* Hero Section */}
      <section ref={heroRef} className="a11y-home-hero home-hero-stage relative overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#f7fbff_0%,#ffffff_48%,#e7f3ff_100%)] px-4 pb-12 pt-12 shadow-sm sm:px-6 lg:px-10 md:pb-16 md:pt-16">
        <div className="a11y-home-decor pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(37,99,235,0.28),transparent)]" />
          <div className="absolute inset-y-0 left-10 w-px bg-[linear-gradient(180deg,transparent,rgba(148,163,184,0.16),transparent)]" />
          <div className="absolute inset-y-0 right-10 w-px bg-[linear-gradient(180deg,transparent,rgba(148,163,184,0.16),transparent)]" />
          <div className="home-hero-scan absolute inset-x-0 top-1/3 h-24 bg-[linear-gradient(90deg,transparent,rgba(37,99,235,0.10),transparent)]" />
        </div>
        <div className="home-cursor-orb" aria-hidden="true" />
        <div className="home-constellation" aria-hidden="true">
          <span className="home-particle home-particle-1" />
          <span className="home-particle home-particle-2" />
          <span className="home-particle home-particle-3" />
          <span className="home-particle home-particle-4" />
          <span className="home-particle home-particle-5" />
        </div>

        <div className="home-hero-grid relative z-10 grid items-center gap-10">
          <div className="text-left">
            <div className="a11y-surface-card home-reveal mb-6 inline-flex items-center rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm">
              Портал микрозадач для учреждений культуры и студентов
            </div>
            <h1 className="home-reveal home-reveal-2 max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-gray-950 sm:text-5xl md:text-6xl">
              Первый подтверждаемый кейс студенту. Прикладной цифровой результат учреждению.
            </h1>
            <p className="home-reveal home-reveal-3 mt-6 max-w-3xl text-base leading-8 text-slate-700 sm:text-lg">
              Цифровая система проектного участия для студентов 1-3 курсов ИТ-, дизайн- и
              медиа-направлений и учреждений культуры. На платформе проходят публикация
              задачи, отклик, выполнение, проверка, доработка и фиксация результата в портфолио.
            </p>
            <div className="home-reveal home-reveal-4 mt-6 grid gap-3 sm:grid-cols-3">
              {heroProofPoints.map((item) => (
                <div key={item} className="a11y-surface-card home-proof-card rounded-2xl border border-white bg-white/85 px-4 py-3 shadow-sm">
                  <div className="text-sm font-semibold leading-6 text-gray-900">{item}</div>
                </div>
              ))}
            </div>
            <p className="home-reveal home-reveal-4 mt-4 max-w-3xl rounded-2xl border border-blue-100 bg-white/85 px-4 py-3 text-sm font-semibold leading-6 text-slate-700 shadow-sm">
              Проект реализуется при поддержке Всероссийского студенческого проекта «Твой Ход» и Автономной некоммерческой организации высшего образования «Университет Неймарк».
            </p>
            {!user && (
              <div className="home-reveal home-reveal-5 flex flex-col gap-4 pt-8 sm:flex-row">
                <button
                  onClick={() => setAuthModalRole('organization')}
                  className="home-action-button inline-flex items-center justify-center rounded-2xl bg-blue-700 px-8 py-4 text-lg font-medium text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-blue-800 hover:shadow-xl"
                >
                  <Building2 className="mr-2 h-6 w-6" />
                  Оставить задачу
                </button>
                <button
                  onClick={() => setAuthModalRole('student')}
                  className="home-action-button inline-flex items-center justify-center rounded-2xl bg-white px-8 py-4 text-lg font-medium text-blue-800 shadow-lg ring-1 ring-blue-100 transition-all hover:-translate-y-1 hover:bg-blue-50 hover:shadow-xl"
                >
                  <GraduationCap className="mr-2 h-6 w-6" />
                  Выбрать задачу
                </button>
                <a
                  href="#home-story-title"
                  className="home-action-button home-action-button--quiet inline-flex items-center justify-center rounded-2xl bg-slate-950 px-8 py-4 text-lg font-medium text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-slate-800 hover:shadow-xl"
                >
                  Как работает
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </div>
            )}
          </div>

          <div className="a11y-force-surface home-preview-panel rounded-[2rem] border border-white bg-white/80 p-4 shadow-2xl">
            <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-950 text-white">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-300" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
              <div className="text-xs font-semibold text-slate-300">маршрут задачи на платформе</div>
              </div>
              <div className="space-y-4 p-5">
                <div className="rounded-2xl bg-white p-4 text-slate-900">
                  <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                    Запрос учреждения
                  </div>
                  <div className="mt-2 text-lg font-bold">Нужно обновить страницу выставки</div>
                  <div className="mt-2 text-sm leading-6 text-slate-600">
                    Платформа помогает оформить карточку задачи и разделить крупный запрос на
                    микроэтапы: тексты, дизайн, публикация, проверка.
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <div className="text-xs text-blue-100">Студент</div>
                    <div className="mt-1 text-2xl font-bold text-white">+40 баллов</div>
                    <div className="mt-1 text-sm text-blue-100">кейс, отзыв, запись в портфолио</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <div className="text-xs text-blue-100">Учреждение</div>
                    <div className="mt-1 text-2xl font-bold text-white">1 задача</div>
                    <div className="mt-1 text-sm text-blue-100">проверяемый результат и понятный статус</div>
                  </div>
                </div>
                <div className="a11y-force-accent home-flow-line rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white">
                  От запроса до результата: публикация → отклик → сдача → проверка → портфолио
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-story home-section-reveal home-scroll-reveal overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm" aria-labelledby="home-story-title">
        <div className="home-story-header grid gap-6 p-5 sm:p-7 lg:grid-cols-[0.95fr_1.05fr] lg:p-8">
          <div>
            <div className="a11y-force-accent inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
              <Sparkles className="mr-2 h-4 w-4" />
              Платформа в действии
            </div>
            <h2 id="home-story-title" className="mt-4 text-3xl font-extrabold leading-tight text-gray-950 sm:text-4xl">
              Понятный маршрут работы платформы
            </h2>
          </div>
          <p className="max-w-3xl text-base leading-8 text-slate-700 lg:pt-10">
            Путь от первого запроса до результата показан на слайдах: учреждение размещает задачу,
            студент выполняет работу, результат проходит проверку и попадает в портфолио.
          </p>
        </div>

        <div
          className="home-story-stage"
          tabIndex={0}
          role="region"
          aria-roledescription="карусель"
          aria-label="История работы платформы"
          onKeyDown={handleStoryKeyDown}
          onPointerDown={handleStoryPointerDown}
          onPointerUp={handleStoryPointerUp}
        >
          <div className="home-story-copy">
            <div className="home-story-meta">
              <div className="home-story-count">{activeStorySlide + 1} / {storySlides.length}</div>
              <div className="home-story-label">{activeStory.label}</div>
            </div>
            <div className="home-story-summary">
              <h3>{activeStory.title}</h3>
              <p>{activeStory.text}</p>
            </div>
            <div className="home-story-actions">
              {!user && (
                <>
                  <button type="button" onClick={() => setAuthModalRole('organization')}>
                    Оставить задачу
                  </button>
                  <button type="button" onClick={() => setAuthModalRole('student')}>
                    Выбрать задачу
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="home-story-window">
            <button
              type="button"
              className="home-story-hotzone home-story-hotzone--left"
              aria-label="Предыдущий слайд"
              onClick={() => changeStorySlide(-1)}
            >
              <ChevronLeft className="h-5 w-5" />
              <span>назад</span>
            </button>
            <div
              className="home-story-image-shell"
              aria-live="polite"
              role="button"
              tabIndex={-1}
              title="Нажмите левую или правую часть изображения, чтобы переключить слайд"
              onClick={handleStoryImageClick}
              onWheel={handleStoryWheel}
            >
              <img key={activeStory.image} src={activeStory.image} alt={activeStory.alt} />
            </div>
            <button
              type="button"
              className="home-story-hotzone home-story-hotzone--right"
              aria-label="Следующий слайд"
              onClick={() => changeStorySlide(1)}
            >
              <span>дальше</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="home-story-footer">
          <div className="home-story-arrows" aria-label="Управление слайдами">
            <button type="button" onClick={() => changeStorySlide(-1)} aria-label="Предыдущий слайд">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => changeStorySlide(1)} aria-label="Следующий слайд">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="home-story-dots">
            {storySlides.map((slide, index) => (
              <button
                key={slide.label}
                type="button"
                className={index === activeStorySlide ? 'is-active' : ''}
                aria-label={`Показать слайд: ${slide.label}`}
                aria-current={index === activeStorySlide ? 'true' : undefined}
                onClick={() => setActiveStorySlide(index)}
              />
            ))}
          </div>
        </div>
      </section>

      <section ref={journeyRef} className="a11y-force-surface home-journey home-section-reveal home-scroll-reveal rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8" aria-labelledby="home-journey-title">
        <div className="mb-8 max-w-3xl">
          <div className="a11y-force-accent inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
            <ClipboardList className="mr-2 h-4 w-4" />
            Путь задачи
          </div>
          <h2 id="home-journey-title" className="mt-4 text-3xl font-extrabold leading-tight text-gray-950 sm:text-4xl">
            Как запрос учреждения превращается в результат и портфолио
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-700">
            От описания потребности до принятого результата: каждый этап имеет понятный статус,
            ответственного участника и следующий шаг.
          </p>
        </div>

        <div className="home-journey-guide">
          <div>
            <span>Выберите этап маршрута</span>
            <p>Нажмите на шаг, чтобы увидеть подробности ниже.</p>
          </div>
          <div className="home-journey-controls" aria-label="Управление этапами пути задачи">
            <button type="button" onClick={() => changeJourneyStep(-1)} aria-label="Предыдущий этап">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => changeJourneyStep(1)} aria-label="Следующий этап">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="home-journey-layout">
          <div className="home-journey-steps">
            {taskJourneySteps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === activeJourneyStep;

              return (
                <button
                  key={step.label}
                  type="button"
                  onClick={() => setActiveJourneyStep(index)}
                  className={`home-journey-step w-full rounded-3xl border p-5 text-left transition-all ${
                    isActive
                      ? 'is-active border-blue-200 bg-blue-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="home-journey-step-marker-wrap">
                    <div className={`a11y-force-accent home-journey-step-marker flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${step.accent} text-white`}>
                      <StepIcon className="h-5 w-5" />
                    </div>
                    <span>{index + 1}</span>
                  </div>
                  <div className="home-journey-step-copy min-w-0">
                    <div className="text-sm font-bold uppercase tracking-[0.14em] text-blue-700">
                      {step.label}
                    </div>
                    <div className="mt-2 text-lg font-extrabold leading-snug text-gray-950">{step.title}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="home-journey-visual-wrap">
            <div className="a11y-force-surface home-journey-visual rounded-[2rem] border border-slate-200 bg-slate-950 p-4 text-white shadow-2xl sm:p-6">
              <div className="home-journey-orbit" aria-hidden="true" />
              <div className="relative z-10 flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">живой путь задачи</div>
                  <div className="mt-1 text-xl font-extrabold text-white">{activeJourney.label}</div>
                </div>
                <div className={`a11y-force-accent flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${activeJourney.accent} text-white`}>
                  <ActiveJourneyIcon className="h-6 w-6" />
                </div>
              </div>

              <div className="relative z-10 mt-5">
                <div
                  className="home-journey-pipeline"
                  style={{ '--journey-progress-width': `calc(${(activeJourneyStep / (taskJourneySteps.length - 1)) * 100}% - ${(48 * activeJourneyStep) / (taskJourneySteps.length - 1)}px)` } as React.CSSProperties}
                  aria-hidden="true"
                >
                  {taskJourneySteps.map((step, index) => (
                    <div key={step.label} className={`home-journey-node ${index <= activeJourneyStep ? 'is-complete' : ''} ${index === activeJourneyStep ? 'is-current' : ''}`}>
                      <span>{index + 1}</span>
                    </div>
                  ))}
                </div>

                <div key={activeJourney.label} className="home-journey-card mt-6 rounded-3xl border border-white/10 bg-white p-5 text-slate-950 shadow-xl">
                  <div className="flex flex-wrap gap-2">
                    {activeJourney.chips.map((chip) => (
                      <span key={chip} className="a11y-category-chip rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                        {chip}
                      </span>
                    ))}
                  </div>
                  <h3 className="mt-4 text-2xl font-extrabold leading-tight text-slate-950">{activeJourney.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-700">{activeJourney.text}</p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="a11y-force-surface rounded-2xl bg-slate-100 p-4">
                      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Учреждение</div>
                      <div className="mt-2 text-sm font-semibold leading-6 text-slate-900">
                        меньше технического языка, понятный результат, контроль статуса
                      </div>
                    </div>
                    <div className="a11y-force-surface rounded-2xl bg-blue-50 p-4">
                      <div className="a11y-category-value text-xs font-bold uppercase tracking-wide text-blue-700">Студент</div>
                      <div className="a11y-category-value mt-2 text-sm font-semibold leading-6 text-blue-950">
                        посильная задача, команда при необходимости, баллы и кейс
                      </div>
                    </div>
                  </div>
                </div>

                <div className="home-journey-status mt-5 flex flex-wrap gap-2 sm:gap-3">
                  {['Опубликовано', 'В работе', 'На проверке', 'В портфолио'].map((status, index) => (
                    <div key={status} className={`inline-flex min-w-[7.4rem] items-center justify-center whitespace-nowrap rounded-2xl border px-3 py-3 text-center text-[11px] font-bold leading-tight sm:min-w-[7.8rem] lg:text-xs ${index <= Math.min(activeJourneyStep, 3) ? 'border-blue-300 bg-blue-500 text-white' : 'border-white/10 bg-white/10 text-blue-100'}`}>
                      {status}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      {authModalRole && (
        <div className="home-auth-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="home-auth-modal-panel bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900">
                {authModalRole === 'student' ? 'Студентам' : 'Организациям'}
              </h3>
              <button 
                onClick={() => {
                  clearPendingTaskTemplate();
                  setAuthModalRole(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <button
                onClick={() => {
                  setAuthModalRole(null);
                  navigate('/вход');
                }}
                className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <LogIn className="h-6 w-6" />
                  </div>
                  <div className="ml-4 text-left">
                    <div className="font-bold text-gray-900">Вход</div>
                    <div className="text-sm text-gray-500">У меня уже есть аккаунт</div>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500" />
              </button>
              
              <button
                onClick={() => {
                  setAuthModalRole(null);
                  navigate(authModalRole === 'student' ? '/регистрация-студент' : '/регистрация-организация');
                }}
                className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <UserPlus className="h-6 w-6" />
                  </div>
                  <div className="ml-4 text-left">
                    <div className="font-bold text-gray-900">Регистрация</div>
                    <div className="text-sm text-gray-500">Создать новый аккаунт</div>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* How it works */}
      <section className="home-section-reveal home-scroll-reveal bg-white rounded-3xl p-6 sm:p-8 md:p-12 shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10"></div>
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">Как это работает</h2>
        <div className="grid md:grid-cols-3 gap-8 sm:gap-12 relative">
          <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-blue-100 via-blue-200 to-green-100 -z-10"></div>
          
          <div className="home-step-card bg-white z-10 flex flex-col items-center text-center space-y-4 group p-4">
            <div className="a11y-step-badge flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-2xl font-bold text-blue-700 shadow-sm transition-colors duration-300 group-hover:-translate-y-1 group-hover:bg-blue-600 group-hover:text-white">
              <span className="a11y-step-number">1</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900"><span>Организация описывает запрос</span></h3>
            <p className="text-sm sm:text-base font-medium text-gray-700 leading-relaxed"><span>Можно опубликовать одну микрозадачу или большой проект, который система разложит на подзадачи.</span></p>
          </div>
          
          <div className="home-step-card bg-white z-10 flex flex-col items-center text-center space-y-4 group p-4">
            <div className="a11y-step-badge flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-2xl font-bold text-blue-700 shadow-sm transition-colors duration-300 group-hover:-translate-y-1 group-hover:bg-blue-600 group-hover:text-white">
              <span className="a11y-step-number">2</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900"><span>Студент берёт понятный объём</span></h3>
            <p className="text-sm sm:text-base font-medium text-gray-700 leading-relaxed"><span>Микроформат помогает начать с понятного результата, сроков и обратной связи.</span></p>
          </div>
          
          <div className="home-step-card bg-white z-10 flex flex-col items-center text-center space-y-4 group p-4">
            <div className="a11y-step-badge flex h-16 w-16 items-center justify-center rounded-2xl border border-green-100 bg-green-50 text-2xl font-bold text-green-700 shadow-sm transition-colors duration-300 group-hover:-translate-y-1 group-hover:bg-green-600 group-hover:text-white">
              <span className="a11y-step-number">3</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900"><span>Результат фиксируется</span></h3>
            <p className="text-sm sm:text-base font-medium text-gray-700 leading-relaxed"><span>Учреждение принимает работу, студент получает баллы, отзыв и карточку кейса в портфолио.</span></p>
          </div>
        </div>
      </section>

      <section className="home-section-reveal home-scroll-reveal grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="a11y-force-surface rounded-3xl border border-slate-200 bg-slate-950 p-8 text-white shadow-sm">
          <div className="text-sm font-bold uppercase tracking-[0.18em] text-blue-200">
            Практический цикл
          </div>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight text-white">
            Полный цикл работы с задачей
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-200">
            Платформа связывает запрос учреждения, карточку задачи, отклик студента, выполнение,
            проверку, доработку, принятие результата и карточку кейса в портфолио.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ['Микроформат', 'Дополняет учебную траекторию короткими задачами от внешних заказчиков и понятной обратной связью.'],
            ['Польза учреждению', 'Помогает закрывать прикладные цифровые задачи: тексты, страницы, афиши, оцифровку, аналитику и публикации.'],
            ['Польза студенту', 'Первый кейс, баллы, отзыв, портфолио и уверенность перед стажировкой или работой.'],
            ['Прозрачность', 'В системе видны задачи, отклики, статусы, результаты, баллы, публикации и обратная связь.'],
          ].map(([title, text]) => (
            <div key={title} className="a11y-surface-card home-proof-card rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="text-lg font-bold text-gray-900">{title}</div>
              <div className="mt-2 text-sm leading-7 text-gray-600">{text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="home-section-reveal home-scroll-reveal space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Метрики проекта</h2>
            <p className="mt-1 text-sm text-gray-600">
              Живые показатели платформы и продуктовые метрики, которые показывают практический эффект решения.
            </p>
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {homeMetrics.map((metric) => (
            <div
              key={metric.label}
              className={`a11y-surface-card home-metric-card home-metric-card--colored rounded-2xl border border-transparent ${metric.palette} p-6 text-white shadow-sm`}
            >
              <div className="mb-2 text-2xl font-semibold leading-tight tracking-tight text-white tabular-nums">{metric.value}</div>
              <div className="text-sm font-medium leading-6 text-white/85">{metric.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="home-section-reveal home-scroll-reveal space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Что можно поручить студентам</h2>
            <p className="mt-1 max-w-3xl text-sm text-gray-600">
              Выберите готовый формат или опишите свою потребность простыми словами. Платформа
              поможет оформить результат, сроки, материалы и рекомендуемые баллы.
            </p>
          </div>
          <div className="a11y-surface-card max-w-xl rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900">
            Если запрос большой, его можно оставить одним проектом: система предложит связанные
            подзадачи, чтобы студенту или команде было проще взять посильный объём.
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {serviceCatalog.map((service) => {
            const ServiceIcon = service.icon;

            return (
              <article
                key={service.title}
                className="a11y-surface-card home-service-card flex min-w-0 flex-col rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex items-start gap-4">
                  <div className={`a11y-force-accent home-service-icon flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${service.accent} text-white shadow-sm`}>
                    <ServiceIcon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="a11y-category-chip inline-flex max-w-full rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold leading-5 text-blue-700">
                      {service.category}
                    </div>
                    <h3 className="mt-3 text-xl font-bold leading-snug text-gray-950">{service.title}</h3>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-7 text-gray-600">{service.text}</p>

                <div className="mt-5 grid gap-3">
                  <div className="home-service-detail rounded-2xl bg-slate-50 p-4">
                    <div className="home-service-detail-label text-xs font-semibold uppercase tracking-wide text-slate-500">Итог для учреждения</div>
                    <div className="home-service-detail-text mt-2 text-sm leading-6 text-slate-800">{service.result}</div>
                  </div>
                  <div className="home-service-detail rounded-2xl bg-blue-50 p-4">
                    <div className="home-service-detail-label text-xs font-semibold uppercase tracking-wide text-blue-700">Что подготовить</div>
                    <div className="home-service-detail-text mt-2 text-sm leading-6 text-blue-950">{service.provides}</div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {service.examples.map((example) => (
                    <span key={example} className="a11y-category-chip inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold leading-5 text-gray-700">
                      {example}
                    </span>
                  ))}
                </div>

                <div className="mt-auto pt-5">
                  <div className="mb-4 grid gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm sm:grid-cols-2">
                    <div>
                      <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500">Обычно</span>
                      <span className="mt-1 block font-bold text-gray-900">{service.duration}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500">Ориентир</span>
                      <span className="mt-1 block font-bold text-gray-900">{service.points}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleServiceTaskStart(service.templateId)}
                    className="home-action-button inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-blue-800"
                    aria-label={`Выбрать готовый формат: ${service.title}`}
                  >
                    Выбрать эту задачу
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <div className="a11y-surface-card flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <h3 className="text-xl font-bold">Не нашли подходящий формат?</h3>
            <p className="mt-2 text-sm leading-7 text-slate-200">
              Опишите задачу своими словами: что нужно сделать, какие материалы есть и какой
              результат должен получиться. На этапе создания заявки система подскажет структуру,
              подзадачи и оценку баллов.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-shrink-0">
            <button
              type="button"
              onClick={() => handleServiceTaskStart()}
              className="home-action-button inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-blue-50"
            >
              Создать свою задачу
            </button>
            <Link
              to="/задачи"
              className="home-action-button inline-flex items-center justify-center rounded-2xl border border-white/25 px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-white/10"
            >
              Смотреть открытые задачи
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Tasks */}
      <section className="home-section-reveal home-scroll-reveal space-y-8">
        <div className="flex justify-between items-end">
          <h2 className="text-3xl font-bold">Последние задачи</h2>
          <Link to="/задачи" className="text-blue-700 font-medium hover:underline flex items-center">
            Смотреть все <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {recentTasks.length > 0 ? recentTasks.map((task) => (
            <div key={task.id} className="home-task-card bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow flex flex-col h-full">
              <div className="mb-4">
                <span className="a11y-category-chip inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full mb-3">
                  {task.category}
                </span>
                <span
                  className={`a11y-task-chip a11y-force-accent ml-2 inline-block px-3 py-1 text-xs font-medium rounded-full mb-3 ${
                    task.format === 'online'
                      ? 'bg-blue-50 text-blue-700'
                      : task.format === 'hybrid'
                        ? 'bg-violet-50 text-violet-700'
                        : 'bg-orange-50 text-orange-700'
                  }`}
                >
                  {getTaskFormatLabel(task.format)}
                </span>
                <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1 line-clamp-2">{task.title}</h3>
                <p className="text-sm text-gray-500 flex items-center">
                  <Building2 className="h-3 w-3 mr-1" />
                  {task.organizationName}
                </p>
              </div>
              <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                <div className="font-bold text-blue-700">{task.pointsReward} баллов</div>
                <Link to={getTaskHref(task)} className="text-sm font-medium text-gray-600 hover:text-blue-700">Подробнее</Link>
              </div>
            </div>
          )) : (
            <div className="col-span-3 text-center py-8 text-gray-500 bg-white rounded-2xl border border-gray-200">
              Пока нет открытых задач
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
