package ru.studpod.app.core.util

import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.OffsetDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

/**
 * Форматирование дат из API. Сервер отдаёт либо ISO-моменты
 * (createdAt / updatedAt), либо строки вида "2026-10-01" (deadline).
 */
object Formatters {

    private val ruLocale = Locale("ru")

    private val dayMonthYear: DateTimeFormatter =
        DateTimeFormatter.ofPattern("d MMM yyyy", ruLocale)

    private val dayMonth: DateTimeFormatter =
        DateTimeFormatter.ofPattern("d MMM", ruLocale)

    /** "до 12 окт 2026" */
    fun deadlineLabel(value: String): String {
        val date = parseDateOnly(value) ?: parseInstant(value)?.toLocalDate() ?: return value
        return "до ${date.format(dayMonthYear)}"
    }

    /** Короткая дата для списков. */
    fun shortDate(value: String): String {
        val date = parseInstant(value) ?: parseDateOnly(value) ?: return value
        return date.format(dayMonthYear)
    }

    /** Относительная дата для уведомлений: "сегодня" / "вчера" / "3 дня назад" / дата. */
    fun relativeDate(value: String): String {
        val date = parseInstant(value) ?: parseDateOnly(value) ?: return value
        val today = LocalDate.now()
        val days = java.time.temporal.ChronoUnit.DAYS.between(date, today)
        return when {
            days <= 0 -> "сегодня"
            days == 1L -> "вчера"
            days < 7 -> "$days дн. назад"
            else -> date.format(dayMonthYear)
        }
    }

    /** "50 баллов" */
    fun pointsLabel(points: Int): String = plural(points, "балл", "балла", "баллов")

    /** Русские множественные числа: plural(3, "балл", "балла", "баллов"). */
    fun plural(count: Int, one: String, few: String, many: String): String {
        val n = Math.abs(count) % 100
        val n1 = n % 10
        return when {
            n in 11..19 -> "$count $many"
            n1 == 1 -> "$count $one"
            n1 in 2..4 -> "$count $few"
            else -> "$count $many"
        }
    }

    private fun parseDateOnly(value: String): LocalDate? {
        return runCatching {
            when {
                value.length == 10 -> LocalDate.parse(value)
                else -> null
            }
        }.getOrNull()
    }

    private fun parseInstant(value: String): LocalDate? {
        val instant = runCatching {
            when {
                value.endsWith("Z") -> Instant.parse(value)
                else -> OffsetDateTime.parse(value).toInstant()
            }
        }.getOrNull() ?: runCatching {
            LocalDateTime.parse(value, DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                .atZone(ZoneId.systemDefault())
                .toInstant()
        }.getOrNull()

        return instant?.atZone(ZoneId.systemDefault())?.toLocalDate()
    }
}
