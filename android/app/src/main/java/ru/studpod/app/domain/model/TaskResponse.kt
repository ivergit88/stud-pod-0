package ru.studpod.app.domain.model

/**
 * Отклик студента на задачу.
 * Статусы: pending / accepted / rejected / submitted / completed / needs_revision.
 */
data class TaskResponse(
    val id: String,
    val taskId: String,
    val studentId: String,
    val studentName: String,
    val status: String,
    val coverLetter: String,
    val submissionLink: String,
    val reviewComment: String,
    val createdAt: String,
    val updatedAt: String,
    val teamMembers: List<TeamMember>,
) {
    val isLeader: Boolean get() = teamMembers.firstOrNull()?.role == "leader"
}

data class TeamMember(
    val id: String,
    val studentId: String,
    val studentName: String,
    val role: String,
    val university: String?,
    val course: Int?,
    val skills: List<String>,
)

/** Пара «задача + мой отклик» из GET /api/my/tasks и /api/my/portfolio. */
data class MyTaskItem(
    val task: Task,
    val response: TaskResponse,
)
