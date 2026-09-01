package ru.studpod.app.presentation.home

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ru.studpod.app.core.util.Formatters
import ru.studpod.app.presentation.ui.components.EmptyState
import ru.studpod.app.presentation.ui.components.ErrorState
import ru.studpod.app.presentation.ui.components.LoadingState
import ru.studpod.app.presentation.ui.components.StatusChip
import ru.studpod.app.presentation.ui.components.TaskCard
import ru.studpod.app.presentation.ui.components.responseStatusKind
import ru.studpod.app.presentation.ui.components.Labels
import ru.studpod.app.presentation.ui.theme.PortalBlue
import ru.studpod.app.presentation.ui.theme.SuccessGreen
import ru.studpod.app.presentation.ui.theme.WarningAmber

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onTaskClick: (String) -> Unit,
    onOpenCatalog: () -> Unit,
    onOpenMyTasks: () -> Unit,
    viewModel: HomeViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Главная") },
                actions = {
                    IconButton(onClick = { viewModel.load() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Обновить")
                    }
                },
            )
        },
        containerColor = MaterialTheme.colorScheme.background,
    ) { innerPadding ->
        when {
            state.isLoading -> LoadingState(Modifier.padding(innerPadding))
            state.error != null && state.newTasks.isEmpty() ->
                ErrorState(
                    message = state.error!!,
                    modifier = Modifier.padding(innerPadding),
                    onRetry = { viewModel.load() },
                )
            else -> LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                item { GreetingCard(state) }
                item { StatsRow(state) }

                if (state.fromCache) {
                    item {
                        Text(
                            text = "Нет соединения — показаны сохранённые задачи",
                            style = MaterialTheme.typography.bodySmall,
                            color = WarningAmber,
                        )
                    }
                }

                item {
                    SectionHeader(
                        title = "Новые задачи",
                        action = "Все задачи",
                        onAction = onOpenCatalog,
                    )
                }

                if (state.newTasks.isEmpty()) {
                    item { EmptyState(title = "Пока нет открытых задач") }
                } else {
                    items(state.newTasks.take(5), key = { it.id }) { task ->
                        TaskCard(
                            task = task,
                            onClick = { onTaskClick(task.id) },
                            onApply = null,
                        )
                    }
                }

                item {
                    SectionHeader(
                        title = "Мои проекты",
                        action = "Все",
                        onAction = onOpenMyTasks,
                    )
                }

                if (state.myItems.isEmpty()) {
                    item {
                        EmptyState(
                            title = "Вы ещё не взяли ни одной задачи",
                            description = "Загляните в каталог и откликнитесь на первую задачу",
                        )
                    }
                } else {
                    items(state.myItems.take(3), key = { it.response.id }) { item ->
                        ActiveTaskRow(
                            title = item.task.title,
                            status = item.response.status,
                            points = item.task.pointsReward,
                            onClick = { onTaskClick(item.task.id) },
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun GreetingCard(state: HomeUiState) {
    val user = state.user
    Card(
        colors = CardDefaults.cardColors(containerColor = PortalBlue),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(Modifier.padding(20.dp)) {
            Text(
                text = "Добро пожаловать${user?.name?.let { ", $it" } ?: ""}!",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onPrimary,
            )
            Text(
                text = "Берите задачи учреждений культуры, выполняйте и копите баллы",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.85f),
                modifier = Modifier.padding(top = 4.dp),
            )
        }
    }
}

@Composable
private fun StatsRow(state: HomeUiState) {
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        StatCard(
            label = "Баллы",
            value = state.user?.points?.toString() ?: "—",
            icon = { Icon(Icons.Default.Star, null, tint = SuccessGreen, modifier = Modifier.size(20.dp)) },
            modifier = Modifier.weight(1f),
        )
        StatCard(
            label = "В работе",
            value = state.activeCount.toString(),
            icon = { Icon(Icons.Default.ArrowForward, null, tint = WarningAmber, modifier = Modifier.size(20.dp)) },
            modifier = Modifier.weight(1f),
        )
        StatCard(
            label = "Выполнено",
            value = state.completedCount.toString(),
            icon = { Icon(Icons.Default.CheckCircle, null, tint = SuccessGreen, modifier = Modifier.size(20.dp)) },
            modifier = Modifier.weight(1f),
        )
    }
}

@Composable
private fun StatCard(
    label: String,
    value: String,
    icon: @Composable () -> Unit,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Column(Modifier.padding(12.dp)) {
            icon()
            Text(
                text = value,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(top = 6.dp),
            )
            Text(
                text = label,
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun SectionHeader(
    title: String,
    action: String,
    onAction: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.weight(1f),
        )
        Text(
            text = action,
            style = MaterialTheme.typography.labelLarge,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier
                .clickable(onClick = onAction)
                .padding(4.dp),
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ActiveTaskRow(
    title: String,
    status: String,
    points: Int,
    onClick: () -> Unit,
) {
    Card(
        onClick = onClick,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(Modifier.weight(1f)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    text = "+${Formatters.pointsLabel(points)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 2.dp),
                )
            }
            StatusChip(text = Labels.responseStatus(status), kind = responseStatusKind(status))
        }
    }
}
