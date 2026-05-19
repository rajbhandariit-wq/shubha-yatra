// Capacitor native background GPS bridge.
// window.Capacitor is injected by the Android WebView at runtime.
// In a regular browser this module returns false/no-ops so the
// DriverDashboard falls back to the web navigator.geolocation path.

export const isNative = () =>
  typeof window !== 'undefined' &&
  !!window.Capacitor &&
  window.Capacitor.isNativePlatform();

const plugin = () => window.Capacitor?.Plugins?.LocationPlugin;

export const startNativeTracking = (scheduleId, token, intervalMs) => {
  const p = plugin();
  if (!p) return Promise.reject(new Error('LocationPlugin not available'));
  return p.startTracking({ scheduleId, token, intervalMs });
};

export const stopNativeTracking = () => {
  const p = plugin();
  if (!p) return Promise.resolve();
  return p.stopTracking();
};
