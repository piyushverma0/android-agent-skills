# Rule: Coil image loading + runtime permission correctness
**Impact:** HIGH

Constrain image requests in Coil and request version-correct storage/media permissions.

```kotlin
// ❌ Wrong — unconstrained image and legacy permission only.
@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun WrongImagePermission(url: String) {
    AsyncImage(model = url, contentDescription = "avatar")
    val state = rememberPermissionState(Manifest.permission.READ_EXTERNAL_STORAGE)
    Button(onClick = state::launchPermissionRequest) { Text("Grant") }
}

// ✅ Correct — constrained request + API-aware permission.
@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun CorrectImagePermission(url: String) {
    AsyncImage(
        model = ImageRequest.Builder(LocalContext.current).data(url).size(128).crossfade(true).build(),
        contentDescription = "Avatar",
        placeholder = painterResource(android.R.drawable.ic_menu_report_image),
        error = painterResource(android.R.drawable.ic_dialog_alert),
        modifier = Modifier.size(64.dp)
    )

    val permission = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        Manifest.permission.READ_MEDIA_IMAGES
    } else {
        Manifest.permission.READ_EXTERNAL_STORAGE
    }
    val state = rememberPermissionState(permission = permission)
    Button(onClick = state::launchPermissionRequest) { Text("Grant image access") }
}
```
