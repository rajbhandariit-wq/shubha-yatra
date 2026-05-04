package com.shubhayatra.app;

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebStorage;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Clear WebView cache
        WebView webView = new WebView(this);
        webView.clearCache(true);
        webView.clearHistory();
        WebStorage.getInstance().deleteAllData();
    }
}