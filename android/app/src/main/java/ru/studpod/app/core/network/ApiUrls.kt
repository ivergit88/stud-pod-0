package ru.studpod.app.core.network

import ru.studpod.app.BuildConfig

/**
 * Сервер отдаёт относительные URL (например, "/api/tasks/.../download").
 * Здесь они превращаются в абсолютные с учётом базового адреса API.
 */
object ApiUrls {

    fun resolve(path: String): String {
        if (path.startsWith("http://") || path.startsWith("https://")) {
            return path
        }
        return BuildConfig.API_BASE_URL.trimEnd('/') + "/" + path.trimStart('/')
    }
}
