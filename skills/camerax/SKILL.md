---
name: camerax
description: |
  CameraX for Android AI agents. Use this skill whenever implementing camera preview,
  photo capture, video recording, QR/barcode scanning with ML Kit, CameraX lifecycle,
  PreviewView, ImageCapture, ImageAnalysis, VideoCapture, camera permissions, front/back
  camera switching, flash control, zoom, tap-to-focus, CameraX in Compose, camera2 API
  migration, or any camera functionality. Always apply before writing any CameraX code.
---

# CameraX

## Setup

```toml
[versions]
cameraX = "1.3.4"
mlkit-barcode = "17.3.0"
[libraries]
camera-core = { group = "androidx.camera", name = "camera-core", version.ref = "cameraX" }
camera-camera2 = { group = "androidx.camera", name = "camera-camera2", version.ref = "cameraX" }
camera-lifecycle = { group = "androidx.camera", name = "camera-lifecycle", version.ref = "cameraX" }
camera-view = { group = "androidx.camera", name = "camera-view", version.ref = "cameraX" }
camera-video = { group = "androidx.camera", name = "camera-video", version.ref = "cameraX" }
mlkit-barcode = { group = "com.google.mlkit", name = "barcode-scanning", version.ref = "mlkit-barcode" }
```

## Rule 1: CameraX in Compose — AndroidView with PreviewView

```kotlin
@Composable
fun CameraPreviewScreen(onPhotoTaken: (Uri) -> Unit) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val cameraPermission = rememberPermissionState(Manifest.permission.CAMERA)

    if (!cameraPermission.status.isGranted) {
        LaunchedEffect(Unit) { cameraPermission.launchPermissionRequest() }
        return
    }

    var lensFacing by remember { mutableStateOf(CameraSelector.LENS_FACING_BACK) }
    val previewView = remember { PreviewView(context) }
    var imageCapture: ImageCapture? by remember { mutableStateOf(null) }

    LaunchedEffect(lensFacing) {
        val cameraProvider = context.getCameraProvider()
        val preview = Preview.Builder().build().also {
            it.setSurfaceProvider(previewView.surfaceProvider)
        }
        imageCapture = ImageCapture.Builder()
            .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
            .build()

        runCatching {
            cameraProvider.unbindAll()
            cameraProvider.bindToLifecycle(
                lifecycleOwner,
                CameraSelector.Builder().requireLensFacing(lensFacing).build(),
                preview,
                imageCapture
            )
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        AndroidView(
            factory = { previewView },
            modifier = Modifier.fillMaxSize()
        )
        // Controls
        Row(
            modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 32.dp),
            horizontalArrangement = Arrangement.spacedBy(32.dp)
        ) {
            IconButton(onClick = {
                lensFacing = if (lensFacing == CameraSelector.LENS_FACING_BACK)
                    CameraSelector.LENS_FACING_FRONT
                else CameraSelector.LENS_FACING_BACK
            }) {
                Icon(Icons.Default.FlipCameraAndroid, "Flip camera", tint = Color.White)
            }
            FloatingActionButton(onClick = { imageCapture?.takePicture(context, onPhotoTaken) }) {
                Icon(Icons.Default.Camera, "Take photo")
            }
        }
    }
}

// Extension: get CameraProvider as coroutine
suspend fun Context.getCameraProvider(): ProcessCameraProvider =
    suspendCoroutine { cont ->
        ProcessCameraProvider.getInstance(this).also { future ->
            future.addListener({ cont.resume(future.get()) }, ContextCompat.getMainExecutor(this))
        }
    }

// Extension: take picture to file
fun ImageCapture.takePicture(context: Context, onPhotoTaken: (Uri) -> Unit) {
    val file = File(context.cacheDir, "${System.currentTimeMillis()}.jpg")
    val outputOptions = ImageCapture.OutputFileOptions.Builder(file).build()
    takePicture(
        outputOptions,
        ContextCompat.getMainExecutor(context),
        object : ImageCapture.OnImageSavedCallback {
            override fun onImageSaved(output: ImageCapture.OutputFileResults) {
                onPhotoTaken(output.savedUri ?: Uri.fromFile(file))
            }
            override fun onError(exception: ImageCaptureException) {
                Log.e("CameraX", "Photo capture failed", exception)
            }
        }
    )
}
```

## Rule 2: QR/Barcode scanning with ML Kit

```kotlin
@Composable
fun QrScannerScreen(onQrDetected: (String) -> Unit) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val previewView = remember { PreviewView(context) }
    var lastScanned by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        val cameraProvider = context.getCameraProvider()
        val preview = Preview.Builder().build().also {
            it.setSurfaceProvider(previewView.surfaceProvider)
        }
        val barcodeScanner = BarcodeScanning.getClient(
            BarcodeScannerOptions.Builder()
                .setBarcodeFormats(Barcode.FORMAT_QR_CODE, Barcode.FORMAT_ALL_FORMATS)
                .build()
        )
        val imageAnalysis = ImageAnalysis.Builder()
            .setTargetResolution(Size(1280, 720))
            .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
            .build()
            .apply {
                setAnalyzer(ContextCompat.getMainExecutor(context)) { imageProxy ->
                    val mediaImage = imageProxy.image ?: run { imageProxy.close(); return@setAnalyzer }
                    val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
                    barcodeScanner.process(image)
                        .addOnSuccessListener { barcodes ->
                            barcodes.firstOrNull()?.rawValue?.let { value ->
                                if (value != lastScanned) {
                                    lastScanned = value
                                    onQrDetected(value)
                                }
                            }
                        }
                        .addOnCompleteListener { imageProxy.close() }
                }
            }

        cameraProvider.unbindAll()
        cameraProvider.bindToLifecycle(lifecycleOwner, CameraSelector.DEFAULT_BACK_CAMERA, preview, imageAnalysis)
    }

    AndroidView(factory = { previewView }, modifier = Modifier.fillMaxSize())
}
```

## Common Mistakes

❌ Not unbinding camera before rebinding — `cameraProvider.unbindAll()` first
❌ Calling `takePicture` on wrong executor — always use `ContextCompat.getMainExecutor()`
❌ Missing camera permission check before starting preview
❌ Not closing ImageProxy in analyzer — causes camera to freeze
❌ Using deprecated Camera or Camera2 directly — always use CameraX
