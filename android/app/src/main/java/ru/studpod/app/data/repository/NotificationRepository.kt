package ru.studpod.app.data.repository

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import ru.studpod.app.core.network.ApiService
import ru.studpod.app.core.network.AppNotificationDto
import ru.studpod.app.core.util.AppResult
import ru.studpod.app.core.util.safeApiCall
import ru.studpod.app.data.local.NotificationCacheDao
import ru.studpod.app.data.local.NotificationCacheEntity
import ru.studpod.app.domain.model.AppNotification
import javax.inject.Inject
import javax.inject.Singleton

/** Уведомления: список, отметка прочитанным, кэш для офлайн. */
interface NotificationRepository {
    val unreadCount: StateFlow<Int>
    suspend fun getNotifications(limit: Int): AppResult<List<AppNotification>>
    suspend fun markRead(notificationId: String): AppResult<Unit>
    suspend fun markAllRead(): AppResult<Unit>
    suspend fun getCachedNotifications(): List<AppNotification>
}

@Singleton
class NotificationRepositoryImpl @Inject constructor(
    private val api: ApiService,
    private val cacheDao: NotificationCacheDao,
    private val json: Json,
) : NotificationRepository {

    private val _unreadCount = MutableStateFlow(0)
    override val unreadCount: StateFlow<Int> = _unreadCount.asStateFlow()

    override suspend fun getNotifications(limit: Int): AppResult<List<AppNotification>> {
        val result = safeApiCall { api.notifications(limit) }
        return when (result) {
            is AppResult.Success -> {
                _unreadCount.value = result.data.unreadCount
                writeCache(result.data.items)
                AppResult.Success(result.data.items.map { it.toDomain() })
            }
            is AppResult.Error -> result
        }
    }

    override suspend fun markRead(notificationId: String): AppResult<Unit> {
        return when (val result = safeApiCall { api.markNotificationRead(notificationId) }) {
            is AppResult.Success -> {
                _unreadCount.value = (_unreadCount.value - 1).coerceAtLeast(0)
                AppResult.Success(Unit)
            }
            is AppResult.Error -> result
        }
    }

    override suspend fun markAllRead(): AppResult<Unit> {
        return when (val result = safeApiCall { api.markAllNotificationsRead() }) {
            is AppResult.Success -> {
                _unreadCount.value = 0
                AppResult.Success(Unit)
            }
            is AppResult.Error -> result
        }
    }

    override suspend fun getCachedNotifications(): List<AppNotification> =
        cacheDao.getRecent(50).mapNotNull { entity ->
            runCatching {
                json.decodeFromString(AppNotificationDto.serializer(), entity.json).toDomain()
            }.getOrNull()
        }

    private suspend fun writeCache(items: List<AppNotificationDto>) {
        val now = System.currentTimeMillis()
        cacheDao.upsertAll(
            items.map { item ->
                NotificationCacheEntity(
                    id = item.id,
                    title = item.title,
                    message = item.message,
                    read = item.read,
                    createdAt = item.createdAt,
                    json = json.encodeToString(AppNotificationDto.serializer(), item),
                    cachedAt = now,
                )
            },
        )
        cacheDao.prune(200)
    }
}
