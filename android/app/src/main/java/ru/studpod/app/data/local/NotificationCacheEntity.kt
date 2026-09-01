package ru.studpod.app.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

/** Кэш уведомлений: показываем последние, даже когда сеть недоступна. */
@Entity(tableName = "notification_cache")
data class NotificationCacheEntity(
    @PrimaryKey val id: String,
    val title: String,
    val message: String,
    val read: Boolean,
    val createdAt: String,
    val json: String,
    val cachedAt: Long,
)
