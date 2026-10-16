/**
 * Validation for public project inquiries.
 * No credentials live here. Storage is handled by db.createInquiry.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value, max) {
    return String(value == null ? '' : value)
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
        .trim()
        .slice(0, max);
}

function validateInquiry(body) {
    const input = body || {};
    if (clean(input.website, 200)) {
        return { ok: false, status: 400, error: 'Could not accept this inquiry' };
    }

    const name = clean(input.name, 120);
    const email = clean(input.email, 200).toLowerCase();
    const organization = clean(input.organization, 160);
    const industry = clean(input.industry, 120);
    const project = clean(input.project || input.interest, 120);
    const timeline = clean(input.timeline, 80);
    const message = clean(input.message, 4000);
    const page = clean(input.page, 300);
    const source = clean(input.source, 80);

    if (!name) return { ok: false, status: 400, error: 'Name is required' };
    if (!EMAIL_RE.test(email)) return { ok: false, status: 400, error: 'A valid email is required' };
    if (message.length < 10) return { ok: false, status: 400, error: 'Add a short project description' };

    return {
        ok: true,
        value: { name, email, organization, industry, project, timeline, message, page, source }
    };
}

module.exports = { validateInquiry };
