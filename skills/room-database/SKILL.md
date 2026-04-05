---
name: room-database
description: |
  Room database for Android AI agents. Use this skill whenever implementing local data
  persistence with Room: @Entity, @Dao, @Database, @Query, @Insert, @Update, @Delete,
  @Upsert, TypeConverter, database migration, Room Flow queries, RoomDatabase.Builder,
  fallbackToDestructiveMigration, prepopulate, FTS (full-text search), database testing,
  Room with Hilt, embedded entities, foreign keys, indices, database inspector, or any
  Room/SQLite local storage. Always apply before writing any Room entity, DAO, or database class.
---

# Room Database

Room is the standard local database for Android. These rules prevent the most common
mistakes AI agents make — wrong DAO patterns, missing migrations, threading errors.

## Setup

```toml
[versions]
room = "2.6.1"
[libraries]
room-runtime = { group = "androidx.room", name = "room-runtime", version.ref = "room" }
room-ktx = { group = "androidx.room", name = "room-ktx", version.ref = "room" }
room-compiler = { group = "androidx.room", name = "room-compiler", version.ref = "room" }
# Optional for FTS and paging
room-paging = { group = "androidx.room", name = "room-paging", version.ref = "room" }
```

```kotlin
// build.gradle.kts
plugins { alias(libs.plugins.ksp) }
dependencies {
    implementation(libs.room.runtime)
    implementation(libs.room.ktx)
    ksp(libs.room.compiler)   // ← ksp, never kapt
}
```

## Rule 1: Entity — correct field declaration

```kotlin
// ✅ Complete Entity with indices and foreign key
@Entity(
    tableName = "items",
    indices = [
        Index(value = ["user_id"]),          // index foreign key for JOIN performance
        Index(value = ["created_at"]),        // index for ORDER BY queries
        Index(value = ["title"], unique = true)  // unique constraint
    ],
    foreignKeys = [
        ForeignKey(
            entity = UserEntity::class,
            parentColumns = ["id"],
            childColumns = ["user_id"],
            onDelete = ForeignKey.CASCADE    // delete items when user is deleted
        )
    ]
)
data class ItemEntity(
    @PrimaryKey val id: String,              // String UUID or Int autoGenerate
    @ColumnInfo(name = "user_id") val userId: String,
    @ColumnInfo(name = "title") val title: String,
    @ColumnInfo(name = "description") val description: String,
    @ColumnInfo(name = "is_favorite") val isFavorite: Boolean = false,
    @ColumnInfo(name = "created_at") val createdAt: Long = System.currentTimeMillis(),
    @ColumnInfo(name = "updated_at") val updatedAt: Long = System.currentTimeMillis()
)

// ✅ Auto-generate Int primary key
@Entity(tableName = "notifications")
data class NotificationEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    @ColumnInfo(name = "message") val message: String,
    @ColumnInfo(name = "is_read") val isRead: Boolean = false
)
```

## Rule 2: DAO — complete query patterns

```kotlin
// ✅ Complete DAO with all patterns
@Dao
interface ItemDao {
    // Queries that return Flow — auto-update when data changes
    @Query("SELECT * FROM items ORDER BY created_at DESC")
    fun getAll(): Flow<List<ItemEntity>>

    @Query("SELECT * FROM items WHERE user_id = :userId ORDER BY created_at DESC")
    fun getByUserId(userId: String): Flow<List<ItemEntity>>

    @Query("SELECT * FROM items WHERE id = :id")
    fun getById(id: String): Flow<ItemEntity?>

    // One-shot suspend queries
    @Query("SELECT * FROM items WHERE id = :id")
    suspend fun getByIdOnce(id: String): ItemEntity?

    @Query("SELECT COUNT(*) FROM items WHERE user_id = :userId")
    suspend fun countByUserId(userId: String): Int

    // Write operations — always suspend
    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insert(item: ItemEntity)

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertAll(items: List<ItemEntity>)

    @Upsert                                  // INSERT OR REPLACE (Room 2.5+)
    suspend fun upsert(item: ItemEntity)

    @Upsert
    suspend fun upsertAll(items: List<ItemEntity>)

    @Update
    suspend fun update(item: ItemEntity)

    @Query("UPDATE items SET is_favorite = :isFavorite WHERE id = :id")
    suspend fun updateFavorite(id: String, isFavorite: Boolean)

    @Delete
    suspend fun delete(item: ItemEntity)

    @Query("DELETE FROM items WHERE id = :id")
    suspend fun deleteById(id: String)

    @Query("DELETE FROM items WHERE user_id = :userId")
    suspend fun deleteAllByUserId(userId: String)

    // Transaction — for multi-step operations
    @Transaction
    @Query("SELECT * FROM items WHERE user_id = :userId")
    fun getItemsWithDetails(userId: String): Flow<List<ItemWithDetails>>
}

// ✅ Relation — one-to-many
data class ItemWithDetails(
    @Embedded val item: ItemEntity,
    @Relation(
        parentColumn = "id",
        entityColumn = "item_id"
    )
    val comments: List<CommentEntity>
)
```

## Rule 3: TypeConverters for non-primitive types

```kotlin
// ✅ Convert complex types to primitives Room can store
class Converters {
    @TypeConverter
    fun fromInstant(value: Instant?): Long? = value?.toEpochMilliseconds()

    @TypeConverter
    fun toInstant(value: Long?): Instant? = value?.let { Instant.fromEpochMilliseconds(it) }

    @TypeConverter
    fun fromStringList(value: List<String>?): String? =
        value?.let { Json.encodeToString(it) }

    @TypeConverter
    fun toStringList(value: String?): List<String>? =
        value?.let { Json.decodeFromString(it) }

    @TypeConverter
    fun fromStatus(status: Status?): String? = status?.name

    @TypeConverter
    fun toStatus(value: String?): Status? = value?.let { Status.valueOf(it) }
}
```

## Rule 4: Database — correct setup

```kotlin
// ✅ Room database with migrations and type converters
@Database(
    entities = [
        ItemEntity::class,
        UserEntity::class,
        CommentEntity::class
    ],
    version = 2,                             // increment on schema change
    exportSchema = true                      // save schema to file for migration verification
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun itemDao(): ItemDao
    abstract fun userDao(): UserDao
    abstract fun commentDao(): CommentDao

    companion object {
        const val DATABASE_NAME = "app_database"
    }
}
```

## Rule 5: Migrations — never fallbackToDestructiveMigration in production

```kotlin
// ✅ Write explicit migrations
val MIGRATION_1_2 = object : Migration(1, 2) {
    override fun migrate(db: SupportSQLiteDatabase) {
        // Add new column with default value
        db.execSQL("ALTER TABLE items ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0")
    }
}

val MIGRATION_2_3 = object : Migration(2, 3) {
    override fun migrate(db: SupportSQLiteDatabase) {
        // Create new table
        db.execSQL("""
            CREATE TABLE IF NOT EXISTS `comments` (
                `id` TEXT NOT NULL,
                `item_id` TEXT NOT NULL,
                `content` TEXT NOT NULL,
                `created_at` INTEGER NOT NULL,
                PRIMARY KEY (`id`),
                FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON DELETE CASCADE
            )
        """)
        db.execSQL("CREATE INDEX IF NOT EXISTS `index_comments_item_id` ON `comments` (`item_id`)")
    }
}

// ✅ Hilt module for database
@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {
    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): AppDatabase =
        Room.databaseBuilder(context, AppDatabase::class.java, AppDatabase.DATABASE_NAME)
            .addMigrations(MIGRATION_1_2, MIGRATION_2_3)
            // .fallbackToDestructiveMigration()  ← only in dev, NEVER in production
            .build()

    @Provides
    fun provideItemDao(db: AppDatabase): ItemDao = db.itemDao()

    @Provides
    fun provideUserDao(db: AppDatabase): UserDao = db.userDao()
}
```

## Rule 6: Repository using Room correctly

```kotlin
// ✅ Repository wraps DAO and dispatches to IO
class ItemRepositoryImpl @Inject constructor(
    private val itemDao: ItemDao,
    @IoDispatcher private val ioDispatcher: CoroutineDispatcher
) : ItemRepository {

    // Return Flow directly — Room emits updates automatically
    override fun getItemsStream(): Flow<List<Item>> =
        itemDao.getAll().map { entities -> entities.map { it.toDomain() } }

    // One-shot operations on IO dispatcher
    override suspend fun upsertItem(item: Item): Result<Unit> = withContext(ioDispatcher) {
        runCatching { itemDao.upsert(item.toEntity()) }
    }

    override suspend fun deleteItem(id: String): Result<Unit> = withContext(ioDispatcher) {
        runCatching { itemDao.deleteById(id) }
    }

    // ❌ Never collect Flow in repository — return it to ViewModel
    // override suspend fun getItems() = itemDao.getAll().first()  // kills reactivity
}
```

## Rule 7: Full-text search (FTS)

```kotlin
// ✅ FTS4 entity for fast text search
@Entity(tableName = "items_fts")
@Fts4(contentEntity = ItemEntity::class)
data class ItemFtsEntity(
    @PrimaryKey @ColumnInfo(name = "rowid") val rowId: Int,
    @ColumnInfo(name = "title") val title: String,
    @ColumnInfo(name = "description") val description: String
)

// DAO query with FTS
@Query("SELECT items.* FROM items JOIN items_fts ON items.rowid = items_fts.rowid WHERE items_fts MATCH :query")
fun search(query: String): Flow<List<ItemEntity>>

// Usage — append * for prefix matching
itemDao.search("$query*")
```

## Common Mistakes

❌ `@Insert` without `onConflict` — crashes on duplicate primary key
❌ Calling DAO from Main thread — always `withContext(Dispatchers.IO)`
❌ `fallbackToDestructiveMigration()` in production — destroys user data
❌ Missing `exportSchema = true` — can't verify migrations
❌ Collecting Flow inside Repository — let ViewModel/UseCase collect
❌ Foreign key without index — slow JOIN queries
❌ Forgetting `@TypeConverters` annotation on `@Database` class
❌ Using kapt for Room — use ksp

## Deep-dive references

- `references/room-testing.md` — in-memory database testing patterns
- `references/room-paging.md` — Paging 3 + Room integration
