/**
 * PNEUOMA Persistence Layer
 * ----------------------------------------------------------------------------
 * SQLite (better-sqlite3) adapter for users, subscriptions, and leads.
 *
 * IMPORTANT (Render deployment): SQLite writes to a file on local disk. Render's
 * default filesystem is EPHEMERAL — it is wiped on every deploy and on cold
 * start. For durable paid-membership data you MUST either:
 *   (a) attach a Render Persistent Disk and point SQLITE_DB_PATH at it
 *       (e.g. /var/data/pneuoma.db), OR
 *   (b) migrate this module to Render Postgres (recommended at scale).
 *
 * This module is intentionally the single seam for storage, so swapping SQLite
 * for Postgres later means rewriting only this file.
 *
 * Timestamps: created_at/updated_at/last_login are epoch milliseconds.
 * Stripe period fields (current_period_*, trial_end, canceled_at) are stored as
 * epoch SECONDS to match Stripe's representation exactly.
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const DB_PATH =
    process.env.SQLITE_DB_PATH || path.join(__dirname, 'data', 'pneuoma.db');

const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id            TEXT PRIMARY KEY,
        email         TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        first_name    TEXT,
        last_name     TEXT,
        account_type  TEXT DEFAULT 'individual',
        role          TEXT DEFAULT 'user',
        created_at    INTEGER NOT NULL,
        updated_at    INTEGER NOT NULL,
        last_login    INTEGER
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
        user_id                TEXT PRIMARY KEY,
        stripe_customer_id     TEXT,
        stripe_subscription_id TEXT,
        subscription_status    TEXT DEFAULT 'none',
        price_id               TEXT,
        plan_name              TEXT,
        current_period_start   INTEGER,
        current_period_end     INTEGER,
        trial_end              INTEGER,
        cancel_at_period_end   INTEGER DEFAULT 0,
        canceled_at            INTEGER,
        created_at             INTEGER NOT NULL,
        updated_at             INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_sub_customer
        ON subscriptions (stripe_customer_id);
    CREATE INDEX IF NOT EXISTS idx_sub_subscription
        ON subscriptions (stripe_subscription_id);

    CREATE TABLE IF NOT EXISTS leads (
        id         TEXT PRIMARY KEY,
        email      TEXT NOT NULL,
        source     TEXT,
        page       TEXT,
        ip         TEXT,
        user_agent TEXT,
        created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_leads_ip ON leads (ip, created_at);
`);

function genId(prefix) {
    return `${prefix}_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
}

// ==================== USERS ====================

function createUser({ email, passwordHash, firstName, lastName, accountType, role }) {
    const now = Date.now();
    const id = genId('user');
    db.prepare(`
        INSERT INTO users
            (id, email, password_hash, first_name, last_name, account_type, role, created_at, updated_at, last_login)
        VALUES
            (@id, @email, @password_hash, @first_name, @last_name, @account_type, @role, @created_at, @updated_at, @last_login)
    `).run({
        id,
        email: email.toLowerCase(),
        password_hash: passwordHash || null,
        first_name: firstName || null,
        last_name: lastName || null,
        account_type: accountType || 'individual',
        role: role || 'user',
        created_at: now,
        updated_at: now,
        last_login: now
    });
    return findUserById(id);
}

function findUserByEmail(email) {
    if (!email) return null;
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) || null;
}

function findUserById(id) {
    if (!id) return null;
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id) || null;
}

const USER_UPDATABLE = ['email', 'password_hash', 'first_name', 'last_name', 'account_type', 'role', 'last_login'];

function updateUser(id, fields) {
    const keys = Object.keys(fields).filter((k) => USER_UPDATABLE.includes(k));
    if (keys.length === 0) return findUserById(id);
    const setSql = keys.map((k) => `${k} = @${k}`).join(', ');
    const params = { id, updated_at: Date.now() };
    keys.forEach((k) => { params[k] = fields[k]; });
    db.prepare(`UPDATE users SET ${setSql}, updated_at = @updated_at WHERE id = @id`).run(params);
    return findUserById(id);
}

function verifyPassword(user, plainPassword) {
    if (!user || !user.password_hash) return false;
    try {
        return bcrypt.compareSync(plainPassword, user.password_hash);
    } catch (e) {
        return false;
    }
}

// ==================== SUBSCRIPTIONS ====================

function findSubscriptionByUserId(userId) {
    if (!userId) return null;
    return db.prepare('SELECT * FROM subscriptions WHERE user_id = ?').get(userId) || null;
}

function findSubscriptionByStripeCustomerId(customerId) {
    if (!customerId) return null;
    return db.prepare('SELECT * FROM subscriptions WHERE stripe_customer_id = ?').get(customerId) || null;
}

function findSubscriptionByStripeSubscriptionId(subscriptionId) {
    if (!subscriptionId) return null;
    return db.prepare('SELECT * FROM subscriptions WHERE stripe_subscription_id = ?').get(subscriptionId) || null;
}

/**
 * Insert or update the subscription row for a user. Only provided fields are
 * written; omitted fields keep their existing values.
 */
function upsertSubscription(userId, data) {
    const now = Date.now();
    const existing = findSubscriptionByUserId(userId);
    const merged = {
        user_id: userId,
        stripe_customer_id: data.stripe_customer_id ?? existing?.stripe_customer_id ?? null,
        stripe_subscription_id: data.stripe_subscription_id ?? existing?.stripe_subscription_id ?? null,
        subscription_status: data.subscription_status ?? existing?.subscription_status ?? 'none',
        price_id: data.price_id ?? existing?.price_id ?? null,
        plan_name: data.plan_name ?? existing?.plan_name ?? null,
        current_period_start: data.current_period_start ?? existing?.current_period_start ?? null,
        current_period_end: data.current_period_end ?? existing?.current_period_end ?? null,
        trial_end: data.trial_end ?? existing?.trial_end ?? null,
        cancel_at_period_end: (data.cancel_at_period_end ?? existing?.cancel_at_period_end ?? 0) ? 1 : 0,
        canceled_at: data.canceled_at ?? existing?.canceled_at ?? null,
        created_at: existing?.created_at ?? now,
        updated_at: now
    };
    db.prepare(`
        INSERT INTO subscriptions
            (user_id, stripe_customer_id, stripe_subscription_id, subscription_status, price_id, plan_name,
             current_period_start, current_period_end, trial_end, cancel_at_period_end, canceled_at, created_at, updated_at)
        VALUES
            (@user_id, @stripe_customer_id, @stripe_subscription_id, @subscription_status, @price_id, @plan_name,
             @current_period_start, @current_period_end, @trial_end, @cancel_at_period_end, @canceled_at, @created_at, @updated_at)
        ON CONFLICT(user_id) DO UPDATE SET
            stripe_customer_id     = excluded.stripe_customer_id,
            stripe_subscription_id = excluded.stripe_subscription_id,
            subscription_status    = excluded.subscription_status,
            price_id               = excluded.price_id,
            plan_name              = excluded.plan_name,
            current_period_start   = excluded.current_period_start,
            current_period_end     = excluded.current_period_end,
            trial_end              = excluded.trial_end,
            cancel_at_period_end   = excluded.cancel_at_period_end,
            canceled_at            = excluded.canceled_at,
            updated_at             = excluded.updated_at
    `).run(merged);
    return findSubscriptionByUserId(userId);
}

function markSubscriptionActive(userId) {
    return upsertSubscription(userId, { subscription_status: 'active' });
}

function markSubscriptionPastDue(userId) {
    return upsertSubscription(userId, { subscription_status: 'past_due' });
}

function markSubscriptionCanceled(userId, canceledAtSeconds) {
    return upsertSubscription(userId, {
        subscription_status: 'canceled',
        canceled_at: canceledAtSeconds || Math.floor(Date.now() / 1000),
        cancel_at_period_end: 0
    });
}

/**
 * Map a Stripe Subscription object into our subscription row. planName should be
 * resolved by the caller from the price id (the caller owns the price->plan map).
 */
function syncSubscriptionFromStripe(userId, stripeSub, planName) {
    if (!stripeSub) return findSubscriptionByUserId(userId);
    const item = stripeSub.items && stripeSub.items.data && stripeSub.items.data[0];
    const priceId = item && item.price ? item.price.id : null;
    return upsertSubscription(userId, {
        stripe_customer_id: typeof stripeSub.customer === 'string' ? stripeSub.customer : (stripeSub.customer && stripeSub.customer.id) || null,
        stripe_subscription_id: stripeSub.id,
        subscription_status: stripeSub.status,
        price_id: priceId,
        plan_name: planName || null,
        current_period_start: stripeSub.current_period_start || null,
        current_period_end: stripeSub.current_period_end || null,
        trial_end: stripeSub.trial_end || null,
        cancel_at_period_end: stripeSub.cancel_at_period_end ? 1 : 0,
        canceled_at: stripeSub.canceled_at || null
    });
}

// ==================== LEADS ====================

function createLead({ email, source, page, ip, userAgent }) {
    const id = genId('lead');
    db.prepare(`
        INSERT INTO leads (id, email, source, page, ip, user_agent, created_at)
        VALUES (@id, @email, @source, @page, @ip, @user_agent, @created_at)
    `).run({
        id,
        email: email.toLowerCase(),
        source: source || null,
        page: page || null,
        ip: ip || null,
        user_agent: userAgent || null,
        created_at: Date.now()
    });
    return id;
}

function recentLeadCountByIp(ip, windowMs) {
    if (!ip) return 0;
    const since = Date.now() - (windowMs || 60 * 60 * 1000);
    const row = db.prepare('SELECT COUNT(*) AS n FROM leads WHERE ip = ? AND created_at >= ?').get(ip, since);
    return row ? row.n : 0;
}

module.exports = {
    db,
    DB_PATH,
    // users
    createUser,
    findUserByEmail,
    findUserById,
    updateUser,
    verifyPassword,
    // subscriptions
    upsertSubscription,
    findSubscriptionByUserId,
    findSubscriptionByStripeCustomerId,
    findSubscriptionByStripeSubscriptionId,
    markSubscriptionActive,
    markSubscriptionPastDue,
    markSubscriptionCanceled,
    syncSubscriptionFromStripe,
    // leads
    createLead,
    recentLeadCountByIp
};
