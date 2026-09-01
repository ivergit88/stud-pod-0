package ru.studpod.app.presentation.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import ru.studpod.app.core.util.Formatters
import ru.studpod.app.domain.model.Task
import ru.studpod.app.presentation.ui.theme.PointsPurple
import ru.studpod.app.presentation.ui.theme.PointsPurpleContainer

/**
 * Карточка задачи: название, описание, заказчик, направление, тип задачи,
 * срок, статус, баллы. Клик по карточке — детали; у открытой задачи —
 * кнопка «Откликнуться».
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TaskCard(
    task: Task,
    onClick: () -> Unit,
    onApply: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface,
        ),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(
                    text = task.title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f),
                )
                Spacer(Modifier.width(8.dp))
                StatusChip(
                    text = Labels.taskStatus(task.status),
                    kind = taskStatusKind(task.status),
                )
            }

            Text(
                text = task.description,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.padding(top = 6.dp),
            )

            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.padding(top = 10.dp),
            ) {
                InfoTag(text = task.organizationName)
                InfoTag(text = Labels.taskType(task.taskType))
            }

            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(top = 10.dp),
            ) {
                Icon(
                    imageVector = Icons.Default.Schedule,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.width(16.dp).height(16.dp),
                )
                Text(
                    text = Formatters.deadlineLabel(task.deadline),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(start = 4.dp),
                )
                Spacer(Modifier.weight(1f))
                PointsBadge(points = task.pointsReward)
            }

            if (onApply != null && task.isOpen) {
                OutlinedButton(
                    onClick = onApply,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 12.dp),
                ) {
                    Icon(
                        imageVector = Icons.Default.ArrowForward,
                        contentDescription = null,
                        modifier = Modifier.width(16.dp).height(16.dp),
                    )
                    Text("Откликнуться", modifier = Modifier.padding(start = 6.dp))
                }
            }
        }
    }
}

@Composable
private fun InfoTag(text: String) {
    Text(
        text = text,
        style = MaterialTheme.typography.labelMedium,
        color = MaterialTheme.colorScheme.primary,
        maxLines = 1,
        overflow = TextOverflow.Ellipsis,
        modifier = Modifier.padding(top = 2.dp),
    )
}

@Composable
fun PointsBadge(points: Int, modifier: Modifier = Modifier) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = modifier,
    ) {
        Icon(
            imageVector = Icons.Default.Star,
            contentDescription = null,
            tint = PointsPurple,
            modifier = Modifier.width(16.dp).height(16.dp),
        )
        Text(
            text = Formatters.pointsLabel(points),
            style = MaterialTheme.typography.labelLarge,
            fontWeight = FontWeight.Bold,
            color = PointsPurple,
            modifier = Modifier.padding(start = 4.dp),
        )
    }
}

@Composable
fun PointsChip(points: Int, modifier: Modifier = Modifier) {
    androidx.compose.foundation.layout.Box(
        modifier = modifier
            .background(PointsPurpleContainer, RoundedCornerShape(50))
            .padding(horizontal = 10.dp, vertical = 4.dp),
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(
                imageVector = Icons.Default.Star,
                contentDescription = null,
                tint = PointsPurple,
                modifier = Modifier.width(14.dp).height(14.dp),
            )
            Text(
                text = "+${points}",
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.SemiBold,
                color = PointsPurple,
                modifier = Modifier.padding(start = 4.dp),
            )
        }
    }
}
