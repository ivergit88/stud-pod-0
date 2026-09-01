package ru.studpod.app.presentation.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ru.studpod.app.domain.model.User
import ru.studpod.app.presentation.ui.theme.PortalBlue
import ru.studpod.app.presentation.ui.theme.PortalBlueContainer
import ru.studpod.app.presentation.ui.theme.PointsPurple

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun ProfileScreen(
    viewModel: ProfileViewModel = hiltViewModel(),
) {
    val user by viewModel.user.collectAsStateWithLifecycle()
    var showLogoutDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Профиль") }) },
        containerColor = MaterialTheme.colorScheme.background,
    ) { innerPadding ->
        val currentUser = user
        if (currentUser == null) {
            Box(Modifier.padding(innerPadding))
            return@Scaffold
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            ProfileHeader(currentUser)

            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(Modifier.padding(16.dp)) {
                    ProfileRow(
                        icon = { Icon(Icons.Default.School, null, tint = MaterialTheme.colorScheme.primary) },
                        value = listOf(
                            currentUser.university,
                            currentUser.course?.let { "$it курс" },
                        ).filterNotNull().joinToString(" · ").ifBlank { "Вуз не указан" },
                    )
                    ProfileRow(
                        icon = { Icon(Icons.Default.Email, null, tint = MaterialTheme.colorScheme.primary) },
                        value = currentUser.email,
                    )
                    currentUser.phone?.takeIf { it.isNotBlank() }?.let { phone ->
                        ProfileRow(
                            icon = { Icon(Icons.Default.Phone, null, tint = MaterialTheme.colorScheme.primary) },
                            value = phone,
                        )
                    }
                }
            }

            if (currentUser.skills.isNotEmpty()) {
                Text(
                    text = "Навыки",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                )
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    currentUser.skills.forEach { skill ->
                        SkillChip(skill)
                    }
                }
            }

            OutlinedButton(
                onClick = { showLogoutDialog = true },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
            ) {
                Icon(Icons.Default.ExitToApp, contentDescription = null)
                Text("Выйти из аккаунта", modifier = Modifier.padding(start = 6.dp))
            }
        }
    }

    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            title = { Text("Выйти из аккаунта?") },
            text = { Text("Сессия на устройстве будет удалена.") },
            confirmButton = {
                TextButton(onClick = {
                    showLogoutDialog = false
                    viewModel.logout()
                }) {
                    Text("Выйти")
                }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutDialog = false }) {
                    Text("Отмена")
                }
            },
        )
    }
}

@Composable
private fun ProfileHeader(user: User) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            modifier = Modifier
                .size(72.dp)
                .background(PortalBlueContainer, CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = user.initials,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Black,
                color = PortalBlue,
            )
        }
        Column(Modifier.padding(start = 16.dp)) {
            Text(
                text = user.name,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
            )
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Star,
                    contentDescription = null,
                    tint = PointsPurple,
                    modifier = Modifier.size(16.dp),
                )
                Text(
                    text = "${user.points} баллов",
                    style = MaterialTheme.typography.bodyMedium,
                    color = PointsPurple,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(start = 4.dp),
                )
            }
        }
    }
}

@Composable
private fun ProfileRow(
    icon: @Composable () -> Unit,
    value: String,
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.padding(vertical = 6.dp),
    ) {
        icon()
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier.padding(start = 10.dp),
        )
    }
}

@Composable
private fun SkillChip(skill: String) {
    Box(
        modifier = Modifier
            .background(PortalBlueContainer, RoundedCornerShape(50))
            .padding(horizontal = 12.dp, vertical = 6.dp),
    ) {
        Text(
            text = skill,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.primary,
        )
    }
}
