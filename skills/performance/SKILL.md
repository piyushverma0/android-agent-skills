---
name: performance
description: |
  Android app performance for AI agents. Use this skill whenever optimizing app performance,
  reducing recomposition, Compose stability, @Stable, @Immutable, skippable composables,
  baseline profiles, R8 optimization, lazy loading, image memory, Coil caching, RecyclerView
  vs LazyList performance, memory leaks, LeakCanary, ANR prevention, background work,
  Trace API, systrace, profiling, overdraw, rendering performance, startup time optimization,
  or any Android performance concern. Apply whenever a screen feels slow or laggy.
---

# Android Performance

## Rule 1: Compose stability — stop unnecessary recomposition

```kotlin
// ✅ @Stable for classes Compose can't infer stability
@Stable
class ItemState(
    val id: String,
    val title: String,
    var isExpanded: Boolean = false   // mutable but tracked
)

// ✅ @Immutable for guaranteed-immutable data (faster than @Stable)
@Immutable
data class Item(
    val id: String,
    val title: String,
    val tags: List<String>            // List is not stable by default — @Immutable fixes it
)

// ✅ Use ImmutableList from kotlinx-collections-immutable for stable lists
implementation("org.jetbrains.kotlinx:kotlinx-collections-immutable:0.3.7")

@Composable
fun ItemList(items: ImmutableList<Item>) {  // ImmutableList is stable, List is not
    LazyColumn {
        items(items, key = { it.id }) { item ->
            ItemCard(item = item)   // won't recompose unless item changes
        }
    }
}

// ❌ List<Item> parameter causes ItemList to recompose on every parent recomposition
@Composable
fun ItemList(items: List<Item>) { ... }
```

## Rule 2: derivedStateOf — compute only when dependencies change

```kotlin
// ✅ derivedStateOf — prevents recomposition when result doesn't change
@Composable
fun ItemList(items: List<Item>) {
    val listState = rememberLazyListState()

    // Only recomputes when scroll position crosses threshold
    val showScrollToTop by remember {
        derivedStateOf { listState.firstVisibleItemIndex > 3 }
    }

    // Only recomputes when filter changes, not on every recomposition
    val activeItems by remember(items) {
        derivedStateOf { items.filter { it.isActive } }
    }

    Box {
        LazyColumn(state = listState) {
            items(activeItems, key = { it.id }) { ItemCard(it) }
        }
        AnimatedVisibility(visible = showScrollToTop, modifier = Modifier.align(Alignment.BottomEnd)) {
            ScrollToTopButton(onClick = { /* scroll to top */ })
        }
    }
}
```

## Rule 3: Baseline Profiles — fast startup

```kotlin
// ✅ Generate with Macrobenchmark — significant startup improvement
// benchmark/src/androidTest/java/BaselineProfileGenerator.kt
@RunWith(AndroidJUnit4::class)
class BaselineProfileGenerator {
    @get:Rule
    val rule = BaselineProfileRule()

    @Test
    fun generate() {
        rule.collect(packageName = "com.company.app") {
            pressHome()
            startActivityAndWait()
            // Navigate through main flows
            device.findObject(By.text("Home")).click()
            device.waitForIdle()
        }
    }
}

// app/build.gradle.kts
dependencies {
    implementation(libs.profileinstaller)
}
```

## Rule 4: R8 — enable shrinking in release

```kotlin
// ✅ build.gradle.kts — release config
buildTypes {
    release {
        isMinifyEnabled = true       // R8 removes unused code
        isShrinkResources = true     // removes unused resources
        proguardFiles(
            getDefaultProguardFile("proguard-android-optimize.txt"),
            "proguard-rules.pro"
        )
    }
}
```

```pro
# proguard-rules.pro — keep what R8 would remove incorrectly
-keep class com.company.app.data.remote.dto.** { *; }  # keep serialization DTOs
-keepclassmembers class * { @com.google.gson.annotations.SerializedName <fields>; }
# Kotlin
-keep class kotlin.** { *; }
-keepclassmembers class **$WhenMappings { *; }
```

## Rule 5: Image loading performance

```kotlin
// ✅ Coil — proper sizing and caching
AsyncImage(
    model = ImageRequest.Builder(LocalContext.current)
        .data(imageUrl)
        .size(Size.ORIGINAL)          // or explicit size: .size(400, 300)
        .crossfade(true)
        .memoryCachePolicy(CachePolicy.ENABLED)
        .diskCachePolicy(CachePolicy.ENABLED)
        .build(),
    contentDescription = null,
    contentScale = ContentScale.Crop,
    modifier = Modifier
        .fillMaxWidth()
        .aspectRatio(16f / 9f)
)

// ✅ Preload images before they're needed
val imageLoader = LocalContext.current.imageLoader
LaunchedEffect(items) {
    items.take(3).forEach { item ->
        imageLoader.enqueue(
            ImageRequest.Builder(context).data(item.imageUrl).build()
        )
    }
}
```

## Rule 6: Main thread protection

```kotlin
// ✅ Trace API — mark expensive operations for profiling
suspend fun processData(input: List<Item>): List<ProcessedItem> = withContext(Dispatchers.Default) {
    trace("processData") {               // visible in Android Studio profiler
        input.map { processItem(it) }
    }
}

// ✅ Never block main thread — even for "fast" operations
// ❌ This blocks main for DB read:
val item = runBlocking { itemDao.getById(id) }

// ✅ Suspend from coroutine:
val item = withContext(Dispatchers.IO) { itemDao.getById(id) }
```

## Common Mistakes

❌ Passing `List<T>` to Composable — use `ImmutableList<T>` or wrap in `@Immutable` class
❌ Computing in composition — move to `remember {}` or `derivedStateOf {}`
❌ `isMinifyEnabled = false` in release — leaves dead code in APK
❌ Loading full-resolution images — always size images to display size
❌ Running DB queries on Main thread — always `withContext(Dispatchers.IO)`
❌ No baseline profile — first launch is 40-60% slower without it
