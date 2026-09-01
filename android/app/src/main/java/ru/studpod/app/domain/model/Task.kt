package ru.studpod.app.domain.model

/**
 * Задача портала. taskKind: single / parent (обзорный проект) / subtask.
 * Статусы: open → in_progress → review → completed / cancelled.
 */
data class Task(
    val id: String,
    val slug: String,
    val title: String,
    val description: String,
    val requirements: String,
    val organizationId: String,
    val organizationName: String,
    val category: String,
    val format: String,
    val workload: String,
    val taskType: String,
    val urgency: String,
    val pointsReward: Int,
    val pointsMin: Int,
    val pointsRecommended: Int,
    val pointsMax: Int,
    val deadline: String,
    val status: String,
    val createdAt: String,
    val taskKind: String,
    val location: String?,
    val materialsLink: String,
    val attachments: List<TaskAttachment>,
    val parentTaskTitle: String?,
) {
    val isOpen: Boolean get() = status == "open"
}

data class TaskAttachment(
    val id: String,
    val originalName: String,
    val url: String,
    val size: Long,
)
