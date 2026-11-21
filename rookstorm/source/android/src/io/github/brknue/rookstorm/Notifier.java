package io.github.brknue.rookstorm;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/** Native notifications plus a small "already shown" list so the page and the background check never notify twice. */
final class Notifier {
    static final String CHANNEL = "rookstorm";
    static final String PREFS = "rookstorm";

    static SharedPreferences prefs(Context c) { return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }

    static synchronized boolean isSeen(Context c, String key) {
        return Arrays.asList(prefs(c).getString("seen", "").split("\n")).contains(key);
    }

    static synchronized void markSeen(Context c, String key) {
        if (key == null || key.isEmpty() || isSeen(c, key)) return;
        List<String> list = new ArrayList<>(Arrays.asList(prefs(c).getString("seen", "").split("\n")));
        list.removeIf(String::isEmpty);
        list.add(key);
        while (list.size() > 300) list.remove(0);
        prefs(c).edit().putString("seen", String.join("\n", list)).apply();
    }

    static boolean allowed(Context c) {
        return Build.VERSION.SDK_INT < 33 || c.checkSelfPermission("android.permission.POST_NOTIFICATIONS") == PackageManager.PERMISSION_GRANTED;
    }

    static void show(Context c, String key, String title, String body, String hash) {
        markSeen(c, key);
        if (!allowed(c)) return;
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        if (Build.VERSION.SDK_INT >= 26) {
            String name = prefs(c).getString("channelName", "Messages and games");
            NotificationChannel ch = new NotificationChannel(CHANNEL, name, NotificationManager.IMPORTANCE_HIGH);
            nm.createNotificationChannel(ch);
        }
        Intent open = new Intent(Intent.ACTION_VIEW, Uri.parse(MainActivity.HOME + (hash == null ? "" : hash)), c, MainActivity.class);
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pi = PendingIntent.getActivity(c, key.hashCode(), open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(c, CHANNEL) : new Notification.Builder(c);
        b.setSmallIcon(R.drawable.ic_stat)
            .setColor(0xFFE2531F)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new Notification.BigTextStyle().bigText(body))
            .setAutoCancel(true)
            .setOnlyAlertOnce(true)
            .setContentIntent(pi);
        if (Build.VERSION.SDK_INT < 26) b.setPriority(Notification.PRIORITY_HIGH).setDefaults(Notification.DEFAULT_ALL);
        nm.notify(key, 1, b.build());
    }
}
