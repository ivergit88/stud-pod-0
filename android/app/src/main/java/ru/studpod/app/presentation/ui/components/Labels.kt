package ru.studpod.app.presentation.ui.components

/**
 * Русские подписи справочников — зеркалируют подписи портала
 * (src/lib/task-scoring.ts): типы задач, объём, срочность, форматы, статусы.
 */
object Labels {

    fun taskStatus(value: String): String = when (value) {
        "open" -> "Открыта"
        "in_progress" -> "В работе"
        "review" -> "На проверке"
        "completed" -> "Выполнена"
        "cancelled" -> "Отменена"
        else -> value
    }

    fun responseStatus(value: String): String = when (value) {
        "pending" -> "Ожидает"
        "accepted" -> "Принята"
        "rejected" -> "Отклонена"
        "submitted" -> "На проверке"
        "completed" -> "Выполнена"
        "needs_revision" -> "На доработке"
        else -> value
    }

    fun taskType(value: String): String = when (value) {
        "content" -> "Контент"
        "design" -> "Дизайн"
        "website" -> "Сайт"
        "bot" -> "Бот"
        "digitization" -> "Оцифровка"
        "3d" -> "3D"
        "setup" -> "Настройка"
        "analytics" -> "Аналитика"
        else -> "Другое"
    }

    fun workload(value: String): String = when (value) {
        "one_day" -> "1 день"
        "two_to_three_days" -> "2-3 дня"
        "more_than_three_days" -> "Более 3 дней"
        else -> "До 3 часов"
    }

    fun urgency(value: String): String = when (value) {
        "urgent" -> "Срочная"
        else -> "Обычная"
    }

    fun format(value: String): String = when (value) {
        "online" -> "Онлайн"
        "hybrid" -> "Гибрид"
        "offline" -> "Очно"
        else -> value
    }
}
