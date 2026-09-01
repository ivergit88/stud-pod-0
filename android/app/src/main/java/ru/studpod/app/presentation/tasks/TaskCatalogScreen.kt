package ru.studpod.app.presentation.tasks

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ru.studpod.app.presentation.ui.components.EmptyState
import ru.studpod.app.presentation.ui.components.ErrorState
import ru.studpod.app.presentation.ui.components.LoadingState
import ru.studpod.app.presentation.ui.components.TaskCard
import ru.studpod.app.presentation.ui.theme.WarningAmber

private val CATEGORIES = listOf(
    "Все", "Контент", "Дизайн", "Сайт", "Бот", "Оцифровка", "3D", "Настройка", "Аналитика", "Другое",
)

private val FORMATS = listOf(
    "Все форматы" to null,
    "Онлайн" to "online",
    "Гибрид" to "hybrid",
    "Очно" to "offline",
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TaskCatalogScreen(
    onTaskClick: (String) -> Unit,
    viewModel: TaskCatalogViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val listState = rememberLazyListState()

    // Бесконечная подгрузка: когда дошли до конца списка
    LaunchedEffect(listState, state.tasks.size) {
        val layoutInfo = listState.layoutInfo
        val lastVisible = layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0
        if (lastVisible >= layoutInfo.totalItemsCount - 4) {
            viewModel.loadMore()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Задачи") })
        },
        containerColor = MaterialTheme.colorScheme.background,
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
        ) {
            OutlinedTextField(
                value = state.query,
                onValueChange = viewModel::onQueryChange,
                placeholder = { Text("Поиск по названию и описанию") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                trailingIcon = {
                    if (state.query.isNotBlank()) {
                        IconButton(onClick = { viewModel.onQueryChange("") }) {
                            Icon(Icons.Default.Clear, contentDescription = "Очистить")
                        }
                    }
                },
                singleLine = true,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
            )

            LazyRow(
                contentPadding = PaddingValues(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                items(CATEGORIES) { category ->
                    FilterChip(
                        selected = state.activeCategory == category,
                        onClick = { viewModel.onCategoryChange(category) },
                        label = { Text(category) },
                    )
                }
            }

            LazyRow(
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                items(FORMATS) { (label, value) ->
                    FilterChip(
                        selected = state.format == value,
                        onClick = { viewModel.onFormatChange(value) },
                        label = { Text(label) },
                    )
                }
            }

            when {
                state.isLoading -> LoadingState(Modifier.weight(1f))
                state.error != null && state.tasks.isEmpty() ->
                    ErrorState(
                        message = state.error!!,
                        modifier = Modifier.weight(1f),
                        onRetry = { viewModel.reload() },
                    )
                state.tasks.isEmpty() ->
                    EmptyState(
                        title = "Задачи не найдены",
                        description = "Попробуйте изменить фильтры или поисковый запрос",
                        modifier = Modifier.weight(1f),
                    )
                else -> {
                    Column(Modifier.weight(1f)) {
                        if (state.fromCache) {
                            Text(
                                text = "Нет соединения — показаны сохранённые задачи",
                                style = MaterialTheme.typography.bodySmall,
                                color = WarningAmber,
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp),
                            )
                        }
                        LazyColumn(
                            state = listState,
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp),
                        ) {
                            items(state.tasks, key = { it.id }) { task ->
                                TaskCard(
                                    task = task,
                                    onClick = { onTaskClick(task.id) },
                                    onApply = null,
                                )
                            }
                            if (state.isLoadingMore) {
                                item {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(8.dp),
                                        horizontalArrangement = Arrangement.Center,
                                        verticalAlignment = Alignment.CenterVertically,
                                    ) {
                                        CircularProgressIndicator(modifier = Modifier.padding(end = 8.dp))
                                        Text("Загружаем ещё…")
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
