# Collections — Kotlin Standard Library Patterns

**Impact: MEDIUM**

Using Java-style loops instead of Kotlin collection functions produces verbose,
error-prone code. These are the collection operations used most in Android.

## Rule

### Transformation

```kotlin
// map — transform every element
val names: List<String> = users.map { it.firstName }
val displayItems = questions.map { it.toDisplayItem() }

// flatMap — flatten nested collections
val allTags: List<String> = questions.flatMap { it.tags }

// mapNotNull — map + filter nulls in one step
val validIds: List<String> = responses.mapNotNull { it.id }   // nulls removed

// groupBy — partition into a Map
val bySubject: Map<String, List<Question>> = questions.groupBy { it.subject }

// associate / associateBy — build a Map
val questionsById: Map<String, Question> = questions.associateBy { it.id }
val idToTitle: Map<String, String> = questions.associate { it.id to it.title }
```

### Filtering

```kotlin
// filter / filterNot
val mathQuestions = questions.filter { it.subject == "Math" }
val notSolved = questions.filterNot { it.isSolved }

// partition — split into two lists in one pass
val (solved, unsolved) = questions.partition { it.isSolved }

// takeWhile / dropWhile
val recentFirst = questions.sortedByDescending { it.createdAt }
val recent = recentFirst.takeWhile { it.isWithinLastWeek() }
```

### Aggregation

```kotlin
// count with predicate
val mathCount = questions.count { it.subject == "Math" }

// sumOf / maxOf / minOf
val totalTime = questions.sumOf { it.expectedTimeSeconds }
val hardest = questions.maxByOrNull { it.difficultyScore }

// any / all / none
val hasErrors = questions.any { it.hasError }
val allSolved = questions.all { it.isSolved }
val noneSkipped = questions.none { it.isSkipped }

// fold / reduce
val summary = questions.fold(StringBuilder()) { acc, q ->
    acc.append("${q.id}: ${q.title}\n")
}.toString()
```

### Safe access

```kotlin
// firstOrNull / lastOrNull — never throws
val first = questions.firstOrNull { it.subject == "Math" }
val last = questions.lastOrNull()

// getOrNull — safe index access
val third = questions.getOrNull(2)   // null if index out of bounds
val third = questions.getOrElse(2) { defaultQuestion }

// distinct / distinctBy
val uniqueSubjects: List<String> = questions.map { it.subject }.distinct()
val uniqueByTitle  = questions.distinctBy { it.title }
```

### Immutable vs mutable

```kotlin
// ✅ Use immutable collections in public APIs and data classes
data class QuestionUiState(
    val questions: List<Question> = emptyList()   // immutable
)

// ✅ Use mutable collections privately during building
val result = mutableListOf<Question>()
questions.forEach { if (it.isValid()) result.add(it) }
val immutableResult: List<Question> = result   // expose as immutable

// ✅ buildList / buildMap — idiomatic collection building
val filtered = buildList {
    if (includeEasy) addAll(questions.filter { it.difficulty == "easy" })
    if (includeMath) addAll(questions.filter { it.subject == "Math" })
}
```

## Anti-Patterns

```kotlin
// ❌ Java-style for loop for transformation
val names = mutableListOf<String>()
for (user in users) { names.add(user.name) }   // ❌ verbose
// ✅
val names = users.map { it.name }

// ❌ Nested filter + map when mapNotNull works
val ids = users.filter { it.id != null }.map { it.id!! }  // ❌ uses !!
// ✅
val ids = users.mapNotNull { it.id }

// ❌ first() without null check — throws NoSuchElementException
val math = questions.first { it.subject == "Math" }   // ❌ crashes if none found
// ✅
val math = questions.firstOrNull { it.subject == "Math" }
```
