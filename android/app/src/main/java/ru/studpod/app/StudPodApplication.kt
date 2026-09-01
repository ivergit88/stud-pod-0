package ru.studpod.app

import android.app.Application
import androidx.hilt.work.HiltWorkerFactory
import androidx.work.Configuration
import dagger.hilt.android.HiltAndroidApp
import ru.studpod.app.core.notifications.NotificationSyncWorker
import javax.inject.Inject

@HiltAndroidApp
class StudPodApplication : Application(), Configuration.Provider {

    @Inject
    lateinit var workerFactory: HiltWorkerFactory

    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setWorkerFactory(workerFactory)
            .build()

    override fun onCreate() {
        super.onCreate()
        // Канал системных уведомлений (Android 8+)
        NotificationSyncWorker.createNotificationChannel(this)
        // Фоновая синхронизация уведомлений (раз в 30 минут)
        NotificationSyncWorker.schedule(this)
    }
}
