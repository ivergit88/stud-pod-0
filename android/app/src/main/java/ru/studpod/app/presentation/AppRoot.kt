package ru.studpod.app.presentation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ru.studpod.app.presentation.auth.AuthNavHost
import ru.studpod.app.presentation.main.MainScaffold

/**
 * Корневой экран: пока идёт восстановление сессии — показываем сплэш
 * (SplashScreen из core-splashscreen), затем авторизацию или основной UI.
 */
@Composable
fun AppRoot(viewModel: RootViewModel = hiltViewModel()) {
    val isRestoring by viewModel.isRestoring.collectAsStateWithLifecycle()
    val session by viewModel.session.collectAsStateWithLifecycle()

    when {
        isRestoring -> Unit // сплэш-экран остаётся на месте
        session.isLoggedIn -> MainScaffold(unreadCount = viewModel.unreadCount)
        else -> AuthNavHost()
    }
}
