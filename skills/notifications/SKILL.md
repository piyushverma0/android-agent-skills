---
name: notifications
description: |
  Android notifications for AI agents. Use this skill whenever implementing push notifications,
  local notifications, notification channels, FCM (Firebase Cloud Messaging), notification
  styles (BigText, BigPicture, Inbox), notification actions, notification groups,
  notification importance, foreground services with notifications, notification permission
  (Android 13+), deep link from notification, PendingIntent, NotificationCompat,
  WorkManager notifications, or any notification in Android.
---

# Android Notifications

## Rule 1: Always create channels before posting (Android 8+)

```kotlin
// ✅ Channel setup — do this in Application.onCreate()
class MyApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        val channels = listOf(
            NotificationChannelCompat.Builder(
                NotificationChannels.MESSAGES,
                NotificationManagerCompat.IMPORTANCE_HIGH
            ).apply {
                setName("Messages")
                setDescription("Direct messages from other users")
                setVibrationEnabled(true)
                setLightsEnabled(true)
            }.build(),

            NotificationChannelCompat.Builder(
                NotificationChannels.UPDATES,
                NotificationManagerCompat.IMPORTANCE_DEFAULT
            ).apply {
                setName("Updates")
                setDescription("App updates and announcements")
            }.build(),

            NotificationChannelCompat.Builder(
                NotificationChannels.BACKGROUND_SYNC,
                NotificationManagerCompat.IMPORTANCE_MIN
            ).apply {
                setName("Background sync")
                setDescription("Silent background sync status")
            }.build()
        )

        NotificationManagerCompat.from(this).createNotificationChannelsCompat(channels)
    }
}

object NotificationChannels {
    const val MESSAGES = "messages"
    const val UPDATES = "updates"
    const val BACKGROUND_SYNC = "background_sync"
}
```

## Rule 2: NotificationCompat — correct builder pattern

```kotlin
// ✅ Full notification with actions and deep link
class NotificationHelper @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val notificationManager = NotificationManagerCompat.from(context)

    fun showMessageNotification(
        id: Int,
        senderName: String,
        messagePreview: String,
        conversationId: String
    ) {
        // Deep link PendingIntent
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            putExtra("conversation_id", conversationId)
        }
        val pendingIntent = PendingIntent.getActivity(
            context, id, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Reply action
        val replyInput = RemoteInput.Builder("reply_text")
            .setLabel("Reply...")
            .build()
        val replyIntent = Intent(context, NotificationReceiver::class.java).apply {
            action = "REPLY"
            putExtra("notification_id", id)
            putExtra("conversation_id", conversationId)
        }
        val replyPendingIntent = PendingIntent.getBroadcast(
            context, id, replyIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE  // MUTABLE required for RemoteInput
        )
        val replyAction = NotificationCompat.Action.Builder(
            R.drawable.ic_reply, "Reply", replyPendingIntent
        ).addRemoteInput(replyInput).build()

        val notification = NotificationCompat.Builder(context, NotificationChannels.MESSAGES)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(senderName)
            .setContentText(messagePreview)
            .setStyle(NotificationCompat.BigTextStyle().bigText(messagePreview))
            .setContentIntent(pendingIntent)
            .addAction(replyAction)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE)
            .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)  // hide on lock screen
            .build()

        if (ActivityCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS)
            == PackageManager.PERMISSION_GRANTED) {
            notificationManager.notify(id, notification)
        }
    }

    fun cancel(id: Int) = notificationManager.cancel(id)
    fun cancelAll() = notificationManager.cancelAll()
}
```

## Rule 3: Foreground service notification

```kotlin
// ✅ Required notification for foreground services
class DownloadService : Service() {
    private val notificationId = 100

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(notificationId, buildProgressNotification(0))
        return START_STICKY
    }

    fun updateProgress(progress: Int) {
        NotificationManagerCompat.from(this).notify(notificationId, buildProgressNotification(progress))
    }

    private fun buildProgressNotification(progress: Int) =
        NotificationCompat.Builder(this, NotificationChannels.BACKGROUND_SYNC)
            .setSmallIcon(R.drawable.ic_download)
            .setContentTitle("Downloading...")
            .setProgress(100, progress, progress == 0)
            .setOngoing(true)  // can't be dismissed by user
            .setSilent(true)
            .build()
}
```

## Common Mistakes

❌ Not creating channel before posting — notification silently dropped on Android 8+
❌ `FLAG_MUTABLE` on PendingIntent without RemoteInput — security vulnerability
❌ `FLAG_IMMUTABLE` on PendingIntent with RemoteInput — reply won't work
❌ Not checking POST_NOTIFICATIONS permission on Android 13+
❌ Hardcoded notification IDs — use consistent ID per notification type, not random
❌ No `setAutoCancel(true)` — notification stays after user taps it
