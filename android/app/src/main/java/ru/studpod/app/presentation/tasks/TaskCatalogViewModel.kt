package ru.studpod.app.presentation.tasks

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import ru.studpod.app.core.util.AppResult
import ru.studpod.app.data.repository.TaskFilters
import ru.studpod.app.data.repository.TaskRepository
import ru.studpod.app.domain.model.Task
import javax.inject.Inject

data class TaskCatalogUiState(
    val isLoading: Boolean = true,
    val isLoadingMore: Boolean = false,
    val tasks: List<Task> = emptyList(),
    val page: Int = 1,
    val hasMore: Boolean = false,
    val error: String? = null,
    val fromCache: Boolean = false,
    val query: String = "",
    val category: String? = null,
    val format: String? = null,
    val activeCategory: String = ALL_CATEGORIES,
) {
    companion object {
        const val ALL_CATEGORIES = "Все"
    }
}

/** Каталог задач: серверная пагинация, поиск, фильтры по категории и формату. */
@HiltViewModel
class TaskCatalogViewModel @Inject constructor(
    private val taskRepository: TaskRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(TaskCatalogUiState())
    val uiState: StateFlow<TaskCatalogUiState> = _uiState.asStateFlow()

    private var searchJob: Job? = null

    init {
        reload()
    }

    fun reload() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            loadPage(page = 1, append = false)
        }
    }

    fun loadMore() {
        val state = _uiState.value
        if (state.isLoadingMore || !state.hasMore || state.isLoading) return
        viewModelScope.launch {
            loadPage(page = state.page + 1, append = true)
        }
    }

    fun onQueryChange(value: String) {
        _uiState.value = _uiState.value.copy(query = value)
        searchJob?.cancel()
        searchJob = viewModelScope.launch {
            delay(SEARCH_DEBOUNCE_MS)
            reload()
        }
    }

    fun onCategoryChange(category: String) {
        _uiState.value = _uiState.value.copy(
            activeCategory = category,
            category = category.takeIf { it != TaskCatalogUiState.ALL_CATEGORIES },
        )
        reload()
    }

    fun onFormatChange(format: String?) {
        _uiState.value = _uiState.value.copy(format = format)
        reload()
    }

    private suspend fun loadPage(page: Int, append: Boolean) {
        if (append) {
            _uiState.value = _uiState.value.copy(isLoadingMore = true)
        }
        val filters = TaskFilters(
            status = "open",
            category = _uiState.value.category,
            format = _uiState.value.format,
            query = _uiState.value.query,
        )
        when (val result = taskRepository.getTasks(page = page, filters = filters)) {
            is AppResult.Success -> {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    isLoadingMore = false,
                    tasks = if (append) _uiState.value.tasks + result.data.tasks else result.data.tasks,
                    page = result.data.page,
                    hasMore = result.data.hasMore,
                    error = null,
                    fromCache = false,
                )
            }
            is AppResult.Error -> {
                if (append) {
                    _uiState.value = _uiState.value.copy(isLoadingMore = false)
                } else {
                    val cached = taskRepository.getCachedTasks()
                    if (cached.isNotEmpty()) {
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            isLoadingMore = false,
                            tasks = cached,
                            page = 1,
                            hasMore = false,
                            fromCache = true,
                        )
                    } else {
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            isLoadingMore = false,
                            error = result.message,
                        )
                    }
                }
            }
        }
    }

    private companion object {
        const val SEARCH_DEBOUNCE_MS = 400L
    }
}
