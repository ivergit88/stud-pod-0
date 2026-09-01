package ru.studpod.app.presentation.mytasks

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
import ru.studpod.app.domain.model.MyTaskItem
import javax.inject.Inject

data class MyTasksUiState(
    val isLoading: Boolean = true,
    val items: List<MyTaskItem> = emptyList(),
    val error: String? = null,
    val submittingResponseId: String? = null,
    val actionMessage: String? = null,
)

/** «Мои проекты»: отклики студента со статусами и отправка результата. */
@HiltViewModel
class MyTasksViewModel @Inject constructor(
    private val taskRepository: TaskRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(MyTasksUiState())
    val uiState: StateFlow<MyTasksUiState> = _uiState.asStateFlow()

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            when (val result = taskRepository.getMyTasks()) {
                is AppResult.Success -> {
                    _uiState.value = _uiState.value.copy(isLoading = false, items = result.data)
                }
                is AppResult.Error -> {
                    _uiState.value = _uiState.value.copy(isLoading = false, error = result.message)
                }
            }
        }
    }

    /** Отправить результат на проверку (POST /api/task-responses/:id/submit). */
    fun submitResult(responseId: String, submissionLink: String) {
        if (submissionLink.isBlank()) {
            _uiState.value = _uiState.value.copy(actionMessage = "Укажите ссылку на результат")
            return
        }
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(submittingResponseId = responseId, actionMessage = null)
            when (val result = taskRepository.submitResult(responseId, submissionLink)) {
                is AppResult.Success -> {
                    val updated = result.data
                    _uiState.value = _uiState.value.copy(
                        submittingResponseId = null,
                        items = _uiState.value.items.map { item ->
                            if (item.response.id == responseId) {
                                item.copy(response = updated)
                            } else {
                                item
                            }
                        },
                        actionMessage = "Результат отправлен на проверку",
                    )
                    Analytics.logEvent(
                        Analytics.EVENT_TASK_RESULT_UPLOAD,
                        mapOf("response_id" to responseId),
                    )
                }
                is AppResult.Error -> {
                    _uiState.value = _uiState.value.copy(
                        submittingResponseId = null,
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
