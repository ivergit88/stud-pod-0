package ru.studpod.app.presentation.tasks

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AttachFile
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Link
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ru.studpod.app.core.util.Formatters
import ru.studpod.app.presentation.ui.components.Labels
import ru.studpod.app.presentation.ui.components.LoadingState
import ru.studpod.app.presentation.ui.components.PointsBadge
import ru.studpod.app.presentation.ui.components.PointsChip
import ru.studpod.app.presentation.ui.components.StatusChip
import ru.studpod.app.presentation.ui.components.ErrorState
import ru.studpod.app.presentation.ui.components.taskStatusKind
import ru.studpod.app.presentation.ui.theme.PointsPurple
import ru.studpod.app.presentation.ui.theme.PointsPurpleContainer

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TaskDetailsScreen(
    onBack: () -> Unit,
    viewModel: TaskDetailsViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    var showApplyDialog by remember { mutableStateOf(false) }
    val context = LocalContext.current

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Задача") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Назад")
                    }
                },
            )
        },
        containerColor = MaterialTheme.colorScheme.background,
    ) { innerPadding ->
        when {
            state.isLoading -> LoadingState(Modifier.padding(innerPadding))
            state.error != null -> ErrorState(
                message = state.error!!,
                modifier = Modifier.padding(innerPadding),
                onRetry = { viewModel.load() },
            )
            state.task != null -> {
                val task = state.task!!
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp),
                ) {
                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.Top,
                            horizontalArrangement = Arrangement.SpaceBetween,
                        ) {
                            Text(
                                text = task.title,
                                style = MaterialTheme.typography.headlineSmall,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.weight(1f),
                            )
                            StatusChip(
                                text = Labels.taskStatus(task.status),
                                kind = taskStatusKind(task.status),
                                modifier = Modifier.padding(start = 8.dp),
                            )
                        }
                    }

                    item {
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            PointsChip(points = task.pointsReward)
                            TagsChip(text = Labels.taskType(task.taskType))
                            TagsChip(text = Labels.format(task.format))
                        }
                    }

                    item {
                        InfoBlock(title = "Заказчик", value = task.organizationName)
                    }
                    item {
                        InfoBlock(title = "Описание", value = task.description)
                    }
                    if (task.requirements.isNotBlank()) {
                        item { InfoBlock(title = "Требования", value = task.requirements) }
                    }
                    item {
                        Column {
                            DetailRow("Срок", Formatters.deadlineLabel(task.deadline))
                            DetailRow("Объём", Labels.workload(task.workload))
                            DetailRow("Срочность", Labels.urgency(task.urgency))
                            DetailRow("Направление", task.category)
                            if (task.location != null) {
                                DetailRow("Локация", task.location)
                            }
                        }
                    }

                    item {
                        PointsExplanation(task = task)
                    }

                    if (task.materialsLink.isNotBlank()) {
                        item {
                            OutlinedButton(
                                onClick = {
                                    context.startActivity(
                                        Intent(Intent.ACTION_VIEW, Uri.parse(task.materialsLink)),
                                    )
                                },
                                modifier = Modifier.fillMaxWidth(),
                            ) {
                                Icon(Icons.Default.Link, contentDescription = null)
                                Text("Материалы заказчика", modifier = Modifier.padding(start = 6.dp))
                            }
                        }
                    }

                    if (task.attachments.isNotEmpty()) {
                        item {
                            Column {
                                Text(
                                    text = "Вложения",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold,
                                )
                                task.attachments.forEach { attachment ->
                                    AttachmentRow(
                                        name = attachment.originalName,
                                        onClick = {
                                            context.startActivity(
                                                Intent(
                                                    Intent.ACTION_VIEW,
                                                    Uri.parse(
                                                        ru.studpod.app.core.network.ApiUrls.resolve(attachment.url),
                                                    ),
                                                ),
                                            )
                                        },
                                    )
                                }
                            }
                        }
                    }

                    state.actionMessage?.let { message ->
                        item {
                            Text(
                                text = message,
                                color = if (state.appliedResponse != null) {
                                    ru.studpod.app.presentation.ui.theme.SuccessGreen
                                } else {
                                    MaterialTheme.colorScheme.error
                                },
                                style = MaterialTheme.typography.bodyMedium,
                            )
                        }
                    }

                    item {
                        when {
                            state.appliedResponse != null -> {
                                Button(
                                    onClick = { /* уже откликнулись */ },
                                    enabled = false,
                                    modifier = Modifier.fillMaxWidth(),
                                ) {
                                    Icon(Icons.Default.CheckCircle, contentDescription = null)
                                    Text("Вы откликнулись", modifier = Modifier.padding(start = 6.dp))
                                }
                            }
                            task.isOpen -> {
                                Button(
                                    onClick = { showApplyDialog = true },
                                    enabled = !state.isApplying,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(52.dp),
                                ) {
                                    if (state.isApplying) {
                                        CircularProgressIndicator(
                                            modifier = Modifier.size(22.dp),
                                            color = MaterialTheme.colorScheme.onPrimary,
                                            strokeWidth = 2.dp,
                                        )
                                    } else {
                                        Text("Откликнуться", style = MaterialTheme.typography.titleMedium)
                                    }
                                }
                            }
                            else -> {
                                Text(
                                    text = "Задача уже занята или закрыта",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.fillMaxWidth(),
                                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    if (showApplyDialog) {
        ApplyTaskDialog(
            onConfirm = { coverLetter ->
                showApplyDialog = false
                viewModel.applyForTask(coverLetter)
            },
            onDismiss = { showApplyDialog = false },
        )
    }
}

@Composable
private fun TagsChip(text: String) {
    Text(
        text = text,
        style = MaterialTheme.typography.labelMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        modifier = Modifier.padding(top = 6.dp),
    )
}

@Composable
private fun InfoBlock(title: String, value: String) {
    Column {
        Text(
            text = title,
            style = MaterialTheme.typography.labelLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyLarge,
            modifier = Modifier.padding(top = 4.dp),
        )
    }
}

@Composable
private fun DetailRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.weight(1f),
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.weight(1f),
        )
    }
    HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f))
}

@Composable
private fun PointsExplanation(task: ru.studpod.app.domain.model.Task) {
    Card(
        colors = CardDefaults.cardColors(containerColor = PointsPurpleContainer.copy(alpha = 0.5f)),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Star,
                    contentDescription = null,
                    tint = PointsPurple,
                    modifier = Modifier.size(18.dp),
                )
                Text(
                    text = "Вознаграждение",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = PointsPurple,
                    modifier = Modifier.padding(start = 6.dp),
                )
                Spacer(Modifier.weight(1f))
                PointsBadge(points = task.pointsReward)
            }
            if (task.pointsExplanation.isNotEmpty()) {
                Text(
                    text = task.pointsExplanation.joinToString("\n"),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 8.dp),
                )
            }
        }
    }
}

@Composable
private fun AttachmentRow(name: String, onClick: () -> Unit) {
    OutlinedButton(onClick = onClick, modifier = Modifier.padding(top = 6.dp)) {
        Icon(Icons.Default.AttachFile, contentDescription = null)
        Text(name, maxLines = 1, modifier = Modifier.padding(start = 6.dp))
    }
}

@Composable
private fun ApplyTaskDialog(
    onConfirm: (String) -> Unit,
    onDismiss: () -> Unit,
) {
    var coverLetter by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Откликнуться на задачу") },
        text = {
            Column {
                Text(
                    text = "Расскажите, почему вам подходит эта задача (необязательно)",
                    style = MaterialTheme.typography.bodyMedium,
                )
                Spacer(Modifier.height(10.dp))
                OutlinedTextField(
                    value = coverLetter,
                    onValueChange = { coverLetter = it },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3,
                    maxLines = 5,
                )
            }
        },
        confirmButton = {
            TextButton(onClick = { onConfirm(coverLetter) }) {
                Text("Откликнуться")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Отмена")
            }
        },
    )
}
