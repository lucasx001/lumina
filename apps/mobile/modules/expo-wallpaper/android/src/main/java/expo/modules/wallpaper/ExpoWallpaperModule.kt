package expo.modules.wallpaper

import android.app.WallpaperManager
import android.content.ContentResolver
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileInputStream
import java.io.IOException

class ExpoWallpaperModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoWallpaper")

    AsyncFunction("setWallpaper") { uriString: String, target: String ->
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
        throw UnsupportedOperationException("Setting the lock-screen wallpaper requires Android 7.0 or newer.")
      }

      val context = appContext.reactContext
        ?: throw IllegalStateException("The Android application context is unavailable.")
      val uri = toLocalUri(uriString)
      val bitmap = decodeScaledBitmap(context, uri)

      try {
        WallpaperManager.getInstance(context).setBitmap(bitmap, null, true, wallpaperFlags(target))
      } finally {
        bitmap.recycle()
      }
    }
  }

  private fun toLocalUri(uriString: String): Uri {
    if (uriString.isBlank()) {
      throw IllegalArgumentException("A non-empty local image URI is required.")
    }

    val parsedUri = Uri.parse(uriString)
    return if (parsedUri.scheme == null) Uri.fromFile(File(uriString)) else parsedUri
  }

  private fun wallpaperFlags(target: String): Int = when (target) {
    "home" -> WallpaperManager.FLAG_SYSTEM
    "lock" -> WallpaperManager.FLAG_LOCK
    "both" -> WallpaperManager.FLAG_SYSTEM or WallpaperManager.FLAG_LOCK
    else -> throw IllegalArgumentException("Unsupported wallpaper target: $target")
  }

  private fun decodeScaledBitmap(context: Context, uri: Uri): Bitmap {
    val resolver = context.contentResolver
    val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    decodeStream(resolver, uri, bounds)

    if (bounds.outWidth <= 0 || bounds.outHeight <= 0) {
      throw IOException("The image at $uri could not be decoded.")
    }

    val metrics = context.resources.displayMetrics
    val sampleSize = calculateInSampleSize(bounds.outWidth, bounds.outHeight, metrics.widthPixels, metrics.heightPixels)
    val options = BitmapFactory.Options().apply { inSampleSize = sampleSize }

    return decodeStream(resolver, uri, options)
      ?: throw IOException("The image at $uri could not be decoded.")
  }

  private fun decodeStream(resolver: ContentResolver, uri: Uri, options: BitmapFactory.Options): Bitmap? {
    val input = if (uri.scheme == "file") {
      // ContentResolver.openInputStream does not reliably open file:// URIs on all
      // Android versions. The downloaded wallpaper lives in the app cache, so read
      // it directly when the native module receives a local file URI.
      FileInputStream(uri.path ?: throw IOException("The image at $uri could not be opened."))
    } else {
      resolver.openInputStream(uri)
    }

    if (input == null) {
      throw IOException("The image at $uri could not be opened.")
    }

    // BitmapFactory.decodeStream returns null when inJustDecodeBounds is enabled.
    // That is expected during the first pass, where only the image dimensions are read.
    return input.use { BitmapFactory.decodeStream(it, null, options) }
  }

  private fun calculateInSampleSize(
    sourceWidth: Int,
    sourceHeight: Int,
    targetWidth: Int,
    targetHeight: Int,
  ): Int {
    var sampleSize = 1
    while (sourceWidth / sampleSize > targetWidth * 2 || sourceHeight / sampleSize > targetHeight * 2) {
      sampleSize *= 2
    }
    return sampleSize
  }
}
