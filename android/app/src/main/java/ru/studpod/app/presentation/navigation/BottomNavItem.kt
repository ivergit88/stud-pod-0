package ru.studpod.app.presentation.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.ui.graphics.vector.ImageVector

/** Пункты нижней навигации (5 разделов по ТЗ). */
enum class BottomNavItem(
    val route: String,
    val label: String,
    val icon: ImageVector,
) {
    HOME(Routes.HOME, "Главная", Icons.Default.Home),
    TASKS(Routes.TASK_CATALOG, "Задачи", Icons.Default.Search),
    MY_TASKS(Routes.MY_TASKS, "Мои проекты", Icons.Default.List),
    NOTIFICATIONS(Routes.NOTIFICATIONS, "Уведомления", Icons.Default.Notifications),
    PROFILE(Routes.PROFILE, "Профиль", Icons.Default.Person),
}
