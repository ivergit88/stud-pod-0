package ru.studpod.app.core.analytics

import android.util.Log

/**
 * Аналитика ключевых событий пользовательского пути.
 *
 * В MVP события пишутся в Logcat — это нулевой этап. Для продовой аналитики
 * подключите Yandex AppMetrica (см. android/README.md, раздел «Аналитика»):
 *   YandexMetrica.reportEvent(name, params)
 * и вызывайте те же константы через Analytics.logEvent — все точки уже
 * расставлены по коду.
 */
object Analytics {

    const val EVENT_APP_OPEN = "app_open"
    const val EVENT_AUTH_LOGIN = "auth_login"
    const val EVENT_AUTH_REGISTER = "auth_register"
    const val EVENT_TASK_VIEW = "task_view"
    const val EVENT_TASK_APPLY = "task_apply"
    const val EVENT_TASK_RESULT_UPLOAD = "result_upload"
    const val EVENT_PORTFOLIO_OPEN = "portfolio_open"
    const val EVENT_NOTIFICATION_OPEN = "notification_open"

    private const val TAG = "StudPodAnalytics"

    fun logEvent(name: String, params: Map<String, Any?> = emptyMap()) {
        Log.d(TAG, "$name ${params.entries.joinToString { "${it.key}=${it.value}" }}")
        // TODO(AppMetrica): YandexMetrica.reportEvent(name, params)
    }
}
