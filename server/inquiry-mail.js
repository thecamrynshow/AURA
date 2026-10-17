/**
 * Email a project inquiry to PNEUOMA.
 * The mailbox is Hostinger (mx1.hostinger.com). Sending requires the mailbox
 * password in INQUIRY_SMTP_PASS. The password is never written into the message.
 */

const nodemailer = require('nodemailer');

const DEFAULT_TO = 'camrynjackson@pneuoma.com';

function mailbox() {
    return process.env.INQUIRY_SMTP_USER || DEFAULT_TO;
}

function buildInquiryMail(inquiry) {
    const to = process.env.INQUIRY_TO || DEFAULT_TO;
    const lines = [
        `Name: ${inquiry.name}`,
        `Email: ${inquiry.email}`,
        `Organization: ${inquiry.organization || ''}`,
        `Industry: ${inquiry.industry || ''}`,
        `Project: ${inquiry.project || ''}`,
        `Timeline: ${inquiry.timeline || ''}`,
        `Page: ${inquiry.page || ''}`,
        `Source: ${inquiry.source || ''}`,
        '',
        inquiry.message || ''
    ];
    return {
        from: mailbox(),
        to,
        replyTo: inquiry.email,
        subject: `PNEUOMA inquiry from ${inquiry.name}`,
        text: lines.join('\n')
    };
}

function createTransport() {
    const pass = process.env.INQUIRY_SMTP_PASS;
    if (!pass) return null;
    const port = Number(process.env.INQUIRY_SMTP_PORT || 587);
    return nodemailer.createTransport({
        host: process.env.INQUIRY_SMTP_HOST || 'smtp.hostinger.com',
        port,
        secure: port === 465,
        auth: {
            user: mailbox(),
            pass
        }
    });
}

async function deliverInquiry(inquiry, deps = {}) {
    const transport = deps.transport || createTransport();
    if (!transport) {
        const error = new Error('Inquiry email is not configured');
        error.code = 'NOT_CONFIGURED';
        throw error;
    }
    const mail = buildInquiryMail(inquiry);
    await transport.sendMail(mail);
    return mail;
}

module.exports = {
    buildInquiryMail,
    createTransport,
    deliverInquiry
};
