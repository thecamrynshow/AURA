/* ============================================
   PNEUOMA — Interactive Resource Play Tracking
   Used on /resources/play/* landing pages with embedded games.
   Depends on conversion.js (PneuomaConvert.track).
   ============================================ */

(function () {
    'use strict';

    var TIME_REPORT_INTERVAL_MS = 30000;
    var startedAt = null;
    var gameId = null;
    var gameUrl = null;
    var timeInterval = null;
    var lastReportedSec = 0;

    function track(eventName, params) {
        params = params || {};
        params.page_path = window.location.pathname;
        if (gameId) params.game_id = gameId;
        if (window.PneuomaConvert && typeof window.PneuomaConvert.track === 'function') {
            window.PneuomaConvert.track(eventName, params);
        } else if (typeof window.gtag === 'function') {
            window.gtag('event', eventName, params);
        } else {
            console.debug('[pc-play] (no gtag) event:', eventName, params);
        }
    }

    function elapsedSeconds() {
        if (!startedAt) return 0;
        return Math.round((Date.now() - startedAt) / 1000);
    }

    function reportTime(reason) {
        var sec = elapsedSeconds();
        if (sec < 1 || sec <= lastReportedSec) return;
        lastReportedSec = sec;
        track('resource_game_time_spent', {
            engagement_time_sec: sec,
            reason: reason || 'interval',
            game_url: gameUrl
        });
    }

    function stopTimer() {
        if (timeInterval) {
            clearInterval(timeInterval);
            timeInterval = null;
        }
        reportTime('session_end');
    }

    function startTimer() {
        startedAt = Date.now();
        lastReportedSec = 0;
        if (timeInterval) clearInterval(timeInterval);
        timeInterval = setInterval(function () {
            reportTime('interval');
        }, TIME_REPORT_INTERVAL_MS);
    }

    function launchEmbed(btn) {
        var wrap = btn.closest('[data-pc-game-embed]');
        if (!wrap || wrap.__pcLaunched) return;
        wrap.__pcLaunched = true;

        gameId = wrap.getAttribute('data-pc-game-id') || '';
        gameUrl = wrap.getAttribute('data-pc-game-url') || '';
        var iframe = wrap.querySelector('.pc-game-iframe');
        var placeholder = wrap.querySelector('.pc-game-placeholder');
        var src = gameUrl + (gameUrl.indexOf('?') > -1 ? '&' : '?') + 'embed=1';

        if (placeholder) placeholder.hidden = true;
        btn.hidden = true;

        if (iframe) {
            iframe.src = src;
            iframe.hidden = false;
        }

        track('resource_game_start', {
            game_url: gameUrl,
            label: gameId
        });
        startTimer();
    }

    function bindLaunchButtons() {
        document.querySelectorAll('[data-pc-game-launch]').forEach(function (btn) {
            if (btn.__pcBound) return;
            btn.__pcBound = true;
            btn.addEventListener('click', function () {
                launchEmbed(btn);
            });
        });
    }

    function init() {
        bindLaunchButtons();
        window.addEventListener('pagehide', stopTimer);
        document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'hidden') reportTime('hidden');
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.PneuomaResourcePlay = { track: track, reportTime: reportTime };
})();
