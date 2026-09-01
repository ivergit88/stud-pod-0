package ru.studpod.app.presentation.portfolio

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

data class PortfolioUiState(
    val isLoading: Boolean = true,
    val items: List<MyTaskItem> = emptyList(),
    val error: String? = null,
)

/** «Мои кейсы»: подтверждённые выполненные задачи (status = completed). */
@HiltViewModel
class PortfolioViewModel @Inject constructor(
    private val taskRepository: TaskRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(PortfolioUiState())
    val uiState: StateFlow<PortfolioUiState> = _uiState.asStateFlow()

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            Analytics.logEvent(Analytics.EVENT_PORTFOLIO_OPEN)
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            when (val result = taskRepository.getPortfolio()) {
                is AppResult.Success -> {
                    _uiState.value = _uiState.value.copy(isLoading = false, items = result.data)
                }
                is AppResult.Error -> {
                    _uiState.value = _uiState.value.copy(isLoading = false, error = result.message)
                }
            }
        }
    }
}
