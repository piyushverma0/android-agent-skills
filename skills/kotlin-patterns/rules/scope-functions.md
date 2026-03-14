# Scope Functions — let, run, apply, also, with

**Impact: MEDIUM**

Wrong scope function choice makes code harder to read. Each has one idiomatic use case.

## Rule

```kotlin
// let — transform a value or perform null-safe operations
// Returns: lambda result | Receiver: it
val greeting = user?.let { "Hello, ${it.name}" } ?: "Hello, guest"
listOf(1, 2, 3).let { numbers -> numbers.sum() }   // named parameter for clarity

// run — initialize + return a result (combines let + with)
// Returns: lambda result | Receiver: this
val summary = question.run {
    "$title — $subject (${difficulty})"   // this = question
}

// apply — configure an object during construction
// Returns: receiver | Receiver: this
val intent = Intent(context, MainActivity::class.java).apply {
    putExtra("user_id", userId)
    putExtra("question_id", questionId)
    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
}

// also — side effects without interrupting a chain
// Returns: receiver | Receiver: it
val questions = repository.getQuestions()
    .also { list -> Timber.d("Loaded ${list.size} questions") }   // logging, analytics
    .filter { it.isActive }

// with — multiple operations on an existing object (not for nullable)
// Returns: lambda result | Receiver: this
val displayText = with(question) {
    buildString {
        append(title)
        append(" — ")
        append(subject)
        if (difficulty != null) append(" ($difficulty)")
    }
}
```

## Decision table

| Function | Use for | Returns | Receiver |
|---|---|---|---|
| `let` | Null check + transform | Lambda result | `it` |
| `run` | Init + compute result | Lambda result | `this` |
| `apply` | Object configuration | The object | `this` |
| `also` | Side effects in a chain | The object | `it` |
| `with` | Multiple calls on object | Lambda result | `this` |

## Anti-Patterns

```kotlin
// ❌ Nested scope functions — hard to read, unclear which 'it' is which
user?.let {
    it.address?.let {
        it.city?.let {
            println(it)   // ❌ which 'it'?
        }
    }
}
// ✅ Use safe call chain or named parameters
val city = user?.address?.city
city?.let { Timber.d("City: $it") }

// ❌ apply when let is needed (apply doesn't return a new value)
val name = user.apply { name = "Alice" }   // ❌ returns user, not name
// ✅
val name = user.let { it.name }

// ❌ with on nullable — throws NPE
with(nullableUser) { ... }   // ❌ crashes if nullableUser is null
// ✅
nullableUser?.let { with(it) { ... } }
```
