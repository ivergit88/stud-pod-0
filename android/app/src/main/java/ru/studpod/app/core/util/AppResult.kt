package ru.studpod.app.core.util

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import retrofit2.HttpException
import java.io.IOException

/**
 * Единый результат сетевых операций. Все состояния UI (loading / error /
 * empty / success) строятся на нём, чтобы не тащить исключения во ViewModel.
 */
sealed interface AppResult<out T> {
    data class Success<T>(val data: T) : AppResult<T>
    data class Error(val message: String, val code: Int? = null) : AppResult<Nothing>
}

/**
 * Обёртка над suspend-вызовом: IOException -> «нет соединения»,
 * HttpException -> текст ошибки от сервера (поле error в JSON),
 * прочее -> общее сообщение.
 */
suspend fun <T> safeApiCall(block: suspend () -> T): AppResult<T> {
    return try {
        AppResult.Success(block())
    } catch (e: HttpException) {
        val body = e.response()?.errorBody()?.string().orEmpty()
        val serverMessage = parseServerError(body)
        AppResult.Error(
            message = serverMessage ?: "Сервер ответил с ошибкой (${e.code()})",
            code = e.code(),
        )
    } catch (e: IOException) {
        AppResult.Error("Нет соединения с сервером. Проверьте интернет.")
    } catch (e: Exception) {
        AppResult.Error("Что-то пошло не так. Попробуйте ещё раз.")
    }
}

private fun parseServerError(body: String): String? {
    if (body.isBlank()) return null
    return runCatching {
        Json { ignoreUnknownKeys = true }
            .parseToJsonElement(body)
            .jsonObject["error"]?.jsonPrimitive?.contentOrNull
    }.getOrNull()?.takeIf { it.isNotBlank() }
}
