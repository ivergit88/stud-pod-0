package ru.studpod.app.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface TaskCacheDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(tasks: List<TaskCacheEntity>)

    @Query("SELECT * FROM task_cache ORDER BY cachedAt DESC LIMIT :limit")
    suspend fun getRecent(limit: Int): List<TaskCacheEntity>

    @Query("SELECT COUNT(*) FROM task_cache")
    suspend fun count(): Int

    @Query("DELETE FROM task_cache")
    suspend fun clear()

    /** Оставляет последние :keep записей, остальные удаляет. */
    @Query("DELETE FROM task_cache WHERE id NOT IN (SELECT id FROM task_cache ORDER BY cachedAt DESC LIMIT :keep)")
    suspend fun prune(keep: Int)
}

@Dao
interface NotificationCacheDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(notifications: List<NotificationCacheEntity>)

    @Query("SELECT * FROM notification_cache ORDER BY createdAt DESC LIMIT :limit")
    suspend fun getRecent(limit: Int): List<NotificationCacheEntity>

    @Query("DELETE FROM notification_cache")
    suspend fun clear()

    @Query("SELECT COUNT(*) FROM notification_cache")
    suspend fun count(): Int

    @Query("DELETE FROM notification_cache WHERE id NOT IN (SELECT id FROM notification_cache ORDER BY createdAt DESC LIMIT :keep)")
    suspend fun prune(keep: Int)
}
