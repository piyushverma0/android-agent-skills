---
name: firebase
description: |
  Firebase integration for Android AI agents. Use this skill whenever integrating Firebase
  Authentication, Firestore, Realtime Database, Firebase Storage, Firebase Analytics,
  Firebase Crashlytics, Firebase Messaging (FCM), Firebase Remote Config, Firebase App Check,
  google-services.json, Firebase SDK setup, BoM (Bill of Materials), Hilt Firebase injection,
  Firebase Auth with email/password/Google/phone, Firestore CRUD, Firestore real-time listeners,
  Firebase Collections, Documents, Queries, or any Firebase service in Android.
---

# Firebase for Android

## Setup — always use BoM for version management

```toml
[versions]
firebaseBom = "33.5.1"
googleServices = "4.4.2"
```

```kotlin
// build.gradle.kts
plugins { alias(libs.plugins.google.services) }
dependencies {
    implementation(platform(libs.firebase.bom))
    implementation(libs.firebase.auth.ktx)
    implementation(libs.firebase.firestore.ktx)
    implementation(libs.firebase.storage.ktx)
    implementation(libs.firebase.analytics.ktx)
    implementation(libs.firebase.crashlytics.ktx)
    implementation(libs.firebase.messaging.ktx)
}
```

## Firebase Auth

```kotlin
// ✅ Auth repository
class AuthRepositoryImpl @Inject constructor(
    private val auth: FirebaseAuth
) : AuthRepository {

    override val currentUser: Flow<User?> = callbackFlow {
        val listener = FirebaseAuth.AuthStateListener { auth ->
            trySend(auth.currentUser?.toDomain())
        }
        auth.addAuthStateListener(listener)
        awaitClose { auth.removeAuthStateListener(listener) }
    }

    override suspend fun signInWithEmail(email: String, password: String): Result<User> =
        runCatching {
            auth.signInWithEmailAndPassword(email, password).await()
                .user?.toDomain() ?: throw IllegalStateException("User is null after sign in")
        }

    override suspend fun createAccount(email: String, password: String): Result<User> =
        runCatching {
            auth.createUserWithEmailAndPassword(email, password).await()
                .user?.toDomain() ?: throw IllegalStateException("User is null after creation")
        }

    override suspend fun signInWithGoogle(idToken: String): Result<User> = runCatching {
        val credential = GoogleAuthProvider.getCredential(idToken, null)
        auth.signInWithCredential(credential).await()
            .user?.toDomain() ?: throw IllegalStateException("User is null")
    }

    override fun signOut() = auth.signOut()

    override fun isSignedIn(): Boolean = auth.currentUser != null
}

fun FirebaseUser.toDomain() = User(uid, email ?: "", displayName ?: "", photoUrl?.toString())
```

## Firestore — CRUD + real-time

```kotlin
// ✅ Firestore repository
class ItemFirestoreDataSource @Inject constructor(
    private val firestore: FirebaseFirestore,
    private val auth: FirebaseAuth
) {
    private val itemsCollection
        get() = firestore.collection("users")
            .document(auth.currentUser?.uid ?: throw UnauthorizedException())
            .collection("items")

    // Real-time stream
    fun getItemsStream(): Flow<List<ItemDto>> = callbackFlow {
        val listener = itemsCollection
            .orderBy("created_at", Query.Direction.DESCENDING)
            .addSnapshotListener { snapshot, error ->
                if (error != null) { close(error); return@addSnapshotListener }
                val items = snapshot?.documents?.mapNotNull { doc ->
                    doc.toObject(ItemDto::class.java)?.copy(id = doc.id)
                } ?: emptyList()
                trySend(items)
            }
        awaitClose { listener.remove() }
    }

    // One-shot get
    suspend fun getItem(id: String): ItemDto? =
        itemsCollection.document(id).get().await()
            .toObject(ItemDto::class.java)?.copy(id = id)

    // Write
    suspend fun upsertItem(item: ItemDto): String {
        return if (item.id.isEmpty()) {
            itemsCollection.add(item).await().id
        } else {
            itemsCollection.document(item.id).set(item).await()
            item.id
        }
    }

    // Update specific fields
    suspend fun updateFavorite(id: String, isFavorite: Boolean) {
        itemsCollection.document(id).update(
            "is_favorite", isFavorite,
            "updated_at", FieldValue.serverTimestamp()
        ).await()
    }

    // Delete
    suspend fun deleteItem(id: String) {
        itemsCollection.document(id).delete().await()
    }

    // Batch write — atomic multi-document update
    suspend fun batchUpdate(updates: List<Pair<String, Map<String, Any>>>) {
        firestore.runBatch { batch ->
            updates.forEach { (id, fields) ->
                batch.update(itemsCollection.document(id), fields)
            }
        }.await()
    }

    // Transaction
    suspend fun transferItem(fromId: String, toUserId: String): Result<Unit> = runCatching {
        firestore.runTransaction { transaction ->
            val fromRef = itemsCollection.document(fromId)
            val item = transaction.get(fromRef).toObject(ItemDto::class.java)
                ?: throw NotFoundException()
            val toRef = firestore.collection("users").document(toUserId)
                .collection("items").document(fromId)
            transaction.set(toRef, item)
            transaction.delete(fromRef)
        }.await()
    }
}
```

## Hilt Firebase module

```kotlin
@Module
@InstallIn(SingletonComponent::class)
object FirebaseModule {
    @Provides @Singleton
    fun provideFirebaseAuth(): FirebaseAuth = Firebase.auth

    @Provides @Singleton
    fun provideFirestore(): FirebaseFirestore = Firebase.firestore.also {
        it.firestoreSettings = firestoreSettings { isPersistenceEnabled = true }
    }

    @Provides @Singleton
    fun provideStorage(): FirebaseStorage = Firebase.storage

    @Provides @Singleton
    fun provideAnalytics(@ApplicationContext context: Context): FirebaseAnalytics =
        Firebase.analytics
}
```

## FCM — Firebase Cloud Messaging

```kotlin
@AndroidEntryPoint
class MyFirebaseMessagingService : FirebaseMessagingService() {
    @Inject lateinit var notificationHandler: NotificationHandler

    override fun onMessageReceived(message: RemoteMessage) {
        message.notification?.let { notification ->
            notificationHandler.showNotification(
                title = notification.title ?: "",
                body = notification.body ?: "",
                data = message.data
            )
        }
    }

    override fun onNewToken(token: String) {
        // Send token to your server
    }
}
```

## Common Mistakes

❌ Missing `google-services.json` in `app/` directory
❌ Not using BoM — version conflicts between Firebase libraries
❌ Calling Firebase on Main thread without `.await()` — use suspend + `.await()`
❌ No offline persistence for Firestore — enable `isPersistenceEnabled = true`
❌ Missing Firestore security rules — always configure before production
❌ Storing sensitive data in Firestore without encryption
