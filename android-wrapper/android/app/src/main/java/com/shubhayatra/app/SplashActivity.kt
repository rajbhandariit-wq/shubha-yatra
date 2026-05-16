package com.shubhayatra.app

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.view.WindowCompat

/**
 * SplashActivity — shows the full painted Shubha Yatra splash for SPLASH_DURATION_MS,
 * then launches MainActivity with a cross-fade.
 *
 * Why a custom Activity?
 *   Android 12+'s built-in SplashScreen API only shows a circular icon over a flat
 *   background color. Our brand splash is a full-bleed painted scene (sky, mountains,
 *   route, KTM/PKR pins, wordmark) which the platform API cannot render.
 *
 *   We still call installSplashScreen() so the SHORT system splash (icon for ~200ms)
 *   plays first — that respects Android's launch experience guidelines — then we
 *   draw our full scene on top of it for the brand moment.
 */
class SplashActivity : ComponentActivity() {

    companion object {
        // How long the full painted splash stays on screen.
        // Includes the system splash's ~200ms head start.
        const val SPLASH_DURATION_MS = 2500L
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        // Keep the system splash visible for a beat so the launch feels native.
        val systemSplash = installSplashScreen()
        val startTime = System.currentTimeMillis()
        systemSplash.setKeepOnScreenCondition {
            System.currentTimeMillis() - startTime < 1000L
        }

        super.onCreate(savedInstanceState)

        // Edge-to-edge so the splash art covers the status bar too.
        WindowCompat.setDecorFitsSystemWindows(window, false)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            window.attributes.layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
        }

        setContentView(R.layout.activity_splash)

        // Hand off to the real app after SPLASH_DURATION_MS.
        Handler(Looper.getMainLooper()).postDelayed({
            startActivity(Intent(this, MainActivity::class.java))
            // Crossfade — replace with overridePendingTransition pre-Q if needed.
            overridePendingTransition(R.anim.splash_fade_in, R.anim.splash_fade_out)
            finish()
        }, SPLASH_DURATION_MS)
    }

    // Block back button during splash so users can't escape into a non-existent state.
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() { /* swallow */ }
}
