(function () {
    var toggle = document.querySelector('.nav-toggle');
    var links = document.querySelector('.nav-links');

    if (toggle && links) {
        toggle.addEventListener('click', function () {
            var open = toggle.getAttribute('aria-expanded') === 'true';
            toggle.setAttribute('aria-expanded', String(!open));
            links.classList.toggle('open', !open);
        });

        links.querySelectorAll('a').forEach(function (anchor) {
            anchor.addEventListener('click', function () {
                toggle.setAttribute('aria-expanded', 'false');
                links.classList.remove('open');
            });
        });
    }

    var form = document.getElementById('partner-inquiry');
    if (!form) return;

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        var status = form.querySelector('.c-form-status');
        var data = Object.fromEntries(new FormData(form).entries());
        var email = String(data.email || '').trim();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            status.textContent = 'Enter a valid email so we can reply.';
            return;
        }

        var lines = [
            'Name: ' + (data.name || ''),
            'Email: ' + email,
            'Organization: ' + (data.organization || ''),
            'Interest: ' + (data.interest || ''),
            '',
            data.message || ''
        ].join('\n');
        var mailto = 'mailto:camrynjackson@pneuoma.com?subject=' +
            encodeURIComponent('PNEUOMA partnership inquiry') +
            '&body=' + encodeURIComponent(lines);

        function finish(saved) {
            window.location.href = mailto;
            status.textContent = saved
                ? 'Your email is on file. Your mail app should open with the full note to camrynjackson@pneuoma.com. Send it to finish the inquiry.'
                : 'Your mail app should open with this inquiry to camrynjackson@pneuoma.com. If it does not, send the same note there directly.';
        }

        var endpoint = window.PNEUOMA_LEADS_ENDPOINT;
        if (!endpoint) {
            finish(false);
            return;
        }

        fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                source: 'corporate_partner',
                page: window.location.pathname
            })
        }).then(function (response) {
            finish(response.ok);
        }).catch(function () {
            finish(false);
        });
    });
})();
