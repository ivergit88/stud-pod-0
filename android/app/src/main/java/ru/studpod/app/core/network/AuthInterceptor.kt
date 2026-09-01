package ru.studpod.app.core.network

import okhttp3.Interceptor
import okhttp3.Response
import ru.studpod.app.core.security.SessionManager
import javax.inject.Inject

/**
 * Добавляет JWT-токен в заголовок Authorization: Bearer <token>
 * ко всем запросам, кроме эндпоинтов auth (туда токен не нужен).
 */
class AuthInterceptor @Inject constructor(
    private val sessionManager: SessionManager,
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val original = chain.request()
        val token = sessionManager.token

        val request = if (!token.isNullOrBlank() && !original.url.encodedPath.endsWith("/auth/login") &&
            !original.url.encodedPath.endsWith("/auth/register")
        ) {
            original.newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
        } else {
            original
        }

        return chain.proceed(request)
    }
}
