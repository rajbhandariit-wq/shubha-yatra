package com.shubhayatra.app;

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    private static final String TAG = "ShubhaYatra";
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Get the actual WebView
        WebView webView = this.bridge.getWebView();
        
        // Enable debugging (already in your config, but good to have)
        WebView.setWebContentsDebuggingEnabled(true);
        
        // Add WebViewClient to monitor loading
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                Log.d(TAG, "Page loaded: " + url);
            }
            
            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                super.onReceivedError(view, errorCode, description, failingUrl);
                Log.e(TAG, "WebView error: " + description + " (Code: " + errorCode + ")");
            }
        });
        
        // Optional: Add WebChromeClient for console logs
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(android.webkit.ConsoleMessage consoleMessage) {
                Log.d(TAG, "Console: " + consoleMessage.message());
                return true;
            }
        });
    }

    @Override
    public void onBackPressed() {
        WebView webView = this.bridge != null ? this.bridge.getWebView() : null;
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}