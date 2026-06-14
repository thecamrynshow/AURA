/* ============================================
   PNEUOMA — Conversion Layer (vanilla JS)
   Additive & modular. Safe to remove by deleting the <script> tag.

   Responsibilities:
   1. GA4 event tracking helper (no-op if gtag is absent).
   2. Auto-bind clicks on [data-pc-event] elements -> GA4 events.
   3. Inject an article-bottom CTA band into [data-pc-cta-slot]
      containers (only where the slot exists -> never on games/labs).
   4. Honest email capture: posts to a backend endpoint ONLY if one is
      configured (window.PNEUOMA_LEADS_ENDPOINT). Otherwise falls back
      to a real mailto compose + local save. Never fakes success.
   ============================================ */

(function () {
    'use strict';

    var FOUNDER_EMAIL = 'camrynjackson@pneuoma.com';
    // Root-relative so it works on pneuoma.com and local `http.server` at repo root.
    var LINKS = {
        startFree: '/auth/signup.html',
        pilot: '/platform/schools/pilot-program.html',
        toolkit: '/toolkit/',
        classroomSync: '/platform/multiplayer/classroom-sync/'
    };

    // ---- 1. GA4 tracking helper ----
    function track(eventName, params) {
        params = params || {};
        try {
            if (typeof window.gtag === 'function') {
                window.gtag('event', eventName, params);
            } else {
                console.debug('[pc] (no gtag) event:', eventName, params);
            }
        } catch (e) {
            console.debug('[pc] track error', e);
        }
    }

    // ---- 2. Auto-bind declarative CTA events ----
    function bindEvents() {
        document.querySelectorAll('[data-pc-event]').forEach(function (el) {
            if (el.__pcBound) return;
            el.__pcBound = true;
            el.addEventListener('click', function () {
                track(el.getAttribute('data-pc-event'), {
                    label: el.getAttribute('data-pc-label') || el.textContent.trim().slice(0, 80),
                    page_path: window.location.pathname
                });
            });
        });
    }

    // ---- 3. Article-bottom CTA injection ----
    function ctaBandMarkup() {
        return (
            '<div class="pc-cta-band">' +
            '<h3>Bring calmer transitions to your classroom</h3>' +
            '<p>Start free in minutes, grab the toolkit, or request a school pilot.</p>' +
            '<div class="pc-cta-row">' +
            '<a href="' + LINKS.startFree + '" class="btn btn-primary" data-pc-event="cta_start_free_click" data-pc-label="resource_cta"><span>Start Free</span></a>' +
            '<a href="' + LINKS.toolkit + '" class="btn btn-secondary" data-pc-event="cta_download_toolkit_click" data-pc-label="resource_cta">Download Free Toolkit</a>' +
            '<a href="' + LINKS.pilot + '" class="btn btn-secondary" data-pc-event="cta_request_pilot_click" data-pc-label="resource_cta">Request School Pilot</a>' +
            '</div></div>'
        );
    }

    function injectCtas() {
        document.querySelectorAll('[data-pc-cta-slot]').forEach(function (slot) {
            if (slot.__pcFilled) return;
            slot.__pcFilled = true;
            slot.innerHTML = ctaBandMarkup();
            // Fire a generic resource CTA impression-less click tracker on its buttons
            slot.querySelectorAll('[data-pc-event]').forEach(function (el) {
                el.addEventListener('click', function () {
                    track('resource_cta_click', { page_path: window.location.pathname });
                });
            });
        });
        bindEvents(); // bind any newly-injected [data-pc-event] nodes
    }

    // ---- 4. Email capture (honest, no fake success) ----
    function isValidEmail(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    }

    function setStatus(form, msg, ok) {
        var status = form.querySelector('.pc-form-status');
        if (!status) return;
        status.textContent = msg;
        status.classList.remove('pc-ok', 'pc-err');
        status.classList.add(ok ? 'pc-ok' : 'pc-err');
    }

    function saveLocal(email, source) {
        try {
            var key = 'pneuoma_leads';
            var list = JSON.parse(localStorage.getItem(key) || '[]');
            list.push({ email: email, source: source, at: new Date().toISOString() });
            localStorage.setItem(key, JSON.stringify(list));
        } catch (e) { /* ignore storage failures */ }
    }

    function handleEmailForm(form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var input = form.querySelector('input[type="email"]');
            var email = input ? input.value.trim() : '';
            var source = form.getAttribute('data-pc-source') || window.location.pathname;

            if (!isValidEmail(email)) {
                setStatus(form, 'Please enter a valid email address.', false);
                return;
            }

            track('email_capture_submit', { source: source });
            saveLocal(email, source);

            var endpoint = window.PNEUOMA_LEADS_ENDPOINT;
            if (endpoint) {
                // A real backend endpoint is configured: use it and only
                // report success on a 2xx response.
                setStatus(form, 'Sending…', true);
                fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email, source: source })
                })
                    .then(function (res) {
                        if (res.ok) {
                            setStatus(form, 'You\'re in! Check your inbox for the toolkit link.', true);
                            form.reset();
                        } else {
                            setStatus(form, 'Something went wrong — email ' + FOUNDER_EMAIL + ' and we\'ll send it.', false);
                        }
                    })
                    .catch(function () {
                        setStatus(form, 'Network error — email ' + FOUNDER_EMAIL + ' and we\'ll send it.', false);
                    });
                return;
            }

            // No backend yet: do NOT fake success. Open a real mailto and
            // point the user to the always-free toolkit.
            console.warn(
                '[pc] No lead endpoint configured (window.PNEUOMA_LEADS_ENDPOINT). ' +
                'Email saved locally and a mailto fallback was opened. ' +
                'Recommend adding POST /api/leads on the Render backend to capture leads server-side.'
            );
            var subject = encodeURIComponent('Send me the PNEUOMA Classroom Regulation Toolkit');
            var body = encodeURIComponent(
                'Hi PNEUOMA team,\n\nPlease send me the Free Classroom Regulation Toolkit.\n\nMy email: ' +
                email + '\nFrom page: ' + source + '\n\nThanks!'
            );
            window.location.href = 'mailto:' + FOUNDER_EMAIL + '?subject=' + subject + '&body=' + body;
            setStatus(
                form,
                'Opening your email app to confirm. The toolkit is also free to open right now below.',
                true
            );
        });
    }

    function bindEmailForms() {
        document.querySelectorAll('[data-pc-email-form]').forEach(function (form) {
            if (form.__pcBound) return;
            form.__pcBound = true;
            handleEmailForm(form);
        });
    }

    function init() {
        bindEvents();
        injectCtas();
        bindEmailForms();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose a tiny API for other scripts.
    window.PneuomaConvert = { track: track };
})();
