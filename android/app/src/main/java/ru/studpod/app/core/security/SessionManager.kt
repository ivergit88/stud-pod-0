package ru.studpod.app.core.security

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import ru.studpod.app.core.network.UserDto
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Хранилище сессии. JWT-токен и профиль пользователя лежат в
 * EncryptedSharedPreferences (шифрование на ключах Android Keystore) —
 * в обычных SharedPreferences секреты не хранятся.
 */
@Singleton
class SessionManager @Inject constructor(
    @ApplicationContext context: Context,
) {
    private val json = Json { ignoreUnknownKeys = true }

    private val prefs: SharedPreferences = EncryptedSharedPreferences.create(
        context,
        PREF_FILE_NAME,
        MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build(),
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
    )

    val token: String?
        get() = prefs.getString(KEY_TOKEN, null)

    val user: UserDto?
        get() = prefs.getString(KEY_USER, null)?.let { raw ->
            runCatching { json.decodeFromString<UserDto>(raw) }.getOrNull()
        }

    fun hasSession(): Boolean = !token.isNullOrBlank()

    fun saveSession(token: String, user: UserDto) {
        prefs.edit()
            .putString(KEY_TOKEN, token)
            .putString(KEY_USER, json.encodeToString(UserDto.serializer(), user))
            .apply()
    }

    fun saveUser(user: UserDto) {
        prefs.edit()
            .putString(KEY_USER, json.encodeToString(UserDto.serializer(), user))
            .apply()
    }

    fun clear() {
        prefs.edit().clear().apply()
    }

    private companion object {
        const val PREF_FILE_NAME = "stud_pod_secure_session"
        const val KEY_TOKEN = "jwt_token"
        const val KEY_USER = "user_profile"
    }
}
