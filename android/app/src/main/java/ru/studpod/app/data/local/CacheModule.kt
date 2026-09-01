package ru.studpod.app.data.local

import android.content.Context
import androidx.room.Room
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object CacheModule {

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): AppDatabase =
        Room.databaseBuilder(context, AppDatabase::class.java, "stud_pod_cache.db")
            .fallbackToDestructiveMigration()
            .build()

    @Provides
    fun provideTaskCacheDao(db: AppDatabase): TaskCacheDao = db.taskCacheDao()

    @Provides
    fun provideNotificationCacheDao(db: AppDatabase): NotificationCacheDao = db.notificationCacheDao()
}
