# Студенческий подряд — Android-клиент

Мобильный клиент веб-портала «Студенческий подряд» (студ-подряд.рф).
Приложение — **тонкий клиент существующего backend** (Express + SQLite):
никакой собственной БД и бизнес-логики, все данные — через REST API.

**MVP — студенческий сценарий:**

- регистрация и вход (Bearer JWT, сессия в EncryptedSharedPreferences);
- главная: баллы, новые задачи, мои активные проекты;
- каталог задач: поиск, фильтры, бесконечная подгрузка (пагинация);
- карточка задачи + «Откликнуться»;
- мои проекты: статусы откликов, отправка результата;
- мои кейсы (портфолио из подтверждённых задач);
- уведомления (in-app + фоновая синхронизация WorkManager);
- профиль и выход.

Кабинет организации и админа, магазин, push — следующие этапы
(см. `docs/api-mobile.md`, раздел «Уведомления»).

## Стек

| Слой | Технология |
|---|---|
| Язык | Kotlin 2.0.21 |
| UI | Jetpack Compose + Material 3 (BOM 2024.12.01) |
| Архитектура | MVVM + Clean Architecture (presentation / domain / data) |
| DI | Hilt 2.51.1 (KSP) |
| Сеть | Retrofit 2.11 + OkHttp 4.12 + kotlinx.serialization |
| Кэш | Room 2.6.1 (последние задачи и уведомления для офлайна) |
| Сессия | EncryptedSharedPreferences (Android Keystore) |
| Фон | WorkManager (синхронизация уведомлений каждые 30 минут) |
| Аналитика | слой событий `Analytics.kt`, готов к Yandex AppMetrica |

Требования к сборке: JDK 17, Android SDK 35, Gradle 8.11.1 (wrapper).

## Структура проекта

```
android/
├── app/src/main/java/ru/studpod/app/
│   ├── core/           # network (Retrofit/DTO), security, util, analytics, notifications
│   ├── data/           # repository-реализации + Room-кэш + мапперы DTO→domain
│   ├── domain/         # модели и интерфейсы репозиториев
│   └── presentation/   # экраны, ViewModel, навигация, тема, UI-компоненты
├── gradle/libs.versions.toml   # все версии зависимостей
└── README.md
```

Навигация: Splash → Вход → Регистрация → Bottom Navigation:
**Главная · Задачи · Мои проекты · Уведомления · Профиль**.

## Запуск проекта

> **Важно:** в Android Studio открывайте папку **`android/`** внутри репозитория,
> а не корень репозитория (в корне нет Gradle-файлов — там backend сайта).

1. **Установите [Android Studio](https://developer.android.com/studio)** (стабильная версия).
   Она поставляется со встроенной JDK — отдельно Java ставить не нужно.

2. **Откройте проект**:
   `File → Open…` → выберите папку `android/` → `OK`.
   Android Studio определит Gradle-проект (wrapper `gradle-wrapper.jar` уже включён в репозиторий).

3. **Дождитесь первой синхронизации Gradle** (Gradle 8.11.1 скачается автоматически).
   Если Android Studio попросит установить компоненты — соглашайтесь:
   - **Android SDK Platform 35**;
   - **Android SDK Build-Tools 35**;
   - **Android SDK Platform-Tools**.
   Это стандартные компоненты — «что-то не установлено» означает именно их:
   `Tools → SDK Manager → SDK Platforms/System Settings`.

4. **Подключение backend**:
   - По умолчанию приложение ходит на прод: `https://xn----gtbba2cfjcjk2l.xn--p1ai`
     (домен студ-подряд.рф в punycode).
   - Для локальной разработки (эмулятор → ваш dev-сервер на `localhost:3000`)
     раскомментируйте в файле `android/gradle.properties` строку:
     ```properties
     API_BASE_URL=http://10.0.2.2:3000
     ```
     и нажмите **Sync Now**.
   - Обратите внимание: `POST /api/auth/login` и `/register` должны отдавать
     поле `token` — это уже реализовано в `server.ts` (см. `docs/api-mobile.md`).

5. **Запуск**:
   - выберите конфигурацию `app` в верхней панели;
   - нажмите зелёный треугольник ▶ (Run). Приложение установится на эмулятор/устройство.

Сборка из командной строки (альтернатива):
```bash
cd android
./gradlew assembleDebug
# APK: app/build/outputs/apk/debug/app-debug.apk
adb install app/build/outputs/apk/debug/app-debug.apk
```

## Сборка релиза (APK / AAB)

### 1. Подпись приложения

Создайте keystore (один раз):

```bash
keytool -genkeypair -v \
  -keystore stud-pod-release.jks \
  -alias studpod \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass <пароль> -keypass <пароль> \
  -dname "CN=StudPod, OU=Mobile, O=StudPod, L=Moscow, C=RU"
```

Создайте файл `android/keystore.properties` (в git не коммитится — см. .gitignore):

```properties
storeFile=../stud-pod-release.jks
storePassword=<пароль>
keyAlias=studpod
keyPassword=<пароль>
```

### 2. Сборка

```bash
cd android
./gradlew assembleRelease   # APK → app/build/outputs/apk/release/
./gradlew bundleRelease     # AAB → app/build/outputs/bundle/release/app-release.aab
```

Релизная сборка включает R8-минификацию (proguard-rules.pro) и
`usesCleartextTraffic=false` (только HTTPS).

### 3. Проверка перед публикацией

- [ ] Токен хранится в EncryptedSharedPreferences (не в обычном SharedPreferences);
- [ ] В релизной сборке нет cleartext-трафика;
- [ ] Приложение не зависит от Google Play Services (проверка: `./gradlew dependencies`
      — в дереве нет `com.google.android.gms`-артефактов);
- [ ] Тест на устройстве с Android 8 (minSdk 26) и Android 14/15.

## Публикация в RuStore

1. Зарегистрируйтесь в [RuStore для разработчиков](https://www.rustore.ru/developers/)
   (подтверждение юридического лица).
2. Создайте приложение, заполните карточку:
   - название: **Студенческий подряд**;
   - package name: `ru.studpod.app`;
   - категория: Образование;
   - иконки: 512×512 (сгенерируйте из `res/drawable/ic_launcher_foreground.xml`
     или приложите фирменный логотип портала);
   - скриншоты: эмулятор Pixel (1080×2340) — главная, каталог, карточка задачи,
     мои проекты, портфолио, уведомления.
3. Загрузите `app-release.aab` (в RuStore можно и APK, но AAB предпочтительнее).
4. Укажите доступы (персональные данные): приложение хранит токен сессии
   локально на устройстве; сервер — email, ФИО, вуз, курс, навыки.
5. Пройдите модерацию: укажите тестовый аккаунт, если потребуется
   (создайте студента через форму регистрации в приложении).

## Уведомления (этапы)

1. **Сейчас**: in-app уведомления + фоновая синхронизация WorkManager
   каждые 30 минут (`NotificationSyncWorker`). Новые уведомления показываются
   системным уведомлением (нужно разрешение POST_NOTIFICATIONS, запрашивается
   при первом запуске).
2. **Далее**: RuStore Push SDK — серверные пуши. Потребуется:
   - таблица `push_tokens` (userId, token, platform) в `database.ts`;
   - `POST /api/devices/register` в backend;
   - отправка через RuStore Push API при создании уведомлений.

## Аналитика

Все ключевые события уже расставлены (`Analytics.kt`): `app_open`,
`task_view`, `task_apply`, `result_upload`, `portfolio_open` и др.
Для прод-аналитики подключите [Yandex AppMetrica](https://appmetrica.yandex.ru/):

```kotlin
// core/analytics/Analytics.kt — заменить TODO на реальный вызов
YandexMetrica.reportEvent(name, params)
```

Это позволит доказать: «X студентов начали взаимодействовать с платформой
через мобильный канал».

## Частые проблемы

| Проблема | Решение |
|---|---|
| «Устройство не выбрано / No device» | создайте эмулятор: `Tools → Device Manager → Create virtual device` или подключите телефон с включённой отладкой по USB |
| «SDK Platform 35 не установлен» | `Tools → SDK Manager` → поставьте галочку и установите; затем `Sync Now` |
| Ошибки про `Could not find org.jetbrains.kotlin...` / «не скачаны модули» | первая синхронизация скачивает Gradle 8.11.1 + сотни мегабайт зависимостей с `dl.google.com`, `repo.maven.apache.org`, `services.gradle.org`. Подождите завершения (внизу Android Studio — прогресс «Downloading …»). Если скачивание прерывается — проверьте доступ к этим доменам: они должны быть открыты без VPN-блокировок/антивирусного прокси; после исправления сети: `File → Sync Project with Gradle Files` |
| `401` при входе | dev-бэкенд должен возвращать `token` в login/register (правки в `server.ts` уже внесены) |
| `Cleartext HTTP traffic not permitted` | используйте debug-сборку или HTTPS-адрес; в release cleartext запрещён намеренно |
| `Could not find or load main class org.gradle.wrapper.GradleWrapperMain` | файл `gradle/wrapper/gradle-wrapper.jar` должен лежать в репозитории (теперь он включён). Если удалился — восстановите из git: `git checkout android/gradle/wrapper/gradle-wrapper.jar` |
| Не собирается на Windows | используйте `gradlew.bat`; в Android Studio Java уже встроена (Bundled JBR 17+) |
| Пустой список задач | проверьте, что `API_BASE_URL` указывает на сервер с БД, где есть задачи со статусом `open` |

## Документация API

Полный контракт мобильного API — [`docs/api-mobile.md`](../docs/api-mobile.md).
