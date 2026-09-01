package ru.studpod.app.presentation.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import ru.studpod.app.presentation.ui.theme.ErrorRed
import ru.studpod.app.presentation.ui.theme.ErrorRedContainer
import ru.studpod.app.presentation.ui.theme.InfoBlue
import ru.studpod.app.presentation.ui.theme.InfoBlueContainer
import ru.studpod.app.presentation.ui.theme.PortalSlateMuted
import ru.studpod.app.presentation.ui.theme.PortalBg
import ru.studpod.app.presentation.ui.theme.SuccessGreen
import ru.studpod.app.presentation.ui.theme.SuccessGreenContainer
import ru.studpod.app.presentation.ui.theme.WarningAmber
import ru.studpod.app.presentation.ui.theme.WarningAmberContainer

/** Цветной чип статуса (задачи / отклика / уведомления). */
@Composable
fun StatusChip(
    text: String,
    modifier: Modifier = Modifier,
    kind: StatusKind = StatusKind.NEUTRAL,
) {
    val (background, content) = when (kind) {
        StatusKind.SUCCESS -> SuccessGreenContainer to SuccessGreen
        StatusKind.WARNING -> WarningAmberContainer to WarningAmber
        StatusKind.ERROR -> ErrorRedContainer to ErrorRed
        StatusKind.INFO -> InfoBlueContainer to InfoBlue
        StatusKind.NEUTRAL -> PortalBg to PortalSlateMuted
    }

    androidx.compose.foundation.layout.Box(
        modifier = modifier
            .background(background, RoundedCornerShape(50))
            .padding(horizontal = 10.dp, vertical = 4.dp),
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.SemiBold,
            color = content,
        )
    }
}

enum class StatusKind { SUCCESS, WARNING, ERROR, INFO, NEUTRAL }

/** Статус задачи → цвет чипа. */
fun taskStatusKind(status: String): StatusKind = when (status) {
    "open" -> StatusKind.INFO
    "in_progress" -> StatusKind.WARNING
    "review" -> StatusKind.WARNING
    "completed" -> StatusKind.SUCCESS
    "cancelled" -> StatusKind.NEUTRAL
    else -> StatusKind.NEUTRAL
}

/** Статус отклика студента → цвет чипа. */
fun responseStatusKind(status: String): StatusKind = when (status) {
    "completed" -> StatusKind.SUCCESS
    "needs_revision" -> StatusKind.ERROR
    "submitted" -> StatusKind.WARNING
    "accepted" -> StatusKind.INFO
    "pending" -> StatusKind.NEUTRAL
    "rejected" -> StatusKind.ERROR
    else -> StatusKind.NEUTRAL
}
