# Storage — Upload, Download, Public URLs

**Impact: HIGH**

Wrong storage paths expose other users' files. Missing upsert flag causes
duplicate upload errors. Not reading bytes before upload causes empty files.

## Rule

### 1. Upload image from URI (camera or gallery)

```kotlin
// ✅ Read bytes from URI, then upload with user-scoped path
suspend fun uploadQuestionImage(
    context: Context,
    uri: Uri,
    userId: String
): String = withContext(Dispatchers.IO) {
    val bytes = context.contentResolver
        .openInputStream(uri)
        ?.use { it.readBytes() }
        ?: throw IOException("Failed to read image bytes")

    val mimeType = context.contentResolver.getType(uri) ?: "image/jpeg"
    val extension = when (mimeType) {
        "image/png"  -> "png"
        "image/webp" -> "webp"
        else         -> "jpg"
    }

    // ✅ Always scope path to userId — prevents accessing other users' files
    val path = "users/$userId/${UUID.randomUUID()}.$extension"

    supabase.storage
        .from("question-images")
        .upload(
            path = path,
            data = bytes,
            options = {
                contentType = ContentType(mimeType)
                upsert = false   // ← false = fail on duplicate, true = overwrite
            }
        )

    path   // return path for storing in DB
}
```

### 2. Upload Base64 image (from camera capture)

```kotlin
// ✅ Decode Base64 back to bytes before uploading
suspend fun uploadBase64Image(base64: String, userId: String): String =
    withContext(Dispatchers.IO) {
        val bytes = Base64.decode(base64, Base64.NO_WRAP)
        val path = "users/$userId/${UUID.randomUUID()}.jpg"

        supabase.storage
            .from("question-images")
            .upload(path = path, data = bytes)

        path
    }
```

### 3. Download and get URLs

```kotlin
// ✅ Public URL — for public buckets
val publicUrl = supabase.storage
    .from("question-images")
    .publicUrl("users/$userId/image.jpg")

// ✅ Signed URL — for private buckets (expires after duration)
val signedUrl = supabase.storage
    .from("private-documents")
    .createSignedUrl(
        path = "users/$userId/document.pdf",
        expiresIn = 3600   // seconds
    )

// ✅ Download bytes directly
val bytes = supabase.storage
    .from("question-images")
    .downloadAuthenticated("users/$userId/image.jpg")
```

### 4. Delete

```kotlin
// ✅ Delete single file
supabase.storage
    .from("question-images")
    .delete("users/$userId/image.jpg")

// ✅ Delete multiple files
supabase.storage
    .from("question-images")
    .delete(listOf("users/$userId/img1.jpg", "users/$userId/img2.jpg"))
```

## Anti-Patterns

```kotlin
// ❌ Shared path — one user can overwrite another's file
val path = "images/${UUID.randomUUID()}.jpg"   // ❌ no userId in path
// ✅
val path = "users/$userId/${UUID.randomUUID()}.jpg"

// ❌ Uploading URI directly — URI is not bytes
supabase.storage.from("bucket").upload(path = path, data = uri)  // ❌ type error

// ❌ Storing full URL in database — breaks if bucket URL changes
supabase.from("questions").insert(mapOf("image_url" to fullPublicUrl))  // ❌
// ✅ Store the path, generate URL on demand
supabase.from("questions").insert(mapOf("image_path" to storagePath))
```
