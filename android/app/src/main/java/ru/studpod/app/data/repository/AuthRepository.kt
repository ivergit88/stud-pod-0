package ru.studpod.app.data.repository

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import ru.studpod.app.core.analytics.Analytics
import ru.studpod.app.core.network.ApiService
import ru.studpod.app.core.network.LoginRequest
import ru.studpod.app.core.network.RegisterRequest
import ru.studpod.app.core.network.StudentRegistrationData
import ru.studpod.app.core.security.SessionManager
import ru.studpod.app.core.util.AppResult
import ru.studpod.app.core.util.safeApiCall
import ru.studpod.app.domain.model.User
import javax.inject.Inject
import javax.inject.Singleton

data class SessionState(val user: User? = null) {
    val isLoggedIn: Boolean get() = user != null
}

/** Авторизация: вход, регистрация студента, восстановление и выход из сессии. */
interface AuthRepository {
    val session: StateFlow<SessionState>
    suspend fun login(email: String, password: String): AppResult<User>
    suspend fun registerStudent(data: StudentRegistrationData, password: String): AppResult<User>
    suspend fun restoreSession(): AppResult<User?>
    suspend fun logout(): AppResult<Unit>
}

@Singleton
class AuthRepositoryImpl @Inject constructor(
    private val api: ApiService,
    private val sessionManager: SessionManager,
) : AuthRepository {

    private val _session = MutableStateFlow(SessionState(sessionManager.user?.toDomain()))
    override val session: StateFlow<SessionState> = _session.asStateFlow()

    override suspend fun login(email: String, password: String): AppResult<User> {
        val result = safeApiCall {
            api.login(LoginRequest(email = email.trim(), password = password))
        }
        return when (result) {
            is AppResult.Success -> {
                sessionManager.saveSession(result.data.token, result.data.user)
                _session.value = SessionState(result.data.user.toDomain())
                Analytics.logEvent(Analytics.EVENT_AUTH_LOGIN)
                AppResult.Success(result.data.user.toDomain())
            }
            is AppResult.Error -> result
        }
    }

    override suspend fun registerStudent(
        data: StudentRegistrationData,
        password: String,
    ): AppResult<User> {
        val result = safeApiCall {
            api.register(RegisterRequest(additionalData = data, password = password))
        }
        return when (result) {
            is AppResult.Success -> {
                sessionManager.saveSession(result.data.token, result.data.user)
                _session.value = SessionState(result.data.user.toDomain())
                Analytics.logEvent(Analytics.EVENT_AUTH_REGISTER)
                AppResult.Success(result.data.user.toDomain())
            }
            is AppResult.Error -> result
        }
    }

    override suspend fun restoreSession(): AppResult<User?> {
        if (!sessionManager.hasSession()) {
            _session.value = SessionState()
            return AppResult.Success(null)
        }
        val result = safeApiCall { api.me() }
        return when (result) {
            is AppResult.Success -> {
                val user = result.data.user?.toDomain()
                if (user == null) {
                    // Токен невалиден — чистим сессию
                    sessionManager.clear()
                    _session.value = SessionState()
                } else {
                    sessionManager.saveUser(result.data.user)
                    _session.value = SessionState(user)
                }
                AppResult.Success(user)
            }
            is AppResult.Error -> {
                if (result.code == 401) {
                    sessionManager.clear()
                    _session.value = SessionState()
                }
                result
            }
        }
    }

    override suspend fun logout(): AppResult<Unit> {
        runCatching { api.logout() }
        sessionManager.clear()
        _session.value = SessionState()
        return AppResult.Success(Unit)
    }
}
