package ru.studpod.app.domain.model

/** Пользователь портала (роли: student / organization / admin). */
data class User(
    val id: String,
    val email: String,
    val role: String,
    val firstName: String,
    val lastName: String,
    val middleName: String?,
    val name: String,
    val points: Int,
    val university: String?,
    val course: Int?,
    val description: String?,
    val skills: List<String>,
    val phone: String?,
    val status: String?,
) {
    val isStudent: Boolean get() = role == "student"
    val initials: String
        get() = listOf(firstName, lastName)
            .filter { it.isNotBlank() }
            .map { it.first().uppercaseChar() }
            .joinToString("")
            .ifBlank { "СП" }
}
