# Architecture Decision Guide

Quick reference for common architecture decisions.

---

## Should I add a UseCase?

```
Does the logic appear in 2+ ViewModels?       → YES → Add UseCase
Does it combine 2+ repositories?              → YES → Add UseCase
Is it complex enough to test in isolation?    → YES → Add UseCase
Is it a simple single-repository delegation? → NO  → Skip UseCase
Is it just calling one repository method?    → NO  → Skip UseCase
```

---

## Where does this code belong?

| Code type | Layer | Package |
|---|---|---|
| `@Serializable` data class matching API | data | `data/model/` |
| Pure Kotlin domain model | domain | `domain/model/` |
| Composable with display strings, colors | ui | `ui/screens/feature/` |
| `@Inject` constructor class implementing interface | data | `data/repository/` |
| Interface with no Android imports | domain | `domain/repository/` |
| `@HiltViewModel` | ui | `ui/screens/feature/` |
| `combine(flowA, flowB)` → business result | domain | `domain/usecase/` |
| `combine(flowA, flowB)` → display result | ui ViewModel | `ui/screens/feature/` |
| `enum class Subject` with display names | domain | `domain/model/` |
| `fun Question.toDisplayItem()` | ui | `ui/mapper/` |
| `fun QuestionDto.toDomain()` | data | `data/mapper/` |

---

## ViewModel vs Repository responsibility

| Task | ViewModel | Repository |
|---|---|---|
| Hold StateFlow | ✅ | ❌ |
| Emit SharedFlow events | ✅ | ❌ |
| Enforce business rules (quota check, guard) | ✅ | ❌ |
| Transform domain → UI model | ✅ | ❌ |
| Make network calls | ❌ | ✅ |
| Query database | ❌ | ✅ |
| Handle SDK exceptions | ❌ | ✅ |
| Map DTO → domain model | ❌ | ✅ |
| Run on IO dispatcher | ❌ | ✅ |

---

## Single-module vs Multi-module

| Factor | Single | Multi |
|---|---|---|
| Team size | 1-4 | 5+ |
| Build time | < 2 min | > 3 min (full) |
| Feature reuse across apps | No | Yes |
| Strict team ownership | No | Yes |
| Dynamic delivery needed | No | Yes |

---

## UiState vs SharedFlow Events

| Data type | Where |
|---|---|
| Loading indicator | UiState |
| List of items | UiState |
| Selected tab / mode | UiState |
| Error message currently shown | UiState |
| Navigation destination | SharedFlow |
| Snackbar / Toast | SharedFlow |
| Bottom sheet trigger | SharedFlow |
| System permission request | SharedFlow |
| Vibration / sound trigger | SharedFlow |

---

## Test type by component

| Component | Test type | Framework |
|---|---|---|
| ViewModel | Unit test (JVM) | JUnit5 + Turbine |
| UseCase | Unit test (JVM) | JUnit5 |
| Mapper | Unit test (JVM) | JUnit5 |
| Repository (Room) | Integration (instrumented) | JUnit4 + Room in-memory |
| Repository (network) | Unit test with fake | JUnit5 + Fake |
| Composable | UI test (instrumented) | ComposeTestRule |
| NavGraph | UI test (instrumented) | TestNavHostController |
