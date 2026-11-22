package io.github.brknue.simplechess;

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
 * Simple Chess for Android: the live website in a full-screen WebView.
 * Same site, same matchmaking pools, so app players and website players play each other.
 */
public class MainActivity extends Activity {
    static final String HOME = "https://brknue.github.io/Claude/simplechess/";
    static final String SITE_PREFIX = "https://brknue.github.io/Claude/simplechess";
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
        s.setUserAgentString(s.getUserAgentString() + " SimpleChessApp/1");
        web.addJavascriptInterface(new Bridge(), "SimpleChessAndroid");
        web.setWebChromeClient(new WebChromeClient()); // enables alert/confirm/prompt dialogs
        // downloads (e.g. a newer version of this app) are handed to the browser
        web.setDownloadListener((url, ua, cd, mime, len) -> { try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); } catch (Exception ignored) { } });
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

    static String nowIso() {
        java.text.SimpleDateFormat f = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'+00:00'", java.util.Locale.US);
        f.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
        return f.format(new java.util.Date());
    }

    static String offlinePage() {
        return "<!doctype html><meta name=viewport content='width=device-width,initial-scale=1'>"
            + "<body style='background:#fff;color:#000;font-family:Verdana,Arial,sans-serif;padding:20px'>"
            + "<h2 style='font-family:Times New Roman,serif'>Simple Chess</h2>"
            + "<p>No internet connection. The first start needs internet; after that bots and puzzles work offline.</p>"
            + "<button onclick=\"location.href='" + HOME + "'\" style='font-size:16px;padding:4px 14px;"
            + "border:1px solid #7a7a7a;background:#e9e9e9;color:#000'>Try again</button></body>";
    }

    /** Small native helpers the website uses when it runs inside the app. */
    class Bridge {
        /** version of this app (versionCode) */
        @JavascriptInterface
        public int version() { return 3; }

        /** Show a notification (the page calls this while the app is in the background). */
        @JavascriptInterface
        public void notify(String key, String title, String body, String hash) {
            Notifier.show(MainActivity.this, key, title, body, hash);
        }

        /** The page already showed this news: the background check must not notify it again. */
        @JavascriptInterface
        public void seen(String key) { Notifier.markSeen(MainActivity.this, key); }

        /** Turn background checks on (all values given) or off (empty values). */
        @JavascriptInterface
        public void setBackground(String url, String anonKey, String deviceKey, String stringsJson) {
            android.content.SharedPreferences.Editor e = Notifier.prefs(MainActivity.this).edit();
            if (deviceKey == null || deviceKey.isEmpty()) {
                e.remove("key").remove("since").apply();
                PollJob.cancel(MainActivity.this);
                return;
            }
            String old = Notifier.prefs(MainActivity.this).getString("key", "");
            e.putString("url", url).putString("anon", anonKey).putString("key", deviceKey).putString("strings", stringsJson);
            if (!deviceKey.equals(old)) e.putString("since", nowIso());
            try { e.putString("channelName", new org.json.JSONObject(stringsJson).optString("channel", "Messages and games")); } catch (Exception ignored) { }
            e.apply();
            PollJob.schedule(MainActivity.this);
        }

        /** Android 13+: ask for the notification permission. */
        @JavascriptInterface
        public void requestPermission() {
            if (Build.VERSION.SDK_INT >= 33 && !Notifier.allowed(MainActivity.this))
                runOnUiThread(() -> requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, 1));
        }

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
