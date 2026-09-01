# Правила ProGuard/R8 для релизной сборки.

# Retrofit + kotlinx.serialization
-keepattributes Signature, InnerClasses, EnclosingMethod, *Annotation*
-keepattributes RuntimeVisibleAnnotations, RuntimeVisibleParameterAnnotations

# Модели, сериализуемые kotlinx.serialization, помечаются @Serializable —
# R8 сохраняет их конструкторы и поля автоматически через правило ниже.
-keepclassmembers class ru.studpod.app.** {
    *** Companion;
}
-keepclasseswithmembers class ru.studpod.app.** {
    kotlinx.serialization.KSerializer serializer(...);
}
-keep,includedescriptorclasses class ru.studpod.app.**$$serializer { *; }

# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**

# Room
-keep class * extends androidx.room.RoomDatabase
