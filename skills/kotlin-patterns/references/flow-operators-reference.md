# Flow Operators Reference

Complete Flow operator reference for Android development.

---

## Transformation Operators

| Operator | Use case | Example |
|---|---|---|
| `map` | Transform each value | `.map { it.toDisplayItem() }` |
| `flatMap` | Map to Flow + flatten | Avoid — use flatMapLatest |
| `flatMapLatest` | Cancel previous on new input | Search box, user selection |
| `flatMapMerge` | Concurrent inner flows | Parallel processing |
| `flatMapConcat` | Sequential inner flows | Ordered processing |
| `transform` | Emit multiple values per input | Custom transformation |
| `scan` | Running accumulation | Running total, history |

---

## Filtering Operators

| Operator | Use case | Example |
|---|---|---|
| `filter` | Keep matching values | `.filter { it.isActive }` |
| `filterNot` | Remove matching values | `.filterNot { it.isHidden }` |
| `filterNotNull` | Remove nulls, smart-cast | `.filterNotNull()` |
| `filterIsInstance<T>` | Keep only T instances | `.filterIsInstance<Success>()` |
| `distinctUntilChanged` | Skip repeated values | Prevent redundant recomposition |
| `distinctUntilChangedBy` | Skip by key | `.distinctUntilChangedBy { it.id }` |
| `debounce` | Wait for pause | Search input, 300ms |
| `sample` | Emit at fixed intervals | Rate limiting |
| `throttle` | First emission in window | Click deduplication |
| `take` | Complete after N | `.take(1)` for one-shot |
| `takeWhile` | Complete when predicate fails | Until condition met |
| `drop` | Skip first N | `.drop(1)` skip initial |
| `dropWhile` | Skip until predicate true | Skip loading state |

---

## Combining Operators

| Operator | Behavior | Use case |
|---|---|---|
| `combine` | Emits when EITHER emits | Combining UI state from multiple sources |
| `zip` | Emits when BOTH emit | Pairing request + response |
| `merge` | Interleaves all flows | Multiple event sources |
| `flattenMerge` | Flatten Flow of Flows | Dynamic subscriptions |

---

## Error Handling

```kotlin
// catch — handle error, optionally emit fallback
flow.catch { error ->
    Timber.e(error)
    emit(emptyList())   // fallback value
}

// retry — retry on failure
flow.retry(3) { cause -> cause is IOException }

// retryWhen — retry with delay
flow.retryWhen { cause, attempt ->
    if (cause is IOException && attempt < 3) {
        delay(attempt * 1000L)   // exponential backoff
        true
    } else false
}

// onCompletion — always called, even on cancellation
flow.onCompletion { cause ->
    if (cause == null) Timber.d("Flow completed normally")
    else Timber.e(cause, "Flow completed with error")
}
```

---

## Terminal Operators

```kotlin
// collect — standard collection (suspends until flow completes)
flow.collect { value -> process(value) }

// first / firstOrNull — collect only first value
val first = flow.first()
val firstMatch = flow.firstOrNull { it.isValid() }

// toList / toSet — collect into collection
val list = flow.toList()

// single — collect exactly one value (throws if 0 or 2+)
val only = flow.single()

// last / lastOrNull
val last = flow.last()
```

---

## Context Operators

```kotlin
// flowOn — change upstream dispatcher
flow.flowOn(Dispatchers.IO)    // upstream runs on IO
    .collect { ... }           // collection runs on caller's dispatcher

// buffer — allow upstream to run ahead
flow.buffer(capacity = Channel.BUFFERED)   // buffer 64 items
    .collect { processSlowly(it) }

// conflate — keep only latest, drop intermediates
// useful when processing is slower than emission
flow.conflate().collect { processLatestOnly(it) }
```
