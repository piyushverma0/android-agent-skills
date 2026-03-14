# Image Loading with Coil and Runtime Permissions

**Impact: HIGH**

Wrong image loading causes OOM crashes, broken placeholders, and memory leaks.
Wrong permissions handling causes crashes on Android 6+ and breaks camera/gallery features.

## Rules

### Image Loading with Coil

```kotlin
// build.gradle.kts
implementation("io.coil-kt.coil3:coil-compose:3.0.0")
implementation("io.coil-kt.coil3:coil-network-okhttp:3.0.0")
```

```kotlin
// ✅ AsyncImage — standard remote image loading
AsyncImage(
    model = ImageRequest.Builder(LocalContext.current)
        .data(imageUrl)
        .crossfade(true)                     // ← smooth fade-in
        .size(Size.ORIGINAL)                 // or specific size for memory efficiency
        .build(),
    contentDescription = stringResource(R.string.cd_question_image),
    contentScale = ContentScale.Crop,
    placeholder = painterResource(R.drawable.img_placeholder),
    error = painterResource(R.drawable.img_error),
    modifier = Modifier
        .fillMaxWidth()
        .aspectRatio(16f / 9f)
        .clip(RoundedCornerShape(12.dp))
)

// ✅ Specify target size to avoid loading a 4K image for a 64dp thumbnail
AsyncImage(
    model = ImageRequest.Builder(LocalContext.current)
        .data(user.avatarUrl)
        .crossfade(200)
        .size(128, 128)                      // ← load only what you display
        .transformations(CircleCropTransformation())  // ← circular avatar
        .build(),
    contentDescription = stringResource(R.string.cd_user_avatar, user.name),
    modifier = Modifier.size(40.dp).clip(CircleShape)
)
```

### Base64 images (camera capture)

```kotlin
// ✅ Display captured/local Base64 image efficiently
val bitmap = remember(base64String) {
    val bytes = Base64.decode(base64String, Base64.DEFAULT)
    BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
}

Image(
    bitmap = bitmap.asImageBitmap(),
    contentDescription = stringResource(R.string.cd_captured_question),
    contentScale = ContentScale.Crop,
    modifier = Modifier
        .fillMaxWidth()
        .aspectRatio(4f / 3f)
        .clip(RoundedCornerShape(12.dp))
)
```

### Runtime Permissions with Accompanist

```kotlin
// build.gradle.kts
implementation("com.google.accompanist:accompanist-permissions:0.36.0")
```

```kotlin
// ✅ Single permission — camera
@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun CameraSection() {
    val cameraPermissionState = rememberPermissionState(Manifest.permission.CAMERA)

    when {
        cameraPermissionState.status.isGranted -> {
            CameraPreview()
        }
        cameraPermissionState.status.shouldShowRationale -> {
            // User denied once — explain WHY before requesting again
            PermissionRationaleCard(
                message = "Camera access is needed to scan exam questions",
                onRequest = { cameraPermissionState.launchPermissionRequest() }
            )
        }
        else -> {
            // First request or permanently denied
            PermissionRequestCard(
                message = "Grant camera permission to scan questions",
                onRequest = { cameraPermissionState.launchPermissionRequest() }
            )
        }
    }
}

// ✅ Multiple permissions — camera + storage
@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun MediaSection() {
    val permissions = rememberMultiplePermissionsState(
        permissions = buildList {
            add(Manifest.permission.CAMERA)
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
                add(Manifest.permission.READ_EXTERNAL_STORAGE)  // ← API < 33 only
            } else {
                add(Manifest.permission.READ_MEDIA_IMAGES)      // ← API 33+
            }
        }
    )

    if (permissions.allPermissionsGranted) {
        MediaPickerContent()
    } else {
        PermissionRequestCard(
            message = "Camera and gallery access required",
            onRequest = { permissions.launchMultiplePermissionRequest() }
        )
    }
}
```

### Permission best practices

```kotlin
// ✅ Never request permissions on app launch — request when the user needs them
// ✅ Always show rationale when shouldShowRationale = true
// ✅ Handle permanently denied — direct user to Settings
@Composable
fun PermanentlyDeniedState() {
    val context = LocalContext.current
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text("Camera permission permanently denied")
        Spacer(Modifier.height(16.dp))
        Button(onClick = {
            // Direct to app settings
            context.startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                data = Uri.fromParts("package", context.packageName, null)
            })
        }) { Text("Open Settings") }
    }
}
```

## Anti-Patterns

```kotlin
// ❌ Loading full-resolution image for thumbnail — OOM crash
AsyncImage(model = highRes4KImageUrl, ...)  // ❌ no size constraint for 40dp thumbnail

// ❌ No error/placeholder state — broken image shows on slow/failed load
AsyncImage(model = url, contentDescription = null)  // ❌ no placeholder or error

// ❌ Requesting camera permission on app launch before user does anything
LaunchedEffect(Unit) {
    cameraPermissionState.launchPermissionRequest()  // ❌ Android may auto-deny
}

// ❌ Using deprecated READ_EXTERNAL_STORAGE on Android 13+
Manifest.permission.READ_EXTERNAL_STORAGE  // ❌ on API 33+, use READ_MEDIA_IMAGES
```
