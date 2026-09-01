package ru.studpod.app.core.notifications

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import ru.studpod.app.MainActivity
import ru.studpod.app.R
import ru.studpod.app.core.security.SessionManager
import ru.studpod.app.data.repository.NotificationRepository
import java.util.concurrent.TimeUnit

/**
 * Периодическая синхронизация уведомлений: раз в 30 минут тянем свежие
 * уведомления и показываем системные push-подобные уведомления о новых.
 *
 * Это этап 1 уведомлений (без внешних SDK). Этап 2 — RuStore Push SDK
 * (см. README, раздел «Уведомления»): серверные пуши вместо polling.
 */
@HiltWorker
class NotificationSyncWorker @AssistedInject constructor(
    @Assisted appContext: Context,
    @Assisted params: WorkerParameters,
    private val sessionManager: SessionManager,
    private val notificationRepository: NotificationRepository,
) : CoroutineWorker(appContext, params) {

    override suspend fun doWork(): Result {
        // Без активной сессии синхронизировать нечего
        if (!sessionManager.hasSession()) {
            return Result.success()
        }

        val result = notificationRepository.getNotifications(limit = 20)
        return when (result) {
            is ru.studpod.app.core.util.AppResult.Success -> {
                val newUnread = result.data.filter { !it.read }
                newUnread.take(MAX_SYSTEM_NOTIFICATIONS).forEach { notification ->
                    showSystemNotification(notification)
                }
                Result.success()
            }
            is ru.studpod.app.core.util.AppResult.Error -> {
                if (result.code == 401) {
                    Result.success()
                } else {
                    Result.retry()
                }
            }
        }
    }

    private fun showSystemNotification(notification: ru.studpod.app.domain.model.AppNotification) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(applicationContext, Manifest.permission.POST_NOTIFICATIONS) !=
            PackageManager.PERMISSION_GRANTED
        ) {
            return
        }

        val intent = Intent(applicationContext, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra(EXTRA_OPEN_NOTIFICATIONS, true)
        }
        val pendingIntent = PendingIntent.getActivity(
            applicationContext,
            notification.id.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        val notificationCompat = NotificationCompat.Builder(applicationContext, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(notification.title)
            .setContentText(notification.message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(notification.message))
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .build()

        runCatching {
            NotificationManagerCompat.from(applicationContext)
                .notify(notification.id.hashCode(), notificationCompat)
        }
    }

    companion object {
        const val CHANNEL_ID = "portal_notifications"
        const val EXTRA_OPEN_NOTIFICATIONS = "extra_open_notifications"
        private const val WORK_NAME = "notifications_sync"
        private const val MAX_SYSTEM_NOTIFICATIONS = 3

        fun createNotificationChannel(context: Context) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val channel = NotificationChannel(
                    CHANNEL_ID,
                    context.getString(R.string.notifications_channel_name),
                    NotificationManager.IMPORTANCE_DEFAULT,
                ).apply {
                    description = context.getString(R.string.notifications_channel_description)
                }
                context.getSystemService(NotificationManager::class.java)
                    .createNotificationChannel(channel)
            }
        }

        fun schedule(context: Context) {
            val request = PeriodicWorkRequestBuilder<NotificationSyncWorker>(
                30,
                TimeUnit.MINUTES,
            ).build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                request,
            )
        }

        fun cancel(context: Context) {
            WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME)
        }
    }
}
