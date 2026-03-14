# Always Provide Stable Keys in LazyColumn / LazyRow

**Impact: CRITICAL**

Without stable keys, Compose cannot track individual items across list updates.
Any add/remove/reorder causes the entire visible list to rebind — wasted work,
lost animation state, and broken item animations.

## Rule

Every `items()` call must have a `key` lambda that returns a stable, unique value.

```kotlin
// ✅ Stable key — Compose tracks each item across updates
LazyColumn(
    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
    verticalArrangement = Arrangement.spacedBy(8.dp)
) {
    items(
        items = questions,
        key = { question -> question.id },          // ← stable unique identifier
        contentType = { question -> question.type } // ← optional: improves recycling
    ) { question ->
        QuestionCard(
            question = question,
            onClick = { onQuestionClick(question.id) }
        )
    }

    item(key = "loading_footer") {  // ← named keys for single items too
        if (isLoading) LoadingIndicator(Modifier.fillMaxWidth())
    }
}

// ✅ Animated item placement — works correctly only with stable keys
LazyColumn {
    items(list, key = { it.id }) { item ->
        ItemRow(
            item = item,
            modifier = Modifier.animateItem()  // requires stable key to animate correctly
        )
    }
}
```

## Anti-Patterns

```kotlin
// ❌ No key — full rebind on every list update, animations broken
items(questions) { question -> QuestionCard(question) }

// ❌ Index as key — defeats the purpose (index changes on insert/delete)
items(questions, key = { index, _ -> index }) { question -> QuestionCard(question) }

// ❌ Non-stable key — creates new object on every recomposition
items(questions, key = { it.copy() }) { question -> QuestionCard(question) }
```

## contentType — When to Add

`contentType` tells Compose which item slots can be recycled for which items.
Add it when your list has multiple visually different item types:

```kotlin
sealed interface FeedItem
data class QuestionItem(...) : FeedItem
data class AdItem(...) : FeedItem
data class HeaderItem(...) : FeedItem

items(
    items = feedItems,
    key = { it.id },
    contentType = { item -> item::class }  // Compose recycles only same-type slots
) { item ->
    when (item) {
        is QuestionItem -> QuestionCard(item)
        is AdItem       -> AdBanner(item)
        is HeaderItem   -> SectionHeader(item)
    }
}
```
