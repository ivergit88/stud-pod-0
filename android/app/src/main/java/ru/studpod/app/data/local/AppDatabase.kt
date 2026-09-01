package ru.studpod.app.data.local

import androidx.room.Database
import androidx.room.RoomDatabase

@Database(
    entities = [
        TaskCacheEntity::class,
        NotificationCacheEntity::class,
    ],
    version = 1,
    exportSchema = false,
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun taskCacheDao(): TaskCacheDao
    abstract fun notificationCacheDao(): NotificationCacheDao
}
