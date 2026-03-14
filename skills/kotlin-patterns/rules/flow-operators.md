# Flow Operators — Android-Specific Patterns

**Impact: HIGH**

Wrong operator choice causes memory leaks, missed emissions, or incorrect
behavior. These are the operators used most in Android production code.

## Rule

### Transformation

```kotlin
// map — transform each emission
val displayNames: Flow<List<String>> = users.map { list ->
    list.map { "${it.firstName} ${it.lastName}" }
}

// flatMapLatest — cancel previous inner flow when new value arrives
// ← most important for search — cancels in-flight request when query changes
val searchResults: Flow<List<Question>> = searchQuery
    .debounce(300)
    .flatMapLatest { query ->
        if (query.isBlank()) flowOf(emptyList())
        else repository.searchQuestions(query)
    }

// transform — emit multiple values per input
val expanded: Flow<String> = items.transform { list ->
    list.forEach { emit(it) }
}
```

### Filtering

```kotlin
// filter — emit only matching values
val activeSessions = sessions.filter { it.isActive }

// filterNotNull — remove nulls, smart-cast result
val validUsers: Flow<User> = maybeUsers.filterNotNull()

// distinctUntilChanged — skip repeated equal emissions
// ← prevents redundant recompositions when state hasn't actually changed
val deduplicated = uiState.distinctUntilChanged()
val specificField = uiState.map { it.isLoading }.distinctUntilChanged()

// debounce — wait for pause before emitting (search boxes)
val searchInput = textField.debounce(300)   // wait 300ms after last keystroke

// drop / take — skip or limit emissions
val afterFirst = flow.drop(1)    // skip initial emission
val firstThree = flow.take(3)    // complete after 3 emissions
```

### Combining

```kotlin
// combine — emit whenever EITHER flow emits (most useful for combining state)
val dashboardState: StateFlow<DashboardUiState> = combine(
    repository.observeQuestions(),
    repository.observeUser(),
    repository.observeQuota()
) { questions, user, quota ->
    DashboardUiState(questions = questions, user = user, quota = quota)
}.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), DashboardUiState())

// zip — pair emissions one-to-one (both must emit before result)
val paired: Flow<Pair<A, B>> = flowA.zip(flowB) { a, b -> a to b }

// merge — interleave multiple flows
val allEvents: Flow<Event> = merge(flowA, flowB, flowC)
```

### Error handling

```kotlin
// catch — handle errors in the stream without terminating
repository.observeQuestions()
    .catch { error ->
        Timber.e(error, "Failed to observe questions")
        emit(emptyList())   // emit fallback
    }
    .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

// retry — retry on failure
repository.syncData()
    .retry(3) { cause -> cause is IOException }   // retry only network errors
    .catch { emit(SyncResult.Failed) }

// onEach — side effects without modifying the stream (logging, analytics)
repository.observeQuestions()
    .onEach { questions -> Timber.d("Questions updated: ${questions.size}") }
    .stateIn(...)
```

### Context

```kotlin
// flowOn — change upstream dispatcher without changing collection dispatcher
val questions: Flow<List<Question>> = flow {
    emit(database.getQuestions())   // runs on IO
}.flowOn(Dispatchers.IO)

// buffer — allow upstream to run ahead of downstream
heavyProducer.buffer(capacity = 10).collect { processItem(it) }
```

## Anti-Patterns

```kotlin
// ❌ collect inside launch without cancellation safety — leaks on rotation
viewModelScope.launch {
    flow.collect { ... }   // ❌ if you meant to observe for lifetime, use stateIn instead
}
// ✅ Convert to StateFlow with stateIn for ViewModel lifetime

// ❌ flatMap instead of flatMapLatest for search — old requests complete after new ones
searchQuery.flatMap { query -> repository.search(query) }  // ❌
// ✅ flatMapLatest cancels previous search

// ❌ zip for combining UI state — blocks if one flow stops emitting
combine(flowA, flowB) { a, b -> UiState(a, b) }  // ✅ use combine
flowA.zip(flowB) { a, b -> UiState(a, b) }        // ❌ stops if either stops
```
