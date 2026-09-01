package ru.studpod.app.domain.model

/** Уведомление портала (таблица notifications: title, message, read, type, link). */
data class AppNotification(
    val id: String,
    val title: String,
    val message: String,
    val read: Boolean,
    val createdAt: String,
    val link: String?,
    val type: String?,
)
