package ru.studpod.app.data.repository

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import ru.studpod.app.core.network.ApiService
import ru.studpod.app.core.network.SubmitResultRequest
import ru.studpod.app.core.network.TakeTaskRequest
import ru.studpod.app.core.network.TaskDto
import ru.studpod.app.core.network.TaskListResponseDto
import ru.studpod.app.core.util.AppResult
import ru.studpod.app.core.util.safeApiCall
import ru.studpod.app.data.local.TaskCacheDao
import ru.studpod.app.data.local.TaskCacheEntity
import ru.studpod.app.domain.model.MyTaskItem
import ru.studpod.app.domain.model.Task
import ru.studpod.app.domain.model.TaskResponse
import javax.inject.Inject

/** Фильтры каталога задач (серверная пагинация + фильтрация). */
data class TaskFilters(
    val status: String? = null,
    val category: String? = null,
    val format: String? = null,
    val query: String? = null,
)

/** Одна страница каталога. */
data class TaskListPage(
    val tasks: List<Task>,
    val total: Int,
    val page: Int,
    val hasMore: Boolean,
)

/** Задачи: каталог, карточка, мои задачи, портфолио, действия студента. */
interface TaskRepository {
    suspend fun getTasks(page: Int, filters: TaskFilters): AppResult<TaskListPage>
    suspend fun getTask(taskId: String): AppResult<Task>
    suspend fun getMyTasks(): AppResult<List<MyTaskItem>>
    suspend fun getPortfolio(): AppResult<List<MyTaskItem>>
    suspend fun takeTask(taskId: String, coverLetter: String): AppResult<TaskResponse>
    suspend fun submitResult(responseId: String, link: String): AppResult<TaskResponse>
    suspend fun getCachedTasks(): List<Task>
}

class TaskRepositoryImpl @Inject constructor(
    private val api: ApiService,
    private val cacheDao: TaskCacheDao,
    private val json: Json,
) : TaskRepository {

    override suspend fun getTasks(page: Int, filters: TaskFilters): AppResult<TaskListPage> {
        val result = safeApiCall {
            api.tasks(
                page = page,
                limit = PAGE_SIZE,
                status = filters.status,
                category = filters.category,
                format = filters.format,
                query = filters.query?.takeIf { it.isNotBlank() },
            )
        }
        return when (result) {
            is AppResult.Success -> {
                if (page == 1) {
                    writeCache(result.data)
                }
                AppResult.Success(
                    TaskListPage(
                        tasks = result.data.tasks.map { it.toDomain() },
                        total = result.data.total,
                        page = result.data.page,
                        hasMore = result.data.hasMore,
                    ),
                )
            }
            is AppResult.Error -> result
        }
    }

    override suspend fun getTask(taskId: String): AppResult<Task> {
        return when (val result = safeApiCall { api.task(taskId) }) {
            is AppResult.Success -> AppResult.Success(result.data.task.toDomain())
            is AppResult.Error -> result
        }
    }

    override suspend fun getMyTasks(): AppResult<List<MyTaskItem>> {
        return when (val result = safeApiCall { api.myTasks() }) {
            is AppResult.Success -> AppResult.Success(result.data.items.map { it.toDomain() })
            is AppResult.Error -> result
        }
    }

    override suspend fun getPortfolio(): AppResult<List<MyTaskItem>> {
        return when (val result = safeApiCall { api.myPortfolio() }) {
            is AppResult.Success -> AppResult.Success(result.data.items.map { it.toDomain() })
            is AppResult.Error -> result
        }
    }

    override suspend fun takeTask(taskId: String, coverLetter: String): AppResult<TaskResponse> {
        return when (val result = safeApiCall { api.takeTask(taskId, TakeTaskRequest(coverLetter)) }) {
            is AppResult.Success -> AppResult.Success(result.data.response.toDomain())
            is AppResult.Error -> result
        }
    }

    override suspend fun submitResult(responseId: String, link: String): AppResult<TaskResponse> {
        return when (val result = safeApiCall { api.submitResult(responseId, SubmitResultRequest(link)) }) {
            is AppResult.Success -> AppResult.Success(result.data.response.toDomain())
            is AppResult.Error -> result
        }
    }

    override suspend fun getCachedTasks(): List<Task> = withContext(Dispatchers.IO) {
        cacheDao.getRecent(50).mapNotNull { entity ->
            runCatching { json.decodeFromString(TaskDto.serializer(), entity.json).toDomain() }.getOrNull()
        }
    }

    private suspend fun writeCache(page: TaskListResponseDto) {
        withContext(Dispatchers.IO) {
            val now = System.currentTimeMillis()
            cacheDao.upsertAll(
                page.tasks.map { task ->
                    TaskCacheEntity(
                        id = task.id,
                        title = task.title,
                        category = task.category,
                        status = task.status,
                        json = json.encodeToString(TaskDto.serializer(), task),
                        cachedAt = now,
                    )
                },
            )
            cacheDao.prune(MAX_CACHE_SIZE)
        }
    }

    companion object {
        const val PAGE_SIZE = 20
        const val MAX_CACHE_SIZE = 200
    }
}
