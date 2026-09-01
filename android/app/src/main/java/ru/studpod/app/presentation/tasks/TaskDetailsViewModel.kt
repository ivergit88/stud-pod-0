package ru.studpod.app.presentation.tasks

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import ru.studpod.app.core.analytics.Analytics
import ru.studpod.app.core.util.AppResult
import ru.studpod.app.data.repository.TaskRepository
import ru.studpod.app.domain.model.Task
import ru.studpod.app.domain.model.TaskResponse
import javax.inject.Inject

data class TaskDetailsUiState(
    val isLoading: Boolean = true,
    val task: Task? = null,
    val error: String? = null,
    val isApplying: Boolean = false,
    val appliedResponse: TaskResponse? = null,
    val actionMessage: String? = null,
) {
    val canApply: Boolean
        get() = task?.isOpen == true && appliedResponse == null && !isApplying
}

@HiltViewModel
class TaskDetailsViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val taskRepository: TaskRepository,
) : ViewModel() {

    private val taskId: String = checkNotNull(savedStateHandle["taskId"])

    private val _uiState = MutableStateFlow(TaskDetailsUiState())
    val uiState: StateFlow<TaskDetailsUiState> = _uiState.asStateFlow()

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            when (val result = taskRepository.getTask(taskId)) {
                is AppResult.Success -> {
                    _uiState.value = _uiState.value.copy(isLoading = false, task = result.data)
                    Analytics.logEvent(Analytics.EVENT_TASK_VIEW, mapOf("task_id" to taskId))
                }
                is AppResult.Error -> {
                    _uiState.value = _uiState.value.copy(isLoading = false, error = result.message)
                }
            }
        }
    }

    /** Откликнуться на задачу (POST /api/tasks/:id/take). */
    fun applyForTask(coverLetter: String = "") {
        if (!_uiState.value.canApply) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isApplying = true, actionMessage = null)
            when (val result = taskRepository.takeTask(taskId, coverLetter)) {
                is AppResult.Success -> {
                    _uiState.value = _uiState.value.copy(
                        isApplying = false,
                        appliedResponse = result.data,
                        actionMessage = "Вы откликнулись на задачу!",
                    )
                    Analytics.logEvent(Analytics.EVENT_TASK_APPLY, mapOf("task_id" to taskId))
                }
                is AppResult.Error -> {
                    _uiState.value = _uiState.value.copy(
                        isApplying = false,
                        actionMessage = result.message,
                    )
                }
            }
        }
    }

    fun clearActionMessage() {
        _uiState.value = _uiState.value.copy(actionMessage = null)
    }
}
