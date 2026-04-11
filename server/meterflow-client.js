/**
 * MeterFlow Client — drop this file into your Express server directory.
 * Plain Node.js, no dependencies, no TypeScript, no build step.
 *
 * Usage:
 *   const meterflow = require('./meterflow-client');
 *   await meterflow.trackSession({ gameId: 'project-aura', durationSec: 480, userId: 'u-123' });
 */

const METERFLOW_URL = process.env.METERFLOW_API_URL;              // e.g. https://signalmeter.onrender.com
const METERFLOW_TOKEN = process.env.METERFLOW_INGESTION_KEY;      // server-to-server ingestion API key
const METERFLOW_ORG_ID = process.env.METERFLOW_ORG_ID;            // your org UUID in MeterFlow

const PRODUCT_ID = 'aa000001-0000-0000-0000-000000000001';

const METERS = {
  sessions:    'bb000001-0000-0000-0000-000000000001',
  minutes:     'bb000001-0000-0000-0000-000000000002',
  activeUsers: 'bb000001-0000-0000-0000-000000000003',
  multiplayer: 'bb000001-0000-0000-0000-000000000004',
  apiCalls:    'bb000001-0000-0000-0000-000000000005',
};

function isConfigured() {
  return !!(METERFLOW_URL && METERFLOW_TOKEN && METERFLOW_ORG_ID);
}

async function sendEvent(meterId, quantity, opts = {}) {
  if (!isConfigured()) return null;

  const body = {
    product_id: PRODUCT_ID,
    meter_id: meterId,
    quantity: quantity,
    event_time: opts.eventTime || new Date().toISOString(),
    idempotency_key: opts.idempotencyKey || `${meterId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    source: 'api',
    billable: true,
  };

  if (opts.userId) body.user_id = opts.userId;
  if (opts.metadata) body.metadata = opts.metadata;

  try {
    const res = await fetch(`${METERFLOW_URL}/v1/organizations/${METERFLOW_ORG_ID}/usage-events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${METERFLOW_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[MeterFlow] ${res.status}: ${text}`);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error('[MeterFlow] Network error:', err.message);
    return null;
  }
}

// ─── High-level tracking methods ───────────────────────────────

/**
 * Track a completed game/ritual session.
 * Call this when a user finishes or exits an experience.
 *
 * @param {Object} session
 * @param {string} session.gameId     - e.g. 'project-aura', 'echo-garden'
 * @param {number} session.durationSec - session length in seconds
 * @param {string} [session.userId]    - user ID if authenticated
 * @param {boolean} [session.isMultiplayer] - true for co-regulation sessions
 * @param {Object} [session.metadata]  - extra context (age group, intention, etc.)
 */
async function trackSession(session) {
  const now = new Date().toISOString();
  const promises = [];

  // 1. Count the session
  promises.push(
    sendEvent(METERS.sessions, 1, {
      userId: session.userId,
      idempotencyKey: `sess-${session.gameId}-${session.userId || 'anon'}-${now}`,
      metadata: { game: session.gameId, ...session.metadata },
    })
  );

  // 2. Count the minutes (rounded up)
  const minutes = Math.ceil((session.durationSec || 0) / 60);
  if (minutes > 0) {
    promises.push(
      sendEvent(METERS.minutes, minutes, {
        userId: session.userId,
        idempotencyKey: `mins-${session.gameId}-${session.userId || 'anon'}-${now}`,
      })
    );
  }

  // 3. Count active user (idempotency key = user + date, so same user same day = 1 event)
  if (session.userId) {
    const today = now.slice(0, 10);
    promises.push(
      sendEvent(METERS.activeUsers, 1, {
        userId: session.userId,
        idempotencyKey: `user-${session.userId}-${today}`,
      })
    );
  }

  // 4. Count multiplayer session
  if (session.isMultiplayer) {
    promises.push(
      sendEvent(METERS.multiplayer, 1, {
        userId: session.userId,
        idempotencyKey: `mp-${session.gameId}-${now}`,
        metadata: { game: session.gameId },
      })
    );
  }

  await Promise.allSettled(promises);
}

/**
 * Track an API call (for when you open the developer API).
 * Drop this into an Express middleware.
 */
function apiTrackingMiddleware(req, res, next) {
  if (!isConfigured()) return next();

  res.on('finish', () => {
    sendEvent(METERS.apiCalls, 1, {
      userId: req.userId || null,
      metadata: { method: req.method, path: req.path, status: res.statusCode },
    }).catch(() => {});
  });

  next();
}

module.exports = {
  isConfigured,
  sendEvent,
  trackSession,
  apiTrackingMiddleware,
  METERS,
};
