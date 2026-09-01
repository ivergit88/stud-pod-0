package ru.studpod.app.core.network

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

/**
 * Контракт мобильного API. Все методы — поверх существующего backend
 * (документация: docs/api-mobile.md). Базовый URL заканчивается на /api.
 */
interface ApiService {

    // ---- Auth ----
    @POST("auth/login")
    suspend fun login(@Body body: LoginRequest): AuthResponseDto

    @POST("auth/register")
    suspend fun register(@Body body: RegisterRequest): AuthResponseDto

    @POST("auth/logout")
    suspend fun logout(): OkResponseDto

    // ---- Профиль ----
    @GET("me")
    suspend fun me(): MeResponseDto

    // ---- Каталог задач ----
    @GET("tasks")
    suspend fun tasks(
        @Query("page") page: Int,
        @Query("limit") limit: Int = 20,
        @Query("status") status: String? = null,
        @Query("category") category: String? = null,
        @Query("format") format: String? = null,
        @Query("query") query: String? = null,
    ): TaskListResponseDto

    @GET("tasks/{taskId}")
    suspend fun task(@Path("taskId") taskId: String): TaskDetailResponseDto

    // ---- Мои задачи и портфолио ----
    @GET("my/tasks")
    suspend fun myTasks(): MyTasksResponseDto

    @GET("my/portfolio")
    suspend fun myPortfolio(): MyTasksResponseDto

    // ---- Уведомления ----
    @GET("notifications")
    suspend fun notifications(@Query("limit") limit: Int = 50): NotificationsResponseDto

    @POST("notifications/{notificationId}/read")
    suspend fun markNotificationRead(@Path("notificationId") notificationId: String): OkResponseDto

    @POST("notifications/read-all")
    suspend fun markAllNotificationsRead(): OkResponseDto

    // ---- Действия студента ----
    @POST("tasks/{taskId}/take")
    suspend fun takeTask(
        @Path("taskId") taskId: String,
        @Body body: TakeTaskRequest,
    ): TaskActionResponseDto

    @POST("task-responses/{responseId}/submit")
    suspend fun submitResult(
        @Path("responseId") responseId: String,
        @Body body: SubmitResultRequest,
    ): TaskActionResponseDto
}
