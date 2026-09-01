package ru.studpod.app.presentation.auth

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import ru.studpod.app.presentation.navigation.Routes

/** Экранный поток авторизации: вход → выбор роли → регистрация студента. */
@Composable
fun AuthNavHost() {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = Routes.LOGIN,
    ) {
        composable(Routes.LOGIN) {
            LoginScreen(
                onRegisterClick = { navController.navigate(Routes.REGISTER_CHOICE) },
            )
        }
        composable(Routes.REGISTER_CHOICE) {
            RegisterChoiceScreen(
                onBack = { navController.popBackStack() },
                onStudentClick = { navController.navigate(Routes.REGISTER_STUDENT) },
            )
        }
        composable(Routes.REGISTER_STUDENT) {
            RegisterStudentScreen(
                onBack = { navController.popBackStack() },
            )
        }
    }
}
