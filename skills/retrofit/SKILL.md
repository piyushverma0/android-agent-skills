---
name: retrofit
description: |
  Retrofit HTTP networking for Android AI agents. Use this skill whenever implementing
  REST API calls, Retrofit service interfaces, OkHttp client, interceptors, authentication
  headers, API key injection, JWT tokens, @GET @POST @PUT @DELETE @PATCH annotations,
  @Query @Path @Body @Header @Field @Multipart, kotlinx.serialization, JSON parsing,
  error handling, network result wrapping, timeout configuration, certificate pinning,
  logging interceptor, mock API for testing, Hilt network module, base URL configuration,
  or any HTTP client networking in Android. Always apply before writing any Retrofit interface.
---

# Retrofit HTTP Networking

These rules cover the complete Retrofit setup — from interface definition to error handling.

## Setup

```toml
[versions]
retrofit = "2.11.0"
okhttp = "4.12.0"
kotlinxSerialization = "1.7.3"

[libraries]
retrofit-core = { group = "com.squareup.retrofit2", name = "retrofit", version.ref = "retrofit" }
retrofit-kotlin-serialization = { group = "com.squareup.retrofit2", name = "converter-kotlinx-serialization", version.ref = "retrofit" }
okhttp = { group = "com.squareup.okhttp3", name = "okhttp", version.ref = "okhttp" }
okhttp-logging = { group = "com.squareup.okhttp3", name = "logging-interceptor", version.ref = "okhttp" }
kotlinx-serialization-json = { group = "org.jetbrains.kotlinx", name = "kotlinx-serialization-json", version.ref = "kotlinxSerialization" }

[plugins]
kotlin-serialization = { id = "org.jetbrains.kotlin.plugin.serialization", version.ref = "kotlin" }
```

## Rule 1: Service interface — correct annotations

```kotlin
// ✅ Complete service interface
interface ItemApiService {
    // GET with path parameter
    @GET("items/{id}")
    suspend fun getItem(@Path("id") id: String): ItemDto

    // GET with query parameters
    @GET("items")
    suspend fun getItems(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("sort") sort: String = "created_at",
        @Query("order") order: String = "desc"
    ): PagedResponse<ItemDto>

    // POST with JSON body
    @POST("items")
    suspend fun createItem(@Body request: CreateItemRequest): ItemDto

    // PUT for full update
    @PUT("items/{id}")
    suspend fun updateItem(@Path("id") id: String, @Body request: UpdateItemRequest): ItemDto

    // PATCH for partial update
    @PATCH("items/{id}")
    suspend fun patchItem(
        @Path("id") id: String,
        @Body fields: Map<String, @JvmSuppressWildcards Any>
    ): ItemDto

    // DELETE
    @DELETE("items/{id}")
    suspend fun deleteItem(@Path("id") id: String): Unit

    // File upload
    @Multipart
    @POST("items/{id}/image")
    suspend fun uploadImage(
        @Path("id") id: String,
        @Part image: MultipartBody.Part
    ): ImageDto

    // Dynamic header
    @GET("user/profile")
    suspend fun getProfile(@Header("Authorization") token: String): UserDto
}
```

## Rule 2: DTOs with kotlinx.serialization

```kotlin
// ✅ @Serializable DTOs — never expose to domain layer
@Serializable
data class ItemDto(
    val id: String,
    val title: String,
    val description: String,
    @SerialName("is_favorite") val isFavorite: Boolean = false,
    @SerialName("created_at") val createdAt: String,    // ISO string from API
    @SerialName("updated_at") val updatedAt: String,
    val user: UserDto? = null
)

@Serializable
data class CreateItemRequest(
    val title: String,
    val description: String,
    @SerialName("user_id") val userId: String
)

@Serializable
data class PagedResponse<T>(
    val data: List<T>,
    val page: Int,
    val limit: Int,
    val total: Int,
    @SerialName("has_next") val hasNext: Boolean
)

// ✅ Mapper from DTO to domain model
fun ItemDto.toDomain() = Item(
    id = id,
    title = title,
    description = description,
    isFavorite = isFavorite,
    createdAt = Instant.parse(createdAt)
)
```

## Rule 3: OkHttp + Retrofit Hilt module

```kotlin
// ✅ Complete network module
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideJson(): Json = Json {
        ignoreUnknownKeys = true     // API can add new fields without breaking app
        coerceInputValues = true     // null → default value for non-nullable fields
        isLenient = true             // handle minor JSON formatting issues
    }

    @Provides
    @Singleton
    fun provideAuthInterceptor(tokenProvider: TokenProvider): Interceptor =
        Interceptor { chain ->
            val token = tokenProvider.getToken()
            val request = if (token != null) {
                chain.request().newBuilder()
                    .addHeader("Authorization", "Bearer $token")
                    .build()
            } else {
                chain.request()
            }
            chain.proceed(request)
        }

    @Provides
    @Singleton
    fun provideOkHttpClient(authInterceptor: Interceptor): OkHttpClient =
        OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(
                HttpLoggingInterceptor().apply {
                    level = if (BuildConfig.DEBUG) HttpLoggingInterceptor.Level.BODY
                            else HttpLoggingInterceptor.Level.NONE
                }
            )
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()

    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient, json: Json): Retrofit =
        Retrofit.Builder()
            .baseUrl(BuildConfig.BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()

    @Provides
    @Singleton
    fun provideItemApiService(retrofit: Retrofit): ItemApiService =
        retrofit.create(ItemApiService::class.java)
}
```

## Rule 4: Network result — wrap errors uniformly

```kotlin
// ✅ Sealed result for all API calls
sealed interface NetworkResult<out T> {
    data class Success<T>(val data: T) : NetworkResult<T>
    data class Error(val code: Int, val message: String) : NetworkResult<Nothing>
    data object NetworkError : NetworkResult<Nothing>      // no connection
    data object Timeout : NetworkResult<Nothing>
}

// ✅ Extension to safely call any suspend API function
suspend fun <T> safeApiCall(apiCall: suspend () -> T): NetworkResult<T> = try {
    NetworkResult.Success(apiCall())
} catch (e: HttpException) {
    NetworkResult.Error(
        code = e.code(),
        message = e.response()?.errorBody()?.string() ?: e.message()
    )
} catch (e: IOException) {
    NetworkResult.NetworkError
} catch (e: SocketTimeoutException) {
    NetworkResult.Timeout
}

// ✅ Usage in Repository
override suspend fun createItem(request: CreateItemRequest): Result<Item> = withContext(ioDispatcher) {
    when (val result = safeApiCall { api.createItem(request) }) {
        is NetworkResult.Success -> Result.success(result.data.toDomain())
        is NetworkResult.Error -> Result.failure(ApiException(result.code, result.message))
        is NetworkResult.NetworkError -> Result.failure(NoNetworkException())
        is NetworkResult.Timeout -> Result.failure(TimeoutException())
    }
}
```

## Rule 5: Token refresh — automatic re-authentication

```kotlin
// ✅ Authenticator for automatic 401 token refresh
class TokenAuthenticator @Inject constructor(
    private val tokenRepository: TokenRepository
) : Authenticator {
    override fun authenticate(route: Route?, response: Response): Request? {
        // Don't retry if it's already a refresh request
        if (response.request.url.pathSegments.last() == "refresh") return null

        // Refresh token synchronously (Authenticator is blocking)
        val newToken = runBlocking { tokenRepository.refreshToken() } ?: return null

        return response.request.newBuilder()
            .header("Authorization", "Bearer $newToken")
            .build()
    }
}

// Register in OkHttpClient
OkHttpClient.Builder()
    .authenticator(tokenAuthenticator)
    .build()
```

## Rule 6: File upload with progress

```kotlin
// ✅ Multipart upload
fun File.toMultipartPart(partName: String): MultipartBody.Part {
    val requestBody = asRequestBody(getMimeType().toMediaTypeOrNull())
    return MultipartBody.Part.createFormData(partName, name, requestBody)
}

// In Repository
suspend fun uploadImage(itemId: String, file: File): Result<String> = withContext(ioDispatcher) {
    runCatching {
        val imagePart = file.toMultipartPart("image")
        api.uploadImage(itemId, imagePart).url
    }
}
```

## Common Mistakes

❌ Non-suspend service functions — all Retrofit functions must be `suspend`
❌ Catching generic `Exception` without type — always catch `HttpException` + `IOException`
❌ Exposing Retrofit exceptions to ViewModel — wrap in domain exceptions
❌ Hardcoded base URL — use BuildConfig.BASE_URL
❌ Logging enabled in release build — check `BuildConfig.DEBUG` before setting log level
❌ No `ignoreUnknownKeys = true` — crashes when API adds new fields
❌ Raw Response types — always use typed response bodies
❌ Missing timeout configuration — default OkHttp timeouts are too long
