package ru.studpod.app.presentation.mytasks

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ru.studpod.app.core.util.Formatters
import ru.studpod.app.domain.model.MyTaskItem
import ru.studpod.app.presentation.ui.components.EmptyState
import ru.studpod.app.presentation.ui.components.ErrorState
import ru.studpod.app.presentation.ui.components.Labels
import ru.studpod.app.presentation.ui.components.LoadingState
import ru.studpod.app.presentation.ui.components.StatusChip
import ru.studpod.app.presentation.ui.components.responseStatusKind
import ru.studpod.app.presentation.ui.theme.SuccessGreen

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyTasksScreen(
    onTaskClick: (String) -> Unit,
    viewModel: MyTasksViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }
    var responseForSubmit by remember { mutableStateOf<MyTaskItem?>(null) }

    LaunchedEffect(state.actionMessage) {
        state.actionMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearActionMessage()
        }
    }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Мои проекты") }) },
        snackbarHost = { SnackbarHost(snackbarHostState) },
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
                    title = "Пока нет активных задач",
                    description = "Откликнитесь на задачу в каталоге — она появится здесь",
                    modifier = Modifier.padding(innerPadding),
                )
            else -> LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                items(state.items, key = { it.response.id }) { item ->
                    MyTaskCard(
                        item = item,
                        isSubmitting = state.submittingResponseId == item.response.id,
                        onClick = { onTaskClick(item.task.id) },
                        onSubmit = { responseForSubmit = item },
                    )
                }
            }
        }
    }

    responseForSubmit?.let { item ->
        SubmitResultDialog(
            taskTitle = item.task.title,
            isSubmitting = state.submittingResponseId == item.response.id,
            onConfirm = { link ->
                viewModel.submitResult(item.response.id, link)
                responseForSubmit = null
            },
            onDismiss = { responseForSubmit = null },
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun MyTaskCard(
    item: MyTaskItem,
    isSubmitting: Boolean,
    onClick: () -> Unit,
    onSubmit: () -> Unit,
) {
    val canSubmit = item.response.status in CAN_SUBMIT_STATUSES

    Card(
        onClick = onClick,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.Top,
            ) {
                Column(Modifier.weight(1f)) {
                    Text(
                        text = item.task.title,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        text = item.task.organizationName,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(top = 2.dp),
                    )
                }
                StatusChip(
                    text = Labels.responseStatus(item.response.status),
                    kind = responseStatusKind(item.response.status),
                )
            }

            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(top = 10.dp),
            ) {
                Text(
                    text = Formatters.deadlineLabel(item.task.deadline),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(Modifier.weight(1f))
                Text(
                    text = "+${item.task.pointsReward} баллов",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.primary,
                )
            }

            if (item.response.teamMembers.size > 1) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(top = 6.dp),
                ) {
                    Icon(
                        imageVector = Icons.Default.People,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.width(14.dp).height(14.dp),
                    )
                    Text(
                        text = "Команда: ${item.response.teamMembers.joinToString { it.studentName }}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(start = 4.dp),
                    )
                }
            }

            if (item.response.reviewComment.isNotBlank()) {
                Text(
                    text = "Комментарий: ${item.response.reviewComment}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 6.dp),
                )
            }

            if (canSubmit) {
                Button(
                    onClick = onSubmit,
                    enabled = !isSubmitting,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 12.dp),
                ) {
                    Icon(Icons.Default.Send, contentDescription = null)
                    Text("Отправить результат", modifier = Modifier.padding(start = 6.dp))
                }
            }

            if (item.response.status == "completed") {
                Text(
                    text = "Задача выполнена — кейс добавлен в портфолио",
                    style = MaterialTheme.typography.bodySmall,
                    color = SuccessGreen,
                    modifier = Modifier.padding(top = 8.dp),
                )
            }
        }
    }
}

@Composable
private fun SubmitResultDialog(
    taskTitle: String,
    isSubmitting: Boolean,
    onConfirm: (String) -> Unit,
    onDismiss: () -> Unit,
) {
    var link by rememberSaveable { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = { if (!isSubmitting) onDismiss() },
        title = { Text("Результат работы") },
        text = {
            Column {
                Text(
                    text = "По задаче «$taskTitle» укажите ссылку на результат (документ, архив, сайт, репозиторий)",
                    style = MaterialTheme.typography.bodyMedium,
                )
                Spacer(Modifier.height(10.dp))
                OutlinedTextField(
                    value = link,
                    onValueChange = { link = it },
                    placeholder = { Text("https://…") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = { onConfirm(link.trim()) },
                enabled = !isSubmitting && link.isNotBlank(),
            ) {
                Text("Отправить на проверку")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, enabled = !isSubmitting) {
                Text("Отмена")
            }
        },
    )
}

private val CAN_SUBMIT_STATUSES = setOf("accepted", "needs_revision")
