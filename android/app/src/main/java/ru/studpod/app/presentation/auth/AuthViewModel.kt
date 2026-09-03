package ru.studpod.app.presentation.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import ru.studpod.app.core.network.StudentRegistrationData
import ru.studpod.app.core.util.AppResult
import ru.studpod.app.data.repository.AuthRepository
import javax.inject.Inject

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository,
) : ViewModel() {

    val session = authRepository.session

    private val _isSubmitting = MutableStateFlow(false)
    val isSubmitting: StateFlow<Boolean> = _isSubmitting.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    fun clearError() {
        _error.value = null
    }

    fun login(email: String, password: String) {
        _error.value = null
        _isSubmitting.value = true
        viewModelScope.launch {
            when (val result = authRepository.login(email, password)) {
                is AppResult.Success -> Unit
                is AppResult.Error -> _error.value = result.message
            }
            _isSubmitting.value = false
        }
    }

    fun registerStudent(
        email: String,
        firstName: String,
        lastName: String,
        middleName: String?,
        university: String,
        course: Int,
        specialty: String? = null,
        skills: List<String>,
        password: String,
    ) {
        _error.value = null
        _isSubmitting.value = true
        viewModelScope.launch {
            val data = StudentRegistrationData(
                email = email,
                firstName = firstName,
                lastName = lastName,
                middleName = middleName,
                university = university,
                course = course,
                description = specialty?.takeIf { it.isNotBlank() },
                skills = skills,
            )
            when (val result = authRepository.registerStudent(data, password)) {
                is AppResult.Success -> Unit
                is AppResult.Error -> _error.value = result.message
            }
            _isSubmitting.value = false
        }
    }
}
