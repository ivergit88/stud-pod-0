package ru.studpod.app.presentation.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import ru.studpod.app.core.analytics.Analytics
import ru.studpod.app.core.util.AppResult
import ru.studpod.app.data.repository.AuthRepository
import ru.studpod.app.data.repository.TaskFilters
import ru.studpod.app.data.repository.TaskRepository
import ru.studpod.app.domain.model.MyTaskItem
import ru.studpod.app.domain.model.Task
import ru.studpod.app.domain.model.User
import javax.inject.Inject

data class HomeUiState(
    val isLoading: Boolean = true,
    val user: User? = null,
    val newTasks: List<Task> = emptyList(),
    val myItems: List<MyTaskItem> = emptyList(),
    val error: String? = null,
    val fromCache: Boolean = false,
) {
    val activeCount: Int
        get() = myItems.count { it.response.status in ACTIVE_RESPONSE_STATUSES }

    val completedCount: Int
        get() = myItems.count { it.response.status == "completed" }

    companion object {
        val ACTIVE_RESPONSE_STATUSES = setOf("pending", "accepted", "submitted", "needs_revision")
    }
}

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val taskRepository: TaskRepository,
    authRepository: AuthRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        // Пользователь подтягивается из сессии
        viewModelScope.launch {
            authRepository.session.collect { state ->
                _uiState.value = _uiState.value.copy(user = state.user)
            }
        }

        Analytics.logEvent(Analytics.EVENT_APP_OPEN)
        load()
    }

    fun load() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)

            val tasksResult = taskRepository.getTasks(page = 1, filters = TaskFilters(status = "open"))
            val myResult = taskRepository.getMyTasks()

            val myItems = (myResult as? AppResult.Success<List<MyTaskItem>>)?.data ?: emptyList()

            when (tasksResult) {
                is AppResult.Success -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        newTasks = tasksResult.data.tasks,
                        myItems = myItems,
                        fromCache = false,
                    )
                }
                is AppResult.Error -> {
                    // Офлайн-режим: показываем кэшированные задачи, если они есть
                    val cached = taskRepository.getCachedTasks()
                    if (cached.isNotEmpty()) {
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            newTasks = cached,
                            myItems = myItems,
                            fromCache = true,
                        )
                    } else {
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            error = tasksResult.message,
                        )
                    }
                }
            }
        }
    }
}
