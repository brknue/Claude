package io.github.brknue.rookstorm;

import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.MediaStore;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/**
 * Rookstorm for Android: the live website in a full-screen WebView.
 * Same site, same matchmaking pools, so app players and website players play each other.
 */
public class MainActivity extends Activity {
    static final String HOME = "https://brknue.github.io/Claude/rookstorm/";
    static final String SITE_PREFIX = "https://brknue.github.io/Claude/rookstorm";
    static final int BG = 0xFF14161B;
    WebView web;

    @Override
    protected void onCreate(Bundle saved) {
        super.onCreate(saved);
        Window w = getWindow();
        w.setStatusBarColor(BG);
        w.setNavigationBarColor(BG);

        web = new WebView(this);
        web.setBackgroundColor(BG);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setUserAgentString(s.getUserAgentString() + " RookstormApp/1");
        web.addJavascriptInterface(new Bridge(), "RookstormAndroid");
        web.setWebChromeClient(new WebChromeClient()); // enables alert/confirm/prompt dialogs
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (u.toString().startsWith(SITE_PREFIX)) return false;
                // Anything else (GitHub, lichess, e-mail ...) opens outside the app.
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) { }
                return true;
            }

            @Override
            public void onReceivedError(WebView v, WebResourceRequest req, WebResourceError err) {
                if (req.isForMainFrame()) v.loadDataWithBaseURL(null, offlinePage(), "text/html", "utf-8", null);
            }
        });
        setContentView(web);

        if (saved != null) web.restoreState(saved);
        else web.loadUrl(startUrl(getIntent()));
    }

    String startUrl(Intent i) {
        Uri d = i == null ? null : i.getData();
        return d != null && d.toString().startsWith(SITE_PREFIX) ? d.toString() : HOME;
    }

    @Override
    protected void onNewIntent(Intent i) {
        super.onNewIntent(i);
        if (i.getData() != null) web.loadUrl(startUrl(i));
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onResume() { super.onResume(); web.onResume(); }

    @Override
    protected void onPause() { web.onPause(); super.onPause(); }

    static String offlinePage() {
        return "<!doctype html><meta name=viewport content='width=device-width,initial-scale=1'>"
            + "<body style='background:#14161b;color:#e8e8ea;font-family:sans-serif;display:flex;flex-direction:column;"
            + "align-items:center;justify-content:center;height:90vh;text-align:center;padding:20px'>"
            + "<div style='font-size:48px'>&#9820;</div><h2>Rookstorm</h2>"
            + "<p>No internet connection. The first start needs internet; after that bots and puzzles work offline.</p>"
            + "<button onclick=\"location.href='" + HOME + "'\" style='font-size:18px;padding:12px 28px;border-radius:10px;"
            + "border:0;background:#f5b83d;color:#14161b;font-weight:bold'>Try again</button></body>";
    }

    /** Small native helpers the website uses when it runs inside the app. */
    class Bridge {
        @JavascriptInterface
        public void share(String title, String text, String url) {
            Intent i = new Intent(Intent.ACTION_SEND);
            i.setType("text/plain");
            String body = (text == null || text.isEmpty()) ? url : (url == null || url.isEmpty() ? text : text + " " + url);
            i.putExtra(Intent.EXTRA_TEXT, body);
            if (title != null) i.putExtra(Intent.EXTRA_SUBJECT, title);
            runOnUiThread(() -> startActivity(Intent.createChooser(i, title)));
        }

        /** Saves a text file to Downloads. Returns true when saved; false means the page should fall back. */
        @JavascriptInterface
        public boolean saveFile(String name, String mime, String content) {
            if (Build.VERSION.SDK_INT < 29) {
                share(name, content, "");
                return true;
            }
            try {
                ContentValues cv = new ContentValues();
                cv.put(MediaStore.Downloads.DISPLAY_NAME, name);
                cv.put(MediaStore.Downloads.MIME_TYPE, mime);
                Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv);
                if (uri == null) return false;
                try (OutputStream o = getContentResolver().openOutputStream(uri)) {
                    o.write(content.getBytes(StandardCharsets.UTF_8));
                }
                return true;
            } catch (Exception e) {
                return false;
            }
        }
    }
}
