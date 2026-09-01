package ru.studpod.app.presentation.notifications

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import ru.studpod.app.core.analytics.Analytics
import ru.studpod.app.core.util.AppResult
import ru.studpod.app.data.repository.NotificationRepository
import ru.studpod.app.domain.model.AppNotification
import javax.inject.Inject

data class NotificationsUiState(
    val isLoading: Boolean = true,
    val items: List<AppNotification> = emptyList(),
    val unreadCount: Int = 0,
    val error: String? = null,
    val fromCache: Boolean = false,
)

@HiltViewModel
class NotificationsViewModel @Inject constructor(
    private val notificationRepository: NotificationRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(NotificationsUiState())
    val uiState: StateFlow<NotificationsUiState> = _uiState.asStateFlow()

    val unreadCount = notificationRepository.unreadCount

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            when (val result = notificationRepository.getNotifications(limit = 50)) {
                is AppResult.Success -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        items = result.data,
                        unreadCount = notificationRepository.unreadCount.value,
                        fromCache = false,
                    )
                }
                is AppResult.Error -> {
                    val cached = notificationRepository.getCachedNotifications()
                    if (cached.isNotEmpty()) {
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            items = cached,
                            fromCache = true,
                        )
                    } else {
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            error = result.message,
                        )
                    }
                }
            }
        }
    }

    fun markRead(notification: AppNotification) {
        if (notification.read) return
        // Оптимистично помечаем прочитанным
        _uiState.value = _uiState.value.copy(
            items = _uiState.value.items.map {
                if (it.id == notification.id) it.copy(read = true) else it
            },
        )
        viewModelScope.launch {
            notificationRepository.markRead(notification.id)
            Analytics.logEvent(Analytics.EVENT_NOTIFICATION_OPEN, mapOf("notification_id" to notification.id))
        }
    }

    fun markAllRead() {
        viewModelScope.launch {
            notificationRepository.markAllRead()
            _uiState.value = _uiState.value.copy(
                items = _uiState.value.items.map { it.copy(read = true) },
            )
        }
    }
}
