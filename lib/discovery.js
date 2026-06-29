/* PNEUOMA Discovery Engine — browser client (additive, safe to include anywhere) */
(function () {
    'use strict';

    var ANON_KEY = 'pneuoma_discovery_anon_id';
    var SESSION_KEY = 'pneuoma_discovery_session_id';
    var NON_LIVE_APPS = {
        'wrestling-game': true,
        'classroom-sync': true,
        'composer': true,
        'industrial': true,
        'sovereignty': true,
        'games-legacy': true
    };

    function randomId() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
        return 'pd-' + Date.now() + '-' + Math.random().toString(36).slice(2, 11);
    }

    function getAnonymousId() {
        try {
            var id = localStorage.getItem(ANON_KEY);
            if (!id) {
                id = randomId();
                localStorage.setItem(ANON_KEY, id);
            }
            return id;
        } catch (e) {
            return randomId();
        }
    }

    function getSessionId() {
        try {
            var id = sessionStorage.getItem(SESSION_KEY);
            if (!id) {
                id = randomId();
                sessionStorage.setItem(SESSION_KEY, id);
            }
            return id;
        } catch (e) {
            return randomId();
        }
    }

    function getUserId() {
        try {
            var raw = localStorage.getItem('pneuoma_user');
            if (!raw) return undefined;
            var user = JSON.parse(raw);
            return user.id || user.userId || user.email || undefined;
        } catch (e) {
            return undefined;
        }
    }

    function endpoint() {
        if (window.PNEUOMA_DISCOVERY_ENDPOINT) return window.PNEUOMA_DISCOVERY_ENDPOINT;
        if (window.NEXT_PUBLIC_DISCOVERY_ENDPOINT) return window.NEXT_PUBLIC_DISCOVERY_ENDPOINT;
        return 'http://localhost:3000/api/discovery/event';
    }

    function resolveEnvironment(appName) {
        if (NON_LIVE_APPS[appName]) return 'local';
        if (window.PNEUOMA_DISCOVERY_ENVIRONMENT) return window.PNEUOMA_DISCOVERY_ENVIRONMENT;
        if (window.NEXT_PUBLIC_DISCOVERY_ENVIRONMENT) return window.NEXT_PUBLIC_DISCOVERY_ENVIRONMENT;
        var host = window.location.hostname || '';
        if (host === 'pneuoma.com' || host === 'www.pneuoma.com' || host.indexOf('.pneuoma.com') !== -1) {
            return 'production';
        }
        if (host === 'localhost' || host === '127.0.0.1') return 'local';
        return 'staging';
    }

    function detectSource() {
        try {
            var params = new URLSearchParams(window.location.search);
            var utm = params.get('utm_source');
            if (utm) return utm.toLowerCase().replace(/\s+/g, '_');
            var kw = params.get('utm_term') || params.get('keyword');
            if (kw) return 'organic';
            var ref = document.referrer;
            if (!ref) return 'direct';
            var host = new URL(ref).hostname.replace(/^www\./, '').toLowerCase();
            if (host.indexOf('google') !== -1) return 'google';
            if (host.indexOf('instagram') !== -1) return 'instagram';
            if (host.indexOf('tiktok') !== -1) return 'tiktok';
            if (host.indexOf('facebook') !== -1) return 'facebook';
            if (host.indexOf('twitter') !== -1 || host === 't.co' || host === 'x.com') return 'x';
            return host.split('.')[0] || 'referral';
        } catch (e) {
            return 'direct';
        }
    }

    function detectKeyword() {
        try {
            var params = new URLSearchParams(window.location.search);
            return params.get('utm_term') || params.get('q') || params.get('keyword') || undefined;
        } catch (e) {
            return undefined;
        }
    }

    function send(payload) {
        try {
            var url = endpoint();
            var body = JSON.stringify(payload);
            if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
                var blob = new Blob([body], { type: 'application/json' });
                if (navigator.sendBeacon(url, blob)) return;
            }
            fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: body,
                keepalive: true,
                mode: 'cors'
            }).catch(function () {});
        } catch (e) {
            console.debug('[discovery] send failed', e);
        }
    }

    function buildPayload(appName, eventType, metadata) {
        metadata = metadata || {};
        var env = resolveEnvironment(appName);
        var source = metadata.source || detectSource();
        var keyword = metadata.keyword || detectKeyword();
        var userId = metadata.user_id || getUserId();
        var featureUsed =
            metadata.feature_used ||
            metadata.feature ||
            metadata.label ||
            undefined;

        var payload = {
            app_name: appName,
            event_type: eventType,
            anonymous_id: getAnonymousId(),
            session_id: getSessionId(),
            referrer: document.referrer || undefined,
            page_url: metadata.page_url || window.location.href,
            source: source,
            keyword: keyword,
            environment: env,
            is_sample: false,
            timestamp: new Date().toISOString(),
            metadata: metadata
        };

        if (userId) payload.user_id = userId;
        if (featureUsed) payload.feature_used = featureUsed;
        if (metadata.user_question || metadata.question) {
            payload.user_question = metadata.user_question || metadata.question;
        }

        return payload;
    }

    function track(appName, eventType, metadata) {
        try {
            metadata = metadata || {};
            send(buildPayload(appName, eventType, metadata));

            var source = metadata.source || detectSource();
            var keyword = metadata.keyword || detectKeyword();
            var env = resolveEnvironment(appName);

            if (source && eventType === 'page_view') {
                send(buildPayload(appName, 'source_detected', {
                    source: source,
                    keyword: keyword,
                    detected: true,
                    environment: env
                }));
            }
            if (keyword && eventType === 'page_view') {
                send(buildPayload(appName, 'keyword_detected', {
                    source: source,
                    keyword: keyword,
                    detected: true,
                    environment: env
                }));
            }
        } catch (e) {
            console.debug('[discovery] track failed', e);
        }
    }

    function mapGameEvent(gaEvent) {
        if (!gaEvent) return 'feature_used';
        if (gaEvent.indexOf('purchase') !== -1 || gaEvent.indexOf('subscription') !== -1) {
            return 'purchase_completed';
        }
        if (gaEvent.indexOf('trial') !== -1) return 'trial_started';
        if (gaEvent.indexOf('pricing') !== -1) return 'pricing_viewed';
        if (gaEvent.indexOf('session_complete') !== -1 || gaEvent.indexOf('_complete') !== -1) {
            return 'first_value_reached';
        }
        if (
            gaEvent.indexOf('session_start') !== -1 ||
            gaEvent.indexOf('_start') !== -1 ||
            gaEvent.indexOf('game_start') !== -1
        ) {
            return 'session_started';
        }
        if (gaEvent.indexOf('demo') !== -1) return 'demo_started';
        if (gaEvent.indexOf('signup') !== -1 || gaEvent.indexOf('start_free') !== -1) {
            return 'signup_clicked';
        }
        if (gaEvent.indexOf('hero') !== -1 || gaEvent.indexOf('cta_') !== -1) {
            return 'hero_cta_clicked';
        }
        if (gaEvent.indexOf('question') !== -1 || gaEvent.indexOf('ask') !== -1) {
            return 'question_asked';
        }
        if (gaEvent.indexOf('download') !== -1 || gaEvent.indexOf('toolkit') !== -1) {
            return 'feature_used';
        }
        return 'feature_used';
    }

    function dualTrack(appName, gaEvent, metadata) {
        metadata = Object.assign({ ga_event: gaEvent }, metadata || {});
        var eventType = mapGameEvent(gaEvent);

        if (eventType === 'feature_used' && !metadata.feature_used) {
            metadata.feature_used = gaEvent;
        }
        if (eventType === 'first_value_reached' && !metadata.first_value_key) {
            metadata.first_value_key = gaEvent;
        }
        if (eventType === 'session_started' && gaEvent.indexOf('demo') !== -1) {
            track(appName, 'demo_started', metadata);
        }

        track(appName, eventType, metadata);
    }

    function askQuestion(appName, question, metadata) {
        metadata = Object.assign({}, metadata || {}, {
            user_question: question,
            question: question,
            feature_used: (metadata && metadata.feature_used) || 'aura_question'
        });
        track(appName || 'aura', 'question_asked', metadata);
    }

    window.PneuomaDiscovery = {
        track: track,
        mapGameEvent: mapGameEvent,
        dualTrack: dualTrack,
        askQuestion: askQuestion
    };
})();
