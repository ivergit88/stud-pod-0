package ru.studpod.app.presentation.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColors = lightColorScheme(
    primary = PortalBlue,
    onPrimary = PortalOnBlue,
    primaryContainer = PortalBlueContainer,
    onPrimaryContainer = PortalSlate,
    secondary = PortalBlueDark,
    onSecondary = PortalOnBlue,
    secondaryContainer = PortalBlueContainer,
    onSecondaryContainer = PortalSlate,
    background = PortalBg,
    onBackground = PortalSlate,
    surface = PortalSurface,
    onSurface = PortalSlate,
    surfaceVariant = PortalBg,
    onSurfaceVariant = PortalSlateMuted,
    outline = PortalSlateMuted,
    error = ErrorRed,
    errorContainer = ErrorRedContainer,
)

private val DarkColors = darkColorScheme(
    primary = PortalBlue,
    onPrimary = PortalOnBlue,
    primaryContainer = PortalBlueDark,
    onPrimaryContainer = Color(0xFFDBEAFE),
    background = Color(0xFF0F172A),
    onBackground = Color(0xFFF1F5F9),
    surface = Color(0xFF1E293B),
    onSurface = Color(0xFFF1F5F9),
    surfaceVariant = Color(0xFF1E293B),
    onSurfaceVariant = Color(0xFF94A3B8),
    outline = Color(0xFF64748B),
    error = Color(0xFFF87171),
    errorContainer = Color(0xFF7F1D1D),
)

/** Тема приложения в фирменных цветах портала. */
@Composable
fun StudPodTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        typography = androidx.compose.material3.Typography(),
        content = content,
    )
}
