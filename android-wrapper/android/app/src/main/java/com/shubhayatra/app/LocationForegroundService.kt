package com.shubhayatra.app

import android.app.*
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.android.gms.location.*
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

class LocationForegroundService : Service() {

    companion object {
        const val ACTION_START       = "com.shubhayatra.app.ACTION_START"
        const val ACTION_STOP        = "com.shubhayatra.app.ACTION_STOP"
        const val EXTRA_SCHEDULE_ID  = "scheduleId"
        const val EXTRA_TOKEN        = "token"
        const val EXTRA_INTERVAL_MS  = "intervalMs"
        const val CHANNEL_ID         = "sy_location_tracking"
        const val NOTIFICATION_ID    = 1001
        private const val TAG        = "SY_LocationService"
        private const val API_BASE   = "https://shubha-yatra.com/api"
    }

    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private var scheduleId: String? = null
    private var token: String?      = null
    private var intervalMs: Long    = 5 * 60 * 1000L
    private var lastLocation: android.location.Location? = null

    private val executor = Executors.newSingleThreadExecutor()
    private val handler  = Handler(Looper.getMainLooper())
    private var sendRunnable: Runnable? = null

    private val locationCallback = object : LocationCallback() {
        override fun onLocationResult(result: LocationResult) {
            lastLocation = result.lastLocation
            Log.d(TAG, "GPS update: ${result.lastLocation?.latitude}, ${result.lastLocation?.longitude}")
        }
    }

    override fun onCreate() {
        super.onCreate()
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                scheduleId = intent.getStringExtra(EXTRA_SCHEDULE_ID)
                token      = intent.getStringExtra(EXTRA_TOKEN)
                intervalMs = intent.getLongExtra(EXTRA_INTERVAL_MS, 5 * 60 * 1000L)
                showForegroundNotification()
                startLocationUpdates()
                schedulePeriodicSend()
                Log.i(TAG, "Tracking started for schedule $scheduleId, interval ${intervalMs}ms")
            }
            ACTION_STOP -> {
                Log.i(TAG, "Tracking stopped")
                stopSelf()
            }
        }
        return START_STICKY
    }

    private fun showForegroundNotification() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Live Tracking",
                NotificationManager.IMPORTANCE_LOW
            ).apply { description = "Sharing your bus location with passengers" }
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Shubha Yatra — Live Tracking")
            .setContentText("Your location is being shared with passengers")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()

        startForeground(NOTIFICATION_ID, notification)
    }

    private fun startLocationUpdates() {
        val request = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 30_000L)
            .setMinUpdateIntervalMillis(15_000L)
            .build()
        try {
            fusedLocationClient.requestLocationUpdates(request, locationCallback, Looper.getMainLooper())
        } catch (e: SecurityException) {
            Log.e(TAG, "Location permission missing", e)
        }
    }

    private fun schedulePeriodicSend() {
        sendRunnable = object : Runnable {
            override fun run() {
                sendLocationToBackend()
                handler.postDelayed(this, intervalMs)
            }
        }
        // send immediately, then on interval
        handler.postDelayed(sendRunnable!!, 3_000L)
    }

    private fun sendLocationToBackend() {
        val loc = lastLocation ?: run {
            Log.w(TAG, "No location yet, skipping send")
            return
        }
        val sid = scheduleId ?: return
        val tok = token       ?: return

        executor.execute {
            try {
                val url  = URL("$API_BASE/driver/schedules/$sid/location")
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json")
                conn.setRequestProperty("Authorization", "Bearer $tok")
                conn.connectTimeout = 10_000
                conn.readTimeout    = 10_000
                conn.doOutput       = true

                val body = JSONObject().apply {
                    put("lat",      loc.latitude)
                    put("lng",      loc.longitude)
                    put("accuracy", loc.accuracy)
                    put("speed",    if (loc.hasSpeed()) loc.speed else JSONObject.NULL)
                }

                OutputStreamWriter(conn.outputStream).use { it.write(body.toString()) }
                val code = conn.responseCode
                Log.i(TAG, "Location sent → HTTP $code (${loc.latitude}, ${loc.longitude})")
                conn.disconnect()
            } catch (e: Exception) {
                Log.e(TAG, "Failed to send location: ${e.message}")
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        sendRunnable?.let { handler.removeCallbacks(it) }
        fusedLocationClient.removeLocationUpdates(locationCallback)
        executor.shutdown()
        Log.i(TAG, "Service destroyed")
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
