package ru.studpod.app.presentation.main

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import kotlinx.coroutines.flow.StateFlow
import ru.studpod.app.presentation.home.HomeScreen
import ru.studpod.app.presentation.mytasks.MyTasksScreen
import ru.studpod.app.presentation.navigation.BottomNavItem
import ru.studpod.app.presentation.navigation.Routes
import ru.studpod.app.presentation.notifications.NotificationsScreen
import ru.studpod.app.presentation.portfolio.PortfolioScreen
import ru.studpod.app.presentation.profile.ProfileScreen
import ru.studpod.app.presentation.tasks.TaskCatalogScreen
import ru.studpod.app.presentation.tasks.TaskDetailsScreen

/**
 * Основной каркас приложения: Bottom Navigation (5 разделов) + NavHost.
 * На экране деталей задачи нижняя навигация скрывается.
 */
@Composable
fun MainScaffold(unreadCount: StateFlow<Int>) {
    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = backStackEntry?.destination
    val unread by unreadCount.collectAsStateWithLifecycle(initialValue = 0)

    val showBottomBar = currentDestination?.hierarchy
        ?.any { it.route in BottomNavItem.entries.map { item -> item.route } } == true

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                NavigationBar {
                    BottomNavItem.entries.forEach { item ->
                        val selected = currentDestination?.hierarchy
                            ?.any { it.route == item.route } == true
                        NavigationBarItem(
                            selected = selected,
                            onClick = {
                                navController.navigate(item.route) {
                                    popUpTo(navController.graph.findStartDestination().id) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = {
                                if (item == BottomNavItem.NOTIFICATIONS && unread > 0) {
                                    BadgedBox(badge = { Badge { Text("$unread") } }) {
                                        Icon(item.icon, contentDescription = item.label)
                                    }
                                } else {
                                    Icon(item.icon, contentDescription = item.label)
                                }
                            },
                            label = { Text(item.label) },
                        )
                    }
                }
            }
        },
        containerColor = MaterialTheme.colorScheme.background,
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Routes.HOME,
            modifier = Modifier.padding(innerPadding),
        ) {
            composable(Routes.HOME) {
                HomeScreen(
                    onTaskClick = { taskId -> navController.navigate(Routes.taskDetails(taskId)) },
                    onOpenCatalog = { navController.navigate(Routes.TASK_CATALOG) },
                    onOpenMyTasks = { navController.navigate(Routes.MY_TASKS) },
                )
            }
            composable(Routes.TASK_CATALOG) {
                TaskCatalogScreen(
                    onTaskClick = { taskId -> navController.navigate(Routes.taskDetails(taskId)) },
                )
            }
            composable(Routes.MY_TASKS) {
                MyTasksScreen(
                    onTaskClick = { taskId -> navController.navigate(Routes.taskDetails(taskId)) },
                )
            }
            composable(Routes.NOTIFICATIONS) {
                NotificationsScreen()
            }
            composable(Routes.PROFILE) {
                ProfileScreen()
            }
            composable(Routes.TASK_DETAILS) {
                TaskDetailsScreen(
                    onBack = { navController.popBackStack() },
                )
            }
        }
    }
}
