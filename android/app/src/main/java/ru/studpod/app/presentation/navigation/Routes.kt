package ru.studpod.app.presentation.navigation

/** Маршруты навигации приложения. */
object Routes {
    // Auth
    const val LOGIN = "login"
    const val REGISTER_CHOICE = "register_choice"
    const val REGISTER_STUDENT = "register_student"

    // Основные экраны (Bottom Navigation)
    const val HOME = "home"
    const val TASK_CATALOG = "tasks"
    const val MY_TASKS = "my_tasks"
    const val NOTIFICATIONS = "notifications"
    const val PROFILE = "profile"

    // Детали
    const val TASK_DETAILS = "task_details/{taskId}"
    fun taskDetails(taskId: String) = "task_details/$taskId"

    // Портфолио (мои кейсы)
    const val PORTFOLIO = "portfolio"
}
