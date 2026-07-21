/* PNEUOMA — shared Discovery tracking for /games/* experiences */
(function () {
    'use strict';

    var TAXONOMY = {
        product: 'pneuoma',
        surface: 'web',
        experience: 'aura'
    };

    function slugFromPath() {
        var match = window.location.pathname.match(/\/games\/([^\/]+)/);
        return match ? match[1].toLowerCase() : null;
    }

    function withTaxonomy(slug, params) {
        params = params || {};
        return Object.assign({}, TAXONOMY, {
            feature: slug,
            feature_used: params.feature_used || params.feature || slug
        }, params);
    }

    function track(slug, eventType, params) {
        if (!slug || !window.PneuomaDiscovery) return;
        try {
            window.PneuomaDiscovery.track(slug, eventType, withTaxonomy(slug, params));
        } catch (e) {
            console.debug('[game-discovery] track failed', e);
        }
    }

    function create(slug) {
        slug = (slug || slugFromPath() || '').toLowerCase();
        if (!slug) {
            return {
                slug: '',
                track: function () {},
                trackPageView: function () {},
                trackDemoStarted: function () {},
                trackSessionStarted: function () {},
                trackFeatureUsed: function () {},
                trackSessionCompleted: function () {}
            };
        }

        var sessionStarted = false;
        var demoStarted = false;
        var pageViewSent = false;

        var api = {
            slug: slug,
            track: function (eventType, params) {
                track(slug, eventType, params);
            },
            trackPageView: function (params) {
                if (pageViewSent) return;
                pageViewSent = true;
                track(slug, 'page_view', Object.assign({
                    page_path: window.location.pathname,
                    page_url: window.location.href
                }, params || {}));
            },
            trackDemoStarted: function (params) {
                if (demoStarted) return;
                demoStarted = true;
                track(slug, 'demo_started', params);
            },
            trackSessionStarted: function (params) {
                if (sessionStarted) return;
                sessionStarted = true;
                track(slug, 'session_started', params);
                if (!demoStarted) {
                    demoStarted = true;
                    track(slug, 'demo_started', params);
                }
            },
            trackFeatureUsed: function (featureKey, params) {
                track(slug, 'feature_used', Object.assign({
                    feature_used: featureKey || slug
                }, params || {}));
            },
            trackSessionCompleted: function (params) {
                track(slug, 'session_completed', params);
                track(slug, 'first_value_reached', Object.assign({
                    first_value_key: slug + '_complete'
                }, params || {}));
            }
        };

        // Auto-emit page_view once so every game registers a landing signal even
        // if its own script forgets to call trackPageView (idempotent via guard).
        try {
            api.trackPageView();
        } catch (e) {
            console.debug('[game-discovery] auto page_view failed', e);
        }

        return api;
    }

    window.PneuomaGameDiscovery = {
        create: create,
        track: track,
        taxonomy: TAXONOMY
    };
})();
