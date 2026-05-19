package com.shubhayatra.app

import android.Manifest
import android.content.Intent
import android.os.Build
import com.getcapacitor.*
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback

@CapacitorPlugin(
    name = "LocationPlugin",
    permissions = [
        Permission(
            strings = [Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION],
            alias = "location"
        )
    ]
)
class LocationPlugin : Plugin() {

    @PluginMethod
    fun startTracking(call: PluginCall) {
        if (getPermissionState("location") != PermissionState.GRANTED) {
            requestPermissionForAlias("location", call, "locationPermissionCallback")
            return
        }
        doStart(call)
    }

    @PermissionCallback
    private fun locationPermissionCallback(call: PluginCall) {
        if (getPermissionState("location") == PermissionState.GRANTED) {
            doStart(call)
        } else {
            call.reject("Location permission denied by user")
        }
    }

    private fun doStart(call: PluginCall) {
        val scheduleId = call.getString("scheduleId")
            ?: return call.reject("scheduleId is required")
        val token = call.getString("token")
            ?: return call.reject("token is required")
        val intervalMs = call.getLong("intervalMs") ?: (5L * 60 * 1000)

        val intent = Intent(activity, LocationForegroundService::class.java).apply {
            action = LocationForegroundService.ACTION_START
            putExtra(LocationForegroundService.EXTRA_SCHEDULE_ID, scheduleId)
            putExtra(LocationForegroundService.EXTRA_TOKEN, token)
            putExtra(LocationForegroundService.EXTRA_INTERVAL_MS, intervalMs)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            activity.startForegroundService(intent)
        } else {
            activity.startService(intent)
        }
        call.resolve()
    }

    @PluginMethod
    fun stopTracking(call: PluginCall) {
        val intent = Intent(activity, LocationForegroundService::class.java).apply {
            action = LocationForegroundService.ACTION_STOP
        }
        activity.startService(intent)
        call.resolve()
    }
}
