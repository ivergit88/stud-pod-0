package ru.studpod.app.data.repository

import ru.studpod.app.core.network.AppNotificationDto
import ru.studpod.app.core.network.MyTaskItemDto
import ru.studpod.app.core.network.TaskAttachmentDto
import ru.studpod.app.core.network.TaskDto
import ru.studpod.app.core.network.TaskResponseDto
import ru.studpod.app.core.network.TeamMemberDto
import ru.studpod.app.core.network.UserDto
import ru.studpod.app.domain.model.AppNotification
import ru.studpod.app.domain.model.MyTaskItem
import ru.studpod.app.domain.model.Task
import ru.studpod.app.domain.model.TaskAttachment
import ru.studpod.app.domain.model.TaskResponse
import ru.studpod.app.domain.model.TeamMember
import ru.studpod.app.domain.model.User

fun UserDto.toDomain(): User = User(
    id = id,
    email = email,
    role = role,
    firstName = firstName,
    lastName = lastName,
    middleName = middleName,
    name = name,
    points = points,
    university = university,
    course = course,
    description = description,
    skills = skills,
    phone = phone,
    status = status,
)

fun TaskDto.toDomain(): Task = Task(
    id = id,
    slug = slug,
    title = title,
    description = description,
    requirements = requirements,
    organizationId = organizationId,
    organizationName = organizationName,
    category = category,
    format = format,
    workload = workload,
    taskType = taskType,
    urgency = urgency,
    pointsReward = pointsReward,
    pointsMin = pointsMin,
    pointsRecommended = pointsRecommended,
    pointsMax = pointsMax,
    deadline = deadline,
    status = status,
    createdAt = createdAt,
    taskKind = taskKind,
    location = location,
    materialsLink = materialsLink,
    attachments = attachments.map(TaskAttachmentDto::toDomain),
    parentTaskTitle = parentTaskTitle,
)

fun TaskAttachmentDto.toDomain(): TaskAttachment = TaskAttachment(
    id = id,
    originalName = originalName,
    url = url,
    size = size,
)

fun TaskResponseDto.toDomain(): TaskResponse = TaskResponse(
    id = id,
    taskId = taskId,
    studentId = studentId,
    studentName = studentName,
    status = status,
    coverLetter = coverLetter,
    submissionLink = submissionLink,
    reviewComment = reviewComment,
    createdAt = createdAt,
    updatedAt = updatedAt,
    teamMembers = teamMembers.map(TeamMemberDto::toDomain),
)

fun TeamMemberDto.toDomain(): TeamMember = TeamMember(
    id = id,
    studentId = studentId,
    studentName = studentName,
    role = role,
    university = university,
    course = course,
    skills = skills,
)

fun MyTaskItemDto.toDomain(): MyTaskItem = MyTaskItem(
    task = task.toDomain(),
    response = response.toDomain(),
)

fun AppNotificationDto.toDomain(): AppNotification = AppNotification(
    id = id,
    title = title,
    message = message,
    read = read,
    createdAt = createdAt,
    link = link,
    type = type,
)
