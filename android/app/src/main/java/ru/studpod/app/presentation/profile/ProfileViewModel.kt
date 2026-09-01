package ru.studpod.app.presentation.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import ru.studpod.app.data.repository.AuthRepository
import ru.studpod.app.domain.model.User
import javax.inject.Inject

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val authRepository: AuthRepository,
) : ViewModel() {

    val user: StateFlow<User?> = authRepository.session
        .map { it.user }
        .stateIn(viewModelScope, SharingStarted.Eagerly, null)

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
        }
    }
}
