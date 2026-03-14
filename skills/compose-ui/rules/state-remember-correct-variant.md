# Use the Correct remember Variant

**Impact: CRITICAL**

Using the wrong `remember` variant causes state loss on rotation, wasted allocations on primitives, or stale UI after process death.

## Rules

```kotlin
// remember {} — survives recomposition, LOST on config change
// Use for: ephemeral UI state (dropdown open/closed, focus)
var expanded by remember { mutableStateOf(false) }

// rememberSaveable {} — survives config change AND process death
// Use for: user input, selected tab, scroll position
var searchQuery by rememberSaveable { mutableStateOf("") }

// Primitive optimizations — always use typed variants, never mutableStateOf<Int>
var count  by remember { mutableIntStateOf(0) }    // ✅ not mutableStateOf<Int>(0)
var score  by remember { mutableFloatStateOf(0f) } // ✅ not mutableStateOf<Float>(0f)
var id     by remember { mutableLongStateOf(0L) }  // ✅ not mutableStateOf<Long>(0L)

// rememberCoroutineScope — launch coroutines from event handlers ONLY, never inline
val scope = rememberCoroutineScope()
Button(onClick = { scope.launch { doWork() } }) { Text("Go") }
```

## Decision Table

| State type | Needs to survive rotation? | Use |
|---|---|---|
| Dropdown open/closed | No | `remember { mutableStateOf() }` |
| Search query text | Yes | `rememberSaveable { mutableStateOf() }` |
| Primitive counter | No | `remember { mutableIntStateOf() }` |
| Scroll position | Yes | `rememberSaveable(stateSaver = ...)` |
| Coroutine scope | N/A | `rememberCoroutineScope()` |

## Anti-Pattern

```kotlin
// ❌ mutableStateOf for Int — boxes on every recomposition
var count by remember { mutableStateOf(0) }

// ❌ remember for user input — lost on rotation
var email by remember { mutableStateOf("") }

// ❌ GlobalScope in composable — leaks, no lifecycle awareness
Button(onClick = { GlobalScope.launch { doWork() } }) { }
```
