package ru.studpod.app.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import ru.studpod.app.data.repository.AuthRepository
import ru.studpod.app.data.repository.NotificationRepository
import javax.inject.Inject

/**
 * Корневое состояние приложения: восстановление сессии при старте,
 * признак готовности (splash) и счётчик непрочитанных уведомлений.
 */
@HiltViewModel
class RootViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    notificationRepository: NotificationRepository,
) : ViewModel() {

    val session = authRepository.session
    val unreadCount = notificationRepository.unreadCount

    private val _isRestoring = MutableStateFlow(true)
    val isRestoring: StateFlow<Boolean> = _isRestoring.asStateFlow()

    init {
        viewModelScope.launch {
            authRepository.restoreSession()
            notificationRepository.getNotifications(limit = 20)
            _isRestoring.value = false
        }
    }
}
