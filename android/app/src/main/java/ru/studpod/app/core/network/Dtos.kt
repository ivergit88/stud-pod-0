package ru.studpod.app.core.network

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * DTO — точная проекция JSON-ответов существующего backend (server.ts).
 * Поля повторяют форматы mapUser / mapTask / mapTaskResponse / mapNotification.
 * Неизвестные поля игнорируются (Json { ignoreUnknownKeys = true }).
 */

@Serializable
data class UserDto(
    val id: String,
    val uid: String,
    val email: String,
    val role: String,
    val firstName: String = "",
    val lastName: String = "",
    val middleName: String? = null,
    val name: String,
    val points: Int = 0,
    val university: String? = null,
    val course: Int? = null,
    val description: String? = null,
    val skills: List<String> = emptyList(),
    val createdAt: String = "",
    val inn: String? = null,
    val address: String? = null,
    val contactPerson: String? = null,
    val phone: String? = null,
    val status: String? = null,
)

@Serializable
data class TaskAttachmentDto(
    val id: String,
    val originalName: String,
    val fileName: String,
    val mimeType: String,
    val size: Long,
    val uploadedAt: String,
    val url: String,
)

@Serializable
data class TaskDto(
    val id: String,
    val slug: String,
    val title: String,
    val description: String,
    val requirements: String = "",
    val organizationId: String,
    val organizationName: String,
    val organizationAddress: String? = null,
    val category: String,
    val format: String,
    val workload: String,
    val taskType: String,
    val urgency: String,
    val requiresOrgMaterials: Boolean = false,
    val requiresOnsiteCheck: Boolean = false,
    val pointsReward: Int = 0,
    val pointsMin: Int = 0,
    val pointsRecommended: Int = 0,
    val pointsMax: Int = 0,
    val pointsExplanation: List<String> = emptyList(),
    val taskKind: String = "single",
    val parentTaskId: String? = null,
    val parentTaskTitle: String? = null,
    val parentTaskSlug: String? = null,
    val childOrder: Int = 0,
    val subtaskCount: Int = 0,
    val completedSubtaskCount: Int = 0,
    val siblingCount: Int = 0,
    val deadline: String,
    val status: String,
    val createdAt: String = "",
    val executorId: String? = null,
    val location: String? = null,
    val coordinates: List<Double>? = null,
    val attachments: List<TaskAttachmentDto> = emptyList(),
    val materialsLink: String = "",
)

@Serializable
data class TeamMemberDto(
    val id: String,
    val responseId: String,
    val taskId: String,
    val studentId: String,
    val studentName: String,
    val role: String,
    val university: String? = null,
    val course: Int? = null,
    val description: String? = null,
    val skills: List<String> = emptyList(),
    val createdAt: String = "",
)

@Serializable
data class TaskResponseDto(
    val id: String,
    val taskId: String,
    val studentId: String,
    val studentName: String,
    val status: String,
    val coverLetter: String = "",
    val submissionLink: String = "",
    val reviewComment: String = "",
    val createdAt: String = "",
    val updatedAt: String = "",
    val teamMembers: List<TeamMemberDto> = emptyList(),
)

@Serializable
data class AppNotificationDto(
    val id: String,
    val userId: String,
    val title: String,
    val message: String,
    val read: Boolean = false,
    val createdAt: String = "",
    val link: String? = null,
    val type: String? = null,
)

// ---- Ответы API ----

@Serializable
data class AuthResponseDto(
    val user: UserDto,
    val token: String,
)

@Serializable
data class MeResponseDto(
    val user: UserDto? = null,
)

@Serializable
data class TaskListResponseDto(
    val tasks: List<TaskDto>,
    val total: Int = 0,
    val page: Int = 1,
    val limit: Int = 20,
    val hasMore: Boolean = false,
)

@Serializable
data class TaskDetailResponseDto(
    val task: TaskDto,
)

@Serializable
data class MyTaskItemDto(
    @SerialName("task") val task: TaskDto,
    @SerialName("response") val response: TaskResponseDto,
)

@Serializable
data class MyTasksResponseDto(
    val items: List<MyTaskItemDto> = emptyList(),
)

@Serializable
data class NotificationsResponseDto(
    val items: List<AppNotificationDto> = emptyList(),
    val unreadCount: Int = 0,
)

@Serializable
data class OkResponseDto(
    val ok: Boolean = true,
)

@Serializable
data class TaskActionResponseDto(
    val response: TaskResponseDto,
)

// ---- Тела запросов ----

@Serializable
data class LoginRequest(
    val email: String,
    val password: String,
)

@Serializable
data class StudentRegistrationData(
    val email: String,
    val firstName: String,
    val lastName: String,
    val middleName: String? = null,
    val university: String,
    val course: Int,
    val skills: List<String> = emptyList(),
    val description: String? = null,
)

@Serializable
data class RegisterRequest(
    val role: String = "student",
    @SerialName("additionalData") val additionalData: StudentRegistrationData,
    val password: String,
)

@Serializable
data class TakeTaskRequest(
    val coverLetter: String = "",
)

@Serializable
data class SubmitResultRequest(
    val submissionLink: String,
)
