(function () {
    var toggle = document.querySelector('.nav-toggle');
    var links = document.querySelector('.nav-links');
    var products = document.querySelector('.nav-products');
    var productsButton = products ? products.querySelector('button') : null;
    var productsPanel = document.getElementById('products-menu');
    var hoverCloseTimer = null;
    var suppressProductClick = false;
    var fineHover = window.matchMedia('(hover: hover) and (pointer: fine)');

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

    function productLinks() {
        return productsPanel ? Array.prototype.slice.call(productsPanel.querySelectorAll('a')) : [];
    }

    function focusProductLink(index) {
        var items = productLinks();
        if (!items.length) return;
        var next = (index + items.length) % items.length;
        items[next].focus();
    }

    if (toggle && links) {
        toggle.addEventListener('click', function () {
            var open = toggle.getAttribute('aria-expanded') === 'true';
            setMenu(!open);
            if (open) setProducts(false);
        });
    }

    if (productsButton) {
        productsButton.addEventListener('click', function () {
            if (suppressProductClick && productsButton.getAttribute('aria-expanded') === 'true') {
                suppressProductClick = false;
                return;
            }
            var open = productsButton.getAttribute('aria-expanded') === 'true';
            setProducts(!open);
        });

        productsButton.addEventListener('keydown', function (event) {
            if (event.key !== 'ArrowDown') return;
            event.preventDefault();
            setProducts(true);
            focusProductLink(0);
        });
    }

    if (products && fineHover.matches) {
        products.addEventListener('mouseenter', function () {
            window.clearTimeout(hoverCloseTimer);
            setProducts(true);
            suppressProductClick = true;
        });
        products.addEventListener('mouseleave', function () {
            window.clearTimeout(hoverCloseTimer);
            hoverCloseTimer = window.setTimeout(function () {
                setProducts(false);
            }, 180);
        });
    }

    if (productsPanel) {
        productsPanel.addEventListener('keydown', function (event) {
            var items = productLinks();
            var index = items.indexOf(document.activeElement);
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                focusProductLink(index < 0 ? 0 : index + 1);
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                if (index <= 0) productsButton.focus();
                else focusProductLink(index - 1);
            } else if (event.key === 'Home') {
                event.preventDefault();
                focusProductLink(0);
            } else if (event.key === 'End') {
                event.preventDefault();
                focusProductLink(items.length - 1);
            }
        });
    }

    document.addEventListener('keydown', function (event) {
        if (event.key !== 'Escape') return;
        var productsOpen = productsButton && productsButton.getAttribute('aria-expanded') === 'true';
        var menuOpen = toggle && toggle.getAttribute('aria-expanded') === 'true';
        setProducts(false);
        if (productsOpen && productsButton) productsButton.focus();
        if (menuOpen) {
            setMenu(false);
            if (toggle) toggle.focus();
        }
    });

    document.addEventListener('click', function (event) {
        if (products && !products.contains(event.target)) setProducts(false);
    });

    if (products) {
        products.addEventListener('focusout', function (event) {
            if (!products.contains(event.relatedTarget)) setProducts(false);
        });
    }

    if (links) {
        links.querySelectorAll('a').forEach(function (anchor) {
            anchor.addEventListener('click', function () {
                setMenu(false);
                setProducts(false);
            });
        });
    }

    function clearCoveredAnchor() {
        if (!location.hash || location.hash === '#') return;
        var id = decodeURIComponent(location.hash.slice(1));
        var target = document.getElementById(id);
        var nav = document.querySelector('body.corporate > .nav, body.corporate header.nav');
        if (!target || !nav) return;
        var top = target.getBoundingClientRect().top;
        if (top >= 0 && top < nav.offsetHeight + 8) target.scrollIntoView();
    }

    window.addEventListener('hashchange', function () {
        window.requestAnimationFrame(clearCoveredAnchor);
    });

    window.addEventListener('pageshow', function () {
        setMenu(false);
        setProducts(false);
        window.requestAnimationFrame(clearCoveredAnchor);
    });

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

    function validEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    function mailtoHref(form, data) {
        var lines = [];
        Object.keys(data).forEach(function (key) {
            if (key === 'message' || key === 'website') return;
            if (!data[key]) return;
            lines.push(key + ': ' + data[key]);
        });
        lines.push('');
        lines.push(data.message || '');
        var subject = form.getAttribute('data-subject') || 'PNEUOMA inquiry';
        return 'mailto:camrynjackson@pneuoma.com?subject=' +
            encodeURIComponent(subject) +
            '&body=' + encodeURIComponent(lines.join('\n'));
    }

    document.querySelectorAll('form.c-inquiry').forEach(function (form) {
        var status = form.querySelector('.c-form-status');
        var button = form.querySelector('button[type="submit"]');
        var fallback = form.querySelector('.c-mail-fallback');

        form.addEventListener('submit', function (event) {
            event.preventDefault();
            var data = Object.fromEntries(new FormData(form).entries());
            var email = String(data.email || '').trim();
            var name = String(data.name || '').trim();
            var message = String(data.message || '').trim();
            var emailField = form.querySelector('[name="email"]');
            var messageField = form.querySelector('[name="message"]');

            if (emailField) emailField.removeAttribute('aria-invalid');
            if (messageField) messageField.removeAttribute('aria-invalid');
            if (fallback) fallback.hidden = true;

            if (!name) {
                status.textContent = 'Enter your name.';
                status.classList.add('is-error');
                return;
            }
            if (!validEmail(email)) {
                status.textContent = 'Enter a valid work email so we can reply.';
                status.classList.add('is-error');
                if (emailField) {
                    emailField.setAttribute('aria-invalid', 'true');
                    emailField.focus();
                }
                return;
            }
            if (message.length < 10) {
                status.textContent = 'Add a short description of the project, at least a sentence.';
                status.classList.add('is-error');
                if (messageField) {
                    messageField.setAttribute('aria-invalid', 'true');
                    messageField.focus();
                }
                return;
            }
            if (String(data.website || '').trim()) {
                status.textContent = 'This inquiry could not be sent.';
                status.classList.add('is-error');
                return;
            }

            var endpoint = window.PNEUOMA_INQUIRY_ENDPOINT;
            var mailto = mailtoHref(form, data);

            function fail(text) {
                status.textContent = text;
                status.classList.add('is-error');
                if (fallback) {
                    fallback.hidden = false;
                    fallback.href = mailto;
                }
            }

            if (!endpoint) {
                fail('The inquiry service is not configured. Your details are still in the form. Email them instead.');
                return;
            }

            if (button) button.disabled = true;
            form.setAttribute('aria-busy', 'true');
            status.classList.remove('is-error');
            status.textContent = 'Sending your inquiry…';

            fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    organization: data.organization || '',
                    industry: data.industry || '',
                    project: data.project || data.interest || '',
                    timeline: data.timeline || '',
                    message: message,
                    source: form.getAttribute('data-source') || 'corporate_inquiry',
                    page: window.location.pathname,
                    website: data.website || ''
                })
            }).then(function (response) {
                return response.json().catch(function () {
                    return {};
                }).then(function (body) {
                    return { ok: response.ok, body: body };
                });
            }).then(function (result) {
                if (!result.ok || !result.body || result.body.accepted !== true) {
                    var reason = (result.body && result.body.error) || 'The server did not accept this inquiry.';
                    fail(reason + ' Your details are still in the form. Email them instead.');
                    return;
                }
                form.reset();
                status.classList.remove('is-error');
                status.textContent = 'Received. PNEUOMA stored this inquiry and will reply at the email you entered. Do not send confidential records.';
            }).catch(function () {
                fail('The inquiry could not be sent. Your details are still in the form. Email them instead.');
            }).then(function () {
                if (button) button.disabled = false;
                form.removeAttribute('aria-busy');
            });
        });
    });
})();
