package io.github.brknue.simplechess;

import android.app.job.JobInfo;
import android.app.job.JobParameters;
import android.app.job.JobScheduler;
import android.app.job.JobService;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * Background check (about every 15 minutes, only with a network) for new messages, challenges and
 * daily-game moves while the app is closed. Uses a per-device key, never the sign-in session.
 */
public class PollJob extends JobService {
    static final int JOB_ID = 7;

    static void schedule(Context c) {
        JobScheduler js = (JobScheduler) c.getSystemService(Context.JOB_SCHEDULER_SERVICE);
        if (js == null) return;
        for (JobInfo j : js.getAllPendingJobs()) if (j.getId() == JOB_ID) return;
        js.schedule(new JobInfo.Builder(JOB_ID, new ComponentName(c, PollJob.class))
            .setPeriodic(15 * 60 * 1000L)
            .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY)
            .setPersisted(true)
            .build());
    }

    static void cancel(Context c) {
        JobScheduler js = (JobScheduler) c.getSystemService(Context.JOB_SCHEDULER_SERVICE);
        if (js != null) js.cancel(JOB_ID);
    }

    @Override
    public boolean onStartJob(JobParameters params) {
        new Thread(() -> {
            try { poll(getApplicationContext()); } catch (Exception ignored) { }
            jobFinished(params, false);
        }).start();
        return true;
    }

    @Override
    public boolean onStopJob(JobParameters params) { return true; }

    static void poll(Context c) throws Exception {
        SharedPreferences p = Notifier.prefs(c);
        String base = p.getString("url", ""), anon = p.getString("anon", ""), key = p.getString("key", "");
        if (base.isEmpty() || key.isEmpty()) { cancel(c); return; }
        String since = p.getString("since", "");
        JSONObject req = new JSONObject();
        req.put("p_key", key);
        req.put("p_since", since.isEmpty() ? JSONObject.NULL : since);
        HttpURLConnection con = (HttpURLConnection) new URL(base + "/rest/v1/rpc/notify_poll").openConnection();
        con.setConnectTimeout(15000);
        con.setReadTimeout(20000);
        con.setRequestMethod("POST");
        con.setDoOutput(true);
        con.setRequestProperty("apikey", anon);
        con.setRequestProperty("Content-Type", "application/json");
        try (OutputStream o = con.getOutputStream()) { o.write(req.toString().getBytes(StandardCharsets.UTF_8)); }
        if (con.getResponseCode() != 200) return;
        String text;
        try (InputStream in = con.getInputStream(); ByteArrayOutputStream bo = new ByteArrayOutputStream()) {
            byte[] buf = new byte[8192]; int n;
            while ((n = in.read(buf)) > 0) bo.write(buf, 0, n);
            text = bo.toString("UTF-8");
        }
        if (text.trim().equals("null")) { // key no longer valid (signed out elsewhere or deleted)
            p.edit().remove("key").apply();
            cancel(c);
            return;
        }
        JSONObject res = new JSONObject(text);
        JSONArray items = res.optJSONArray("items");
        JSONObject s = new JSONObject(p.getString("strings", "{}"));
        String newest = since;
        if (items != null) for (int i = 0; i < items.length(); i++) {
            JSONObject a = items.getJSONObject(i);
            String at = a.optString("at", "");
            if (at.compareTo(newest) > 0) newest = at;
            String k = a.optString("key", "");
            if (k.isEmpty() || Notifier.isSeen(c, k)) continue;
            String[] tx = text(a, s);
            Notifier.show(c, k, tx[0], tx[1], tx[2]);
        }
        if (!newest.equals(since)) p.edit().putString("since", newest).apply();
    }

    static String str(JSONObject s, String k, String def) { return s.optString(k, def); }
    static String fmt(String tpl, String v) { return tpl.replace("{0}", v); }

    /** Same texts as alertText() in src/notify.ts. Returns {title, body, url hash}. */
    static String[] text(JSONObject a, JSONObject s) {
        String from = a.optString("from", "");
        String type = a.optString("type", "");
        String game = a.optString("game", "");
        switch (type) {
            case "message": {
                String body = a.optString("text", "");
                return new String[]{from, body.isEmpty() ? str(s, "sentGame", "sent you a game") : body, "#/chat/" + Uri.encode(from)};
            }
            case "challenge":
                return new String[]{fmt(str(s, "challenged", "{0} challenged you"), from), a.optDouble("base", 0) > 0 ? trim(a.optDouble("base", 0)) + " + " + a.optInt("inc", 0) : "∞", "#/friends"};
            case "daily_invite":
                return new String[]{fmt(str(s, "invited", "{0} invited you to a daily game"), from), str(s, "tapAccept", "Tap to accept or decline."), "#/daily"};
            case "daily_draw":
                return new String[]{fmt(str(s, "draw", "{0} offers a draw"), from), str(s, "daily", "Daily game"), "#/daily/" + game};
            case "daily_end": {
                String body = a.isNull("won") ? ("1/2-1/2".equals(a.optString("result")) ? str(s, "drawn", "Draw") : str(s, "over", "Game over"))
                    : a.optBoolean("won") ? str(s, "won", "You won") : str(s, "lost", "You lost");
                return new String[]{fmt(str(s, "ended", "Your daily game against {0} ended"), from), body, "#/daily/" + game};
            }
            default:
                return new String[]{fmt(a.optInt("n", 1) > 0 ? str(s, "moved", "{0} moved in your daily game") : str(s, "accepted", "{0} accepted your daily game"), from),
                    str(s, "yourMove", "Your move"), "#/daily/" + game};
        }
    }

    static String trim(double d) { return d == Math.floor(d) ? String.valueOf((long) d) : String.valueOf(d); }

    // android.net.Uri is used only for encoding the username in the link
    static final class Uri { static String encode(String s) { return android.net.Uri.encode(s); } }
}
