package ru.studpod.app.core.util

object Validators {

    private val emailRegex = Regex("^\\S+@\\S+\\.\\S+$")

    fun isValidEmail(value: String): Boolean = emailRegex.matches(value.trim())

    fun isValidPassword(value: String): Boolean = value.length >= 6

    fun isValidCourse(value: Int): Boolean = value in 1..3

    fun isNotBlank(value: String): Boolean = value.isNotBlank()
}
