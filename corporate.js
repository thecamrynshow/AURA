(function () {
    var toggle = document.querySelector('.nav-toggle');
    var links = document.querySelector('.nav-links');
    var products = document.querySelector('.nav-products');
    var productsButton = products ? products.querySelector('button') : null;
    var productsPanel = document.getElementById('products-menu');

    function setMenu(open) {
        if (!toggle || !links) return;
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        links.classList.toggle('open', open);
    }

    function setProducts(open) {
        if (!products || !productsButton || !productsPanel) return;
        products.classList.toggle('is-open', open);
        productsButton.setAttribute('aria-expanded', String(open));
        productsPanel.hidden = !open;
    }

    if (toggle && links) {
        toggle.addEventListener('click', function () {
            var open = toggle.getAttribute('aria-expanded') === 'true';
            setMenu(!open);
        });
    }

    if (productsButton) {
        productsButton.addEventListener('click', function () {
            var open = productsButton.getAttribute('aria-expanded') === 'true';
            setProducts(!open);
        });
    }

    document.addEventListener('keydown', function (event) {
        if (event.key !== 'Escape') return;
        setProducts(false);
        setMenu(false);
    });

    document.addEventListener('click', function (event) {
        if (products && !products.contains(event.target)) setProducts(false);
    });

    if (links) {
        links.querySelectorAll('a').forEach(function (anchor) {
            anchor.addEventListener('click', function () {
                setMenu(false);
                setProducts(false);
            });
        });
    }

    document.querySelectorAll('.c-filters').forEach(function (bar) {
        var buttons = bar.querySelectorAll('button[data-filter]');
        var grid = document.getElementById(bar.getAttribute('aria-controls'));
        if (!grid) return;
        buttons.forEach(function (button) {
            button.addEventListener('click', function () {
                var filter = button.getAttribute('data-filter');
                buttons.forEach(function (item) {
                    item.setAttribute('aria-pressed', String(item === button));
                });
                grid.querySelectorAll('[data-cat]').forEach(function (card) {
                    var show = filter === 'all' || card.getAttribute('data-cat') === filter;
                    card.hidden = !show;
                });
            });
        });
    });

    document.querySelectorAll('form.c-inquiry').forEach(function (form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            var status = form.querySelector('.c-form-status');
            var data = Object.fromEntries(new FormData(form).entries());
            var email = String(data.email || '').trim();

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                status.textContent = 'Enter a valid work email so we can reply.';
                return;
            }

            var lines = [];
            Object.keys(data).forEach(function (key) {
                if (key === 'message') return;
                lines.push(key + ': ' + data[key]);
            });
            lines.push('');
            lines.push(data.message || '');
            var subject = form.getAttribute('data-subject') || 'PNEUOMA inquiry';
            var mailto = 'mailto:camrynjackson@pneuoma.com?subject=' +
                encodeURIComponent(subject) +
                '&body=' + encodeURIComponent(lines.join('\n'));

            function finish(saved) {
                window.location.href = mailto;
                status.textContent = saved
                    ? 'Your email is on file. Your mail app should open with the full note to camrynjackson@pneuoma.com. Send it to finish the inquiry. Do not include confidential records in that message.'
                    : 'Your mail app should open with this inquiry to camrynjackson@pneuoma.com. If it does not, send the same note there directly. Do not include confidential records.';
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
                    source: form.getAttribute('data-source') || 'corporate_partner',
                    page: window.location.pathname
                })
            }).then(function (response) {
                if (!response.ok) {
                    finish(false);
                    return;
                }
                finish(true);
            }).catch(function () {
                finish(false);
            });
        });
    });
})();
