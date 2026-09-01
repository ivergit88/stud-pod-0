package ru.studpod.app.presentation.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ru.studpod.app.core.util.Validators

private val AVAILABLE_SKILLS = listOf(
    "Контент", "Дизайн", "Сайт", "Бот", "Оцифровка", "3D", "Настройка", "Аналитика", "Другое",
)

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun RegisterStudentScreen(
    onBack: () -> Unit,
    viewModel: AuthViewModel = hiltViewModel(),
) {
    var email by rememberSaveable { mutableStateOf("") }
    var firstName by rememberSaveable { mutableStateOf("") }
    var lastName by rememberSaveable { mutableStateOf("") }
    var middleName by rememberSaveable { mutableStateOf("") }
    var university by rememberSaveable { mutableStateOf("") }
    var courseText by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    var selectedSkills by rememberSaveable { mutableStateOf(setOf<String>()) }
    var validationError by rememberSaveable { mutableStateOf<String?>(null) }

    val isSubmitting by viewModel.isSubmitting.collectAsStateWithLifecycle()
    val serverError by viewModel.error.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Регистрация студента") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Назад")
                    }
                },
            )
        },
        containerColor = MaterialTheme.colorScheme.background,
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .imePadding()
                .padding(horizontal = 24.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                label = { Text("Email *") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                leadingIcon = { Icon(Icons.Default.Email, contentDescription = null) },
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = lastName,
                onValueChange = { lastName = it },
                label = { Text("Фамилия *") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = firstName,
                onValueChange = { firstName = it },
                label = { Text("Имя *") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = middleName,
                onValueChange = { middleName = it },
                label = { Text("Отчество") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = university,
                onValueChange = { university = it },
                label = { Text("Вуз *") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = courseText,
                onValueChange = { courseText = it.filter(Char::isDigit).take(1) },
                label = { Text("Курс (1–3) *") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier.fillMaxWidth(),
            )

            Text(
                text = "Навыки",
                style = MaterialTheme.typography.labelLarge,
                modifier = Modifier.padding(top = 4.dp),
            )
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                AVAILABLE_SKILLS.forEach { skill ->
                    FilterChip(
                        selected = skill in selectedSkills,
                        onClick = {
                            selectedSkills = if (skill in selectedSkills) {
                                selectedSkills - skill
                            } else {
                                selectedSkills + skill
                            }
                        },
                        label = { Text(skill) },
                    )
                }
            }

            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("Пароль (мин. 6 символов) *") },
                singleLine = true,
                visualTransformation = PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null) },
                modifier = Modifier.fillMaxWidth(),
            )

            val message = validationError ?: serverError
            if (message != null) {
                Text(
                    text = message,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall,
                )
            }

            Button(
                onClick = {
                    val course = courseText.toIntOrNull()
                    validationError = when {
                        !Validators.isValidEmail(email) -> "Укажите корректный email"
                        lastName.isBlank() || firstName.isBlank() -> "Заполните имя и фамилию"
                        university.isBlank() -> "Укажите вуз"
                        course == null || !Validators.isValidCourse(course) -> "Курс: от 1 до 3"
                        !Validators.isValidPassword(password) -> "Пароль — минимум 6 символов"
                        else -> null
                    }
                    if (validationError == null && course != null) {
                        viewModel.registerStudent(
                            email = email,
                            firstName = firstName.trim(),
                            lastName = lastName.trim(),
                            middleName = middleName.trim().ifBlank { null },
                            university = university.trim(),
                            course = course,
                            skills = selectedSkills.toList(),
                            password = password,
                        )
                    }
                },
                enabled = !isSubmitting,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp)
                    .padding(top = 4.dp),
            ) {
                if (isSubmitting) {
                    CircularProgressIndicator(
                        modifier = Modifier.height(22.dp).width(22.dp),
                        color = MaterialTheme.colorScheme.onPrimary,
                        strokeWidth = 2.dp,
                    )
                } else {
                    Text("Зарегистрироваться", style = MaterialTheme.typography.titleMedium)
                }
            }
            Spacer(Modifier.height(16.dp))
        }
    }
}
