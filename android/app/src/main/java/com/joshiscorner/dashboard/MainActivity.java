package com.joshiscorner.dashboard;

import android.app.Activity;
import android.app.PictureInPictureParams;
import android.content.Intent;
import android.content.res.Configuration;
import android.os.Build;
import android.util.Rational;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

/**
 * Joshi's Corner - market dashboard app.
 * A thin shell around the LIVE site https://ssjs1mu.github.io/jcgg-dashboard/ : every change pushed to the repo shows up the next time the
 * app opens - the app itself never needs an update for content.
 *
 * Safety by design:
 *  - only the INTERNET permission; HTTPS only (no cleartext); Google Safe Browsing on; no backup of app data
 *  - no JavaScript-to-app bridge (no addJavascriptInterface); no file / content access from web pages
 *  - only Joshi's Corner pages open inside the app; every other link opens in the phone's browser
 *  - downloads are handed to the browser; nothing is written to the phone's storage by the app
 */
public class MainActivity extends Activity {
    static final String HOST = "ssjs1mu.github.io";
    static final String BASE = "https://" + HOST + "/jcgg-dashboard/";
    static final String[][] TABS = {
            {"📊", "Dashboard", ""}, {"📋", "Watchlist", "watchlist.html"}, {"📅", "Calls", "plan.html"},
            {"🧮", "Pivot", "calculator.html"}, {"🌐", "Movers", "indices.html"}};
    static final int GOLD = 0xFFE0CD96, BAR = 0xFF0B1220, MUTED = 0xFF8A97AD;

    WebView web, splash, tv;
    FrameLayout tvBox;
    boolean tvOn = false;
    float tvFrac = 0.34f;   // docked TV height as a share of the screen
    LinearLayout root;
    FrameLayout stage, fullBox;
    LinearLayout bar;
    View fullView;
    WebChromeClient.CustomViewCallback fullCb;
    final Handler ui = new Handler(Looper.getMainLooper());
    long t0;
    boolean pageReady = false, splashGone = false;
    String lastUrl = BASE;
    long lastBack = 0;

    @Override
    protected void onCreate(Bundle saved) {
        super.onCreate(saved);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON); // market screen: keep awake while open
        t0 = System.currentTimeMillis();

        root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(0xFF060D22);

        stage = new FrameLayout(this);
        root.addView(stage, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));

        web = new WebView(this);
        web.setBackgroundColor(0xFF0E1621);
        setup(web, false);
        stage.addView(web, new FrameLayout.LayoutParams(-1, -1));

        /* docked TV: its own panel between the page and the menu bar - pages above stay fully usable */
        tvBox = new FrameLayout(this);
        tvBox.setBackgroundColor(Color.BLACK);
        tvBox.setVisibility(View.GONE);
        root.addView(tvBox, new LinearLayout.LayoutParams(-1, 0));

        bar = buildBar();
        root.addView(bar, new LinearLayout.LayoutParams(-1, dp(56)));

        fullBox = new FrameLayout(this);
        fullBox.setBackgroundColor(Color.BLACK);
        fullBox.setVisibility(View.GONE);

        FrameLayout top = new FrameLayout(this);
        top.addView(root, new FrameLayout.LayoutParams(-1, -1));
        top.addView(fullBox, new FrameLayout.LayoutParams(-1, -1));

        if (saved == null) {
            splash = new WebView(this);
            splash.setBackgroundColor(0xFF060D22);
            setup(splash, true);
            top.addView(splash, new FrameLayout.LayoutParams(-1, -1));
            splash.loadUrl("file:///android_asset/splash.html");
            web.clearCache(true);              // always start from the latest pages in the repo
            web.loadUrl(BASE + "?app=1");
            ui.postDelayed(this::hideSplash, 12000);   // never keep the splash longer than 12 s
        } else {
            web.restoreState(saved);
            splashGone = true;
        }
        setContentView(top);
    }

    void setup(WebView w, boolean isSplash) {
        WebSettings s = w.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(isSplash);          // only the bundled splash / offline screens use local files
        s.setAllowContentAccess(false);
        s.setAllowFileAccessFromFileURLs(false);
        s.setAllowUniversalAccessFromFileURLs(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setSupportZoom(true);
        s.setBuiltInZoomControls(true);
        s.setDisplayZoomControls(false);
        s.setTextZoom(100);
        s.setSupportMultipleWindows(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setUserAgentString(s.getUserAgentString() + " JoshisCornerApp/1.0");
        if (!isSplash) CookieManager.getInstance().setAcceptThirdPartyCookies(w, true);
        w.setOverScrollMode(View.OVER_SCROLL_NEVER);
        w.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                return route(v, r.getUrl(), r.isForMainFrame());
            }

            @Override
            public void onPageFinished(WebView v, String url) {
                if (v == web && url != null && url.startsWith("https://")) {
                    lastUrl = url;
                    markTab(url);
                    pageReady = true;
                    long left = 3900 - (System.currentTimeMillis() - t0);   // let the tree finish its turn
                    ui.postDelayed(MainActivity.this::hideSplash, Math.max(0, left));
                }
            }

            @Override
            public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
                if (v == web && r.isForMainFrame()) {
                    v.loadUrl("file:///android_asset/offline.html");
                    pageReady = true;
                    hideSplash();
                }
            }
        });
        if (!isSplash) w.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onShowCustomView(View view, CustomViewCallback cb) {   // full-screen video (live TV)
                if (fullView != null) { cb.onCustomViewHidden(); return; }
                fullView = view; fullCb = cb;
                fullBox.addView(view, new FrameLayout.LayoutParams(-1, -1));
                fullBox.setVisibility(View.VISIBLE);
            }

            @Override
            public void onHideCustomView() { exitFull(); }
        });
        if (!isSplash) w.setDownloadListener((url, ua, cd, mime, len) -> openOutside(Uri.parse(url)));
    }

    /** decides where a link opens: our pages inside, the app's own signals, everything else in the phone's browser */
    boolean route(WebView v, Uri u, boolean main) {
        String sc = u.getScheme() == null ? "" : u.getScheme();
        if ("jcapp".equals(sc)) {
            if ("skip".equals(u.getHost())) hideSplash();
            if ("retry".equals(u.getHost())) web.loadUrl(lastUrl);
            if ("pip".equals(u.getHost()) || "tv".equals(u.getHost())) showTv();
            if ("tvclose".equals(u.getHost())) hideTv();
            if ("tvsize".equals(u.getHost())) { tvFrac = tvFrac < 0.3f ? 0.34f : tvFrac < 0.4f ? 0.48f : 0.25f; sizeTv(); }
            if ("tvpip".equals(u.getHost())) enterPip();
            return true;
        }
        if (!main) return false;
        if ("https".equals(sc) && HOST.equalsIgnoreCase(u.getHost()) && u.getPath() != null && u.getPath().startsWith("/jcgg-dashboard")) return false;
        openOutside(u);
        return true;
    }

    void openOutside(Uri u) {
        try {
            String sc = u.getScheme();
            if (!"https".equals(sc) && !"http".equals(sc) && !"mailto".equals(sc) && !"tel".equals(sc) && !"whatsapp".equals(sc)) return; // no odd schemes
            Intent i = new Intent(Intent.ACTION_VIEW, u);
            i.addCategory(Intent.CATEGORY_BROWSABLE);
            startActivity(i);
        } catch (Exception e) {
            Toast.makeText(this, "No app to open this link", Toast.LENGTH_SHORT).show();
        }
    }

    void hideSplash() {
        if (splashGone || splash == null) return;
        if (!pageReady && System.currentTimeMillis() - t0 < 12000) {           // a tap before the page is ready: wait for it
            ui.postDelayed(this::hideSplash, 400);
            return;
        }
        splashGone = true;
        final WebView s = splash;
        s.animate().alpha(0f).setDuration(700).withEndAction(() -> {
            ((ViewGroup) s.getParent()).removeView(s);
            s.destroy();
        }).start();
        splash = null;
    }

    LinearLayout buildBar() {
        LinearLayout b = new LinearLayout(this);
        b.setOrientation(LinearLayout.HORIZONTAL);
        b.setBackgroundColor(BAR);
        b.setElevation(dp(6));
        for (int i = 0; i < TABS.length; i++) b.addView(tab(TABS[i][0], TABS[i][1], BASE + TABS[i][2]), new LinearLayout.LayoutParams(0, -1, 1f));
        TextView r = tab("⟳", "Refresh", null);
        r.setOnClickListener(v -> { web.clearCache(false); web.reload(); });
        b.addView(r, new LinearLayout.LayoutParams(0, -1, 1f));
        return b;
    }

    TextView tab(String icon, String label, final String url) {
        TextView t = new TextView(this);
        t.setText(icon + "\n" + label);
        t.setGravity(Gravity.CENTER);
        t.setTextSize(11);
        t.setTextColor(MUTED);
        t.setTypeface(Typeface.DEFAULT_BOLD);
        t.setLineSpacing(0, 1.05f);
        t.setTag(url);
        t.setBackgroundResource(android.R.drawable.list_selector_background);
        if (url != null) t.setOnClickListener(v -> web.loadUrl(url));
        return t;
    }

    void markTab(String url) {
        String path = Uri.parse(url).getPath();
        String page = path == null ? "" : path.replaceFirst(".*/", "");
        for (int i = 0; i < bar.getChildCount(); i++) {
            TextView t = (TextView) bar.getChildAt(i);
            Object tag = t.getTag();
            if (tag == null) continue;
            String p = ((String) tag).replace(BASE, "");
            boolean on = p.equals(page) || (p.isEmpty() && (page.isEmpty() || page.equals("index.html")));
            t.setTextColor(on ? GOLD : MUTED);
        }
    }

    /** docked TV panel (tv.html in its own web view) */
    void showTv() {
        if (tv == null) {
            tv = new WebView(this);
            tv.setBackgroundColor(Color.BLACK);
            setup(tv, false);
            tvBox.addView(tv, new FrameLayout.LayoutParams(-1, -1));
        }
        if (!tvOn) tv.loadUrl(BASE + "tv.html");
        tvOn = true;
        tvBox.setVisibility(View.VISIBLE);
        sizeTv();
    }

    void hideTv() {
        tvOn = false;
        if (tv != null) { tv.loadUrl("about:blank"); }
        tvBox.setVisibility(View.GONE);
    }

    void sizeTv() {
        if (!tvOn) return;
        int w = getResources().getDisplayMetrics().widthPixels, h = getResources().getDisplayMetrics().heightPixels;
        int want = Math.min(Math.round(w * 9f / 16f), Math.round(h * tvFrac));
        LinearLayout.LayoutParams p = (LinearLayout.LayoutParams) tvBox.getLayoutParams();
        if (inPip()) { p.height = 0; p.weight = 1f; } else { p.height = want; p.weight = 0f; }
        tvBox.setLayoutParams(p);
    }

    @Override
    public void onConfigurationChanged(Configuration c) { super.onConfigurationChanged(c); sizeTv(); }

    /** TV pop-out: Android's own floating window (picture-in-picture), shown over other apps and the home screen */
    void enterPip() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) { Toast.makeText(this, "Pop-out needs Android 7 or newer", Toast.LENGTH_SHORT).show(); return; }
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                enterPictureInPictureMode(new PictureInPictureParams.Builder().setAspectRatio(new Rational(16, 9)).build());
            else enterPictureInPictureMode();
        } catch (Exception e) {
            Toast.makeText(this, "Turn on Picture-in-picture for this app in Android Settings → Apps", Toast.LENGTH_LONG).show();
        }
    }

    boolean inPip() { return Build.VERSION.SDK_INT >= Build.VERSION_CODES.N && isInPictureInPictureMode(); }

    @Override
    protected void onUserLeaveHint() {             // Home pressed while the TV is full screen: keep it playing in the floating window
        super.onUserLeaveHint();
        if (fullView != null || tvOn) enterPip();
    }

    @Override
    public void onPictureInPictureModeChanged(boolean on, Configuration cfg) {
        super.onPictureInPictureModeChanged(on, cfg);
        bar.setVisibility(on ? View.GONE : View.VISIBLE);
        if (tvOn && fullView == null) { stage.setVisibility(on ? View.GONE : View.VISIBLE); sizeTv(); }   // floating window shows only the TV
    }

    void exitFull() {
        if (fullView == null) return;
        fullBox.removeView(fullView);
        fullBox.setVisibility(View.GONE);
        fullView = null;
        if (fullCb != null) fullCb.onCustomViewHidden();
        fullCb = null;
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        if (fullView != null) { exitFull(); return; }
        if (web.canGoBack()) { web.goBack(); return; }
        if (tvOn) { hideTv(); return; }
        long now = System.currentTimeMillis();
        if (now - lastBack < 2000) { super.onBackPressed(); return; }
        lastBack = now;
        Toast.makeText(this, "Press back again to close", Toast.LENGTH_SHORT).show();
    }

    @Override
    protected void onSaveInstanceState(Bundle out) { super.onSaveInstanceState(out); web.saveState(out); }

    @Override
    protected void onResume() { super.onResume(); web.onResume(); if (tv != null) tv.onResume(); }

    @Override
    protected void onPause() { if (!inPip()) { web.onPause(); if (tv != null) tv.onPause(); } super.onPause(); }   // keep the TV running in the floating window

    @Override
    protected void onStop() {                      // app closed / floating window dismissed: stop the stream (no data or sound in the background)
        if (!inPip() && web != null) web.evaluateJavascript("document.querySelectorAll('video').forEach(function(v){v.pause();})", null);
        if (!inPip() && tv != null) tv.evaluateJavascript("document.querySelectorAll('video').forEach(function(v){v.pause();})", null);
        super.onStop();
    }

    @Override
    protected void onDestroy() { if (tv != null) tv.destroy(); if (web != null) web.destroy(); super.onDestroy(); }

    int dp(int v) { return Math.round(v * getResources().getDisplayMetrics().density); }
}
