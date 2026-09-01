package ru.studpod.app.presentation.notifications

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DoneAll
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
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ru.studpod.app.core.util.Formatters
import ru.studpod.app.domain.model.AppNotification
import ru.studpod.app.presentation.ui.components.EmptyState
import ru.studpod.app.presentation.ui.components.ErrorState
import ru.studpod.app.presentation.ui.components.LoadingState
import ru.studpod.app.presentation.ui.theme.PortalBlue
import ru.studpod.app.presentation.ui.theme.PortalBlueContainer

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationsScreen(
    viewModel: NotificationsViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = if (state.unreadCount > 0) {
                            "Уведомления (${state.unreadCount})"
                        } else {
                            "Уведомления"
                        },
                    )
                },
                actions = {
                    IconButton(onClick = { viewModel.markAllRead() }) {
                        Icon(Icons.Default.DoneAll, contentDescription = "Прочитать все")
                    }
                },
            )
        },
        containerColor = MaterialTheme.colorScheme.background,
    ) { innerPadding ->
        when {
            state.isLoading -> LoadingState(Modifier.padding(innerPadding))
            state.error != null && state.items.isEmpty() ->
                ErrorState(
                    message = state.error!!,
                    modifier = Modifier.padding(innerPadding),
                    onRetry = { viewModel.load() },
                )
            state.items.isEmpty() ->
                EmptyState(
                    title = "Уведомлений нет",
                    description = "Новые задачи и изменения статусов придут сюда",
                    modifier = Modifier.padding(innerPadding),
                )
            else -> LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                items(state.items, key = { it.id }) { notification ->
                    NotificationRow(
                        notification = notification,
                        onClick = { viewModel.markRead(notification) },
                    )
                }
            }
        }
    }
}

@Composable
private fun NotificationRow(
    notification: AppNotification,
    onClick: () -> Unit,
) {
    val container = if (notification.read) {
        MaterialTheme.colorScheme.surface
    } else {
        PortalBlueContainer.copy(alpha = 0.45f)
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(container, RoundedCornerShape(14.dp))
            .clickable(onClick = onClick)
            .padding(14.dp),
        verticalAlignment = Alignment.Top,
    ) {
        Box(
            modifier = Modifier
                .padding(top = 2.dp)
                .size(8.dp)
                .background(
                    if (notification.read) MaterialTheme.colorScheme.outline.copy(alpha = 0.3f)
                    else PortalBlue,
                    RoundedCornerShape(50),
                ),
        )
        Column(
            modifier = Modifier
                .weight(1f)
                .padding(start = 10.dp),
        ) {
            Text(
                text = notification.title,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = if (notification.read) FontWeight.Normal else FontWeight.Bold,
            )
            Text(
                text = notification.message,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 4.dp),
            )
            Text(
                text = Formatters.relativeDate(notification.createdAt),
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 6.dp),
            )
        }
    }
}
