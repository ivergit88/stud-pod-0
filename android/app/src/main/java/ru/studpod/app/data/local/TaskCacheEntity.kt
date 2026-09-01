package ru.studpod.app.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

/** Кэш задач: храним JSON последней загруженной страницы каталога. */
@Entity(tableName = "task_cache")
data class TaskCacheEntity(
    @PrimaryKey val id: String,
    val title: String,
    val category: String,
    val status: String,
    val json: String,
    val cachedAt: Long,
)
