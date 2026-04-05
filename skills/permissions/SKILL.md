---
name: permissions
description: |
  Android runtime permissions for AI agents. Use this skill whenever requesting permissions,
  handling permission results, camera permission, location permission, microphone permission,
  storage permission, contacts permission, notifications permission, Bluetooth permission,
  ActivityResultLauncher, requestPermissions, shouldShowRequestPermissionRationale,
  Accompanist Permissions, rememberPermissionState, rememberMultiplePermissionsState,
  permission denied handling, permission rationale dialog, or any runtime permission flow.
---

# Android Runtime Permissions

## Rule 1: Always use Accompanist Permissions in Compose

```kotlin
implementation(libs.accompanist.permissions)
```

```kotlin
// ✅ Single permission
@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun CameraScreen() {
    val cameraPermission = rememberPermissionState(Manifest.permission.CAMERA)

    when {
        cameraPermission.status.isGranted -> {
            CameraPreview()
        }
        cameraPermission.status.shouldShowRationale -> {
            PermissionRationale(
                title = "Camera required",
                description = "This feature requires camera access to scan items.",
                onRequest = { cameraPermission.launchPermissionRequest() }
            )
        }
        else -> {
            // First time or permanently denied
            LaunchedEffect(Unit) { cameraPermission.launchPermissionRequest() }
        }
    }
}

// ✅ Multiple permissions
@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun LocationScreen() {
    val locationPermissions = rememberMultiplePermissionsState(
        listOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        )
    )

    when {
        locationPermissions.allPermissionsGranted -> LocationContent()
        locationPermissions.shouldShowRationale -> PermissionRationale(
            title = "Location required",
            description = "We need your location to show nearby items.",
            onRequest = { locationPermissions.launchMultiplePermissionRequest() }
        )
        else -> LaunchedEffect(Unit) { locationPermissions.launchMultiplePermissionRequest() }
    }
}
```

## Rule 2: Rationale dialog — always explain before requesting

```kotlin
// ✅ Standard permission rationale composable
@Composable
fun PermissionRationale(
    title: String,
    description: String,
    onRequest: () -> Unit,
    onDismiss: () -> Unit = {},
    onOpenSettings: (() -> Unit)? = null
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        icon = { Icon(Icons.Default.Info, contentDescription = null) },
        title = { Text(title) },
        text = { Text(description) },
        confirmButton = {
            TextButton(onClick = onRequest) { Text("Grant permission") }
        },
        dismissButton = {
            if (onOpenSettings != null) {
                TextButton(onClick = onOpenSettings) { Text("Open settings") }
            } else {
                TextButton(onClick = onDismiss) { Text("Not now") }
            }
        }
    )
}

// ✅ Open app settings when permanently denied
fun Context.openAppSettings() {
    startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
        data = Uri.fromParts("package", packageName, null)
    })
}
```

## Rule 3: Declare permissions in AndroidManifest

```xml
<!-- Required in AndroidManifest.xml before requesting -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />

<!-- Storage — Android 13+ uses granular permissions -->
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
<!-- Android 12 and below -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
    android:maxSdkVersion="32" />

<!-- Notifications — required for Android 13+ -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<!-- Bluetooth — Android 12+ split permissions -->
<uses-permission android:name="android.permission.BLUETOOTH_SCAN"
    android:usesPermissionFlags="neverForLocation" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
```

## Rule 4: Background location — separate request flow

```kotlin
// ✅ Request foreground location first, then background separately
@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun BackgroundLocationScreen() {
    val foregroundLocation = rememberMultiplePermissionsState(
        listOf(Manifest.permission.ACCESS_FINE_LOCATION)
    )
    val backgroundLocation = rememberPermissionState(
        Manifest.permission.ACCESS_BACKGROUND_LOCATION
    )

    when {
        !foregroundLocation.allPermissionsGranted -> {
            // Step 1: request foreground first
            RequestForegroundLocation(onRequest = { foregroundLocation.launchMultiplePermissionRequest() })
        }
        !backgroundLocation.status.isGranted -> {
            // Step 2: only after foreground granted
            RequestBackgroundLocation(onRequest = { backgroundLocation.launchPermissionRequest() })
        }
        else -> BackgroundLocationContent()
    }
}
```

## Common Mistakes

❌ Requesting permission without rationale — users deny without explanation
❌ Requesting multiple unrelated permissions at once — request only when needed
❌ Not handling permanently denied state — always offer "Open Settings" option
❌ Requesting background location before foreground — Android rejects this
❌ Missing permission in AndroidManifest — request will always be denied
❌ Requesting WRITE_EXTERNAL_STORAGE on Android 10+ — not needed, use scoped storage
