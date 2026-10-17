const test = require('node:test');
const assert = require('node:assert');
const { buildInquiryMail, deliverInquiry } = require('./inquiry-mail');

const sample = {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    organization: 'Example Firm',
    industry: 'Legal',
    project: 'Private AI',
    timeline: 'This month',
    message: 'We need an internal search tool for our own documents.',
    page: '/solutions/legal-ai/',
    source: 'legal_ai'
};

test('builds a message the founder can reply to', () => {
    const mail = buildInquiryMail(sample);
    assert.equal(mail.to, 'camrynjackson@pneuoma.com');
    assert.equal(mail.from, 'camrynjackson@pneuoma.com');
    assert.equal(mail.replyTo, 'ada@example.com');
    assert.match(mail.subject, /Ada Lovelace/);
    assert.match(mail.text, /Example Firm/);
    assert.match(mail.text, /internal search tool/);
    assert.doesNotMatch(JSON.stringify(mail), /INQUIRY_SMTP_PASS/);
});

test('does not send when the mailbox password is missing', async () => {
    const previous = process.env.INQUIRY_SMTP_PASS;
    delete process.env.INQUIRY_SMTP_PASS;
    await assert.rejects(
        () => deliverInquiry(sample, { transport: null }),
        (error) => error.code === 'NOT_CONFIGURED'
    );
    if (previous) process.env.INQUIRY_SMTP_PASS = previous;
});

test('sends only after a transport accepts the message', async () => {
    let sent = null;
    const mail = await deliverInquiry(sample, {
        transport: {
            sendMail(message) {
                sent = message;
                return Promise.resolve({ accepted: [message.to] });
            }
        }
    });
    assert.equal(sent.replyTo, 'ada@example.com');
    assert.equal(mail.subject, sent.subject);
});
