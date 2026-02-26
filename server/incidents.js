/**
 * PNEUOMA Incident Capture & Containment
 * API Routes for incident management, AI transcription, and template generation
 */

const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const OpenAI = require('openai');

// ==================== DATABASE SETUP ====================

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'incidents.db'));
db.pragma('journal_mode = WAL');

db.exec(`
    CREATE TABLE IF NOT EXISTS incidents (
        id TEXT PRIMARY KEY,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        location TEXT NOT NULL,
        incident_type TEXT NOT NULL,
        severity TEXT DEFAULT 'Medium',
        students_involved TEXT DEFAULT '[]',
        staff_involved TEXT DEFAULT '[]',
        witnesses TEXT DEFAULT '[]',
        description TEXT NOT NULL,
        immediate_action TEXT DEFAULT '',
        follow_up_needed TEXT DEFAULT '',
        teacher_notified INTEGER DEFAULT 0,
        parent_notified INTEGER DEFAULT 0,
        counselor_notified INTEGER DEFAULT 0,
        principal_notified INTEGER DEFAULT 0,
        dean_notified INTEGER DEFAULT 0,
        support_staff_notified INTEGER DEFAULT 0,
        reported_by TEXT NOT NULL,
        status TEXT DEFAULT 'open',
        deescalation_strategy TEXT DEFAULT '[]',
        raw_transcript TEXT,
        notes TEXT DEFAULT ''
    )
`);

// ==================== OPENAI SETUP ====================

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
let openai;
if (OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: OPENAI_API_KEY });
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

// ==================== HELPERS ====================

function generateId() {
    return crypto.randomUUID();
}

function serializeIncident(row) {
    return {
        ...row,
        studentsInvolved: JSON.parse(row.students_involved || '[]'),
        staffInvolved: JSON.parse(row.staff_involved || '[]'),
        witnesses: JSON.parse(row.witnesses || '[]'),
        teacherNotified: !!row.teacher_notified,
        parentNotified: !!row.parent_notified,
        counselorNotified: !!row.counselor_notified,
        principalNotified: !!row.principal_notified,
        deanNotified: !!row.dean_notified,
        supportStaffNotified: !!row.support_staff_notified,
        incidentType: row.incident_type,
        immediateAction: row.immediate_action,
        followUpNeeded: row.follow_up_needed,
        reportedBy: row.reported_by,
        deescalationStrategy: JSON.parse(row.deescalation_strategy || '[]'),
        rawTranscript: row.raw_transcript,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

// ==================== CRUD ROUTES ====================

// List incidents
router.get('/', (req, res) => {
    try {
        const { date, status, search } = req.query;
        let sql = 'SELECT * FROM incidents';
        const conditions = [];
        const params = [];

        if (date) {
            conditions.push('date = ?');
            params.push(date);
        }
        if (status && status !== 'all') {
            conditions.push('status = ?');
            params.push(status);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }
        sql += ' ORDER BY created_at DESC';

        let rows = db.prepare(sql).all(...params);

        if (search) {
            const q = search.toLowerCase();
            rows = rows.filter(r =>
                r.description.toLowerCase().includes(q) ||
                r.students_involved.toLowerCase().includes(q) ||
                r.staff_involved.toLowerCase().includes(q) ||
                r.location.toLowerCase().includes(q) ||
                r.incident_type.toLowerCase().includes(q)
            );
        }

        res.json(rows.map(serializeIncident));
    } catch (error) {
        console.error('Failed to fetch incidents:', error);
        res.status(500).json({ error: 'Failed to fetch incidents' });
    }
});

// Get single incident
router.get('/:id', (req, res) => {
    try {
        const row = db.prepare('SELECT * FROM incidents WHERE id = ?').get(req.params.id);
        if (!row) return res.status(404).json({ error: 'Incident not found' });
        res.json(serializeIncident(row));
    } catch (error) {
        console.error('Failed to fetch incident:', error);
        res.status(500).json({ error: 'Failed to fetch incident' });
    }
});

// Create incident
router.post('/', (req, res) => {
    try {
        const b = req.body;
        if (!b.description || !b.reportedBy) {
            return res.status(400).json({ error: 'Description and reporter are required' });
        }

        const id = generateId();
        const now = new Date().toISOString();

        db.prepare(`
            INSERT INTO incidents (id, created_at, updated_at, date, time, location, incident_type, severity,
                students_involved, staff_involved, witnesses, description, immediate_action,
                follow_up_needed, deescalation_strategy, reported_by, status, raw_transcript, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            id, now, now,
            b.date || now.split('T')[0],
            b.time || new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
            b.location || '',
            b.incidentType || 'Other',
            b.severity || 'Medium',
            JSON.stringify(b.studentsInvolved || []),
            JSON.stringify(b.staffInvolved || []),
            JSON.stringify(b.witnesses || []),
            b.description,
            b.immediateAction || '',
            b.followUpNeeded || '',
            JSON.stringify(b.deescalationStrategy || []),
            b.reportedBy,
            b.status || 'open',
            b.rawTranscript || null,
            b.notes || ''
        );

        const row = db.prepare('SELECT * FROM incidents WHERE id = ?').get(id);
        console.log(`📋 Incident created: ${id} by ${b.reportedBy}`);
        res.status(201).json(serializeIncident(row));
    } catch (error) {
        console.error('Failed to create incident:', error);
        res.status(500).json({ error: 'Failed to create incident' });
    }
});

// Update incident
router.put('/:id', (req, res) => {
    try {
        const existing = db.prepare('SELECT * FROM incidents WHERE id = ?').get(req.params.id);
        if (!existing) return res.status(404).json({ error: 'Incident not found' });

        const b = req.body;
        const now = new Date().toISOString();

        db.prepare(`
            UPDATE incidents SET
                updated_at = ?,
                date = COALESCE(?, date),
                time = COALESCE(?, time),
                location = COALESCE(?, location),
                incident_type = COALESCE(?, incident_type),
                severity = COALESCE(?, severity),
                students_involved = COALESCE(?, students_involved),
                staff_involved = COALESCE(?, staff_involved),
                witnesses = COALESCE(?, witnesses),
                description = COALESCE(?, description),
                immediate_action = COALESCE(?, immediate_action),
                follow_up_needed = COALESCE(?, follow_up_needed),
                deescalation_strategy = COALESCE(?, deescalation_strategy),
                teacher_notified = COALESCE(?, teacher_notified),
                parent_notified = COALESCE(?, parent_notified),
                counselor_notified = COALESCE(?, counselor_notified),
                principal_notified = COALESCE(?, principal_notified),
                dean_notified = COALESCE(?, dean_notified),
                support_staff_notified = COALESCE(?, support_staff_notified),
                reported_by = COALESCE(?, reported_by),
                status = COALESCE(?, status),
                notes = COALESCE(?, notes)
            WHERE id = ?
        `).run(
            now,
            b.date ?? null,
            b.time ?? null,
            b.location ?? null,
            b.incidentType ?? null,
            b.severity ?? null,
            b.studentsInvolved ? JSON.stringify(b.studentsInvolved) : null,
            b.staffInvolved ? JSON.stringify(b.staffInvolved) : null,
            b.witnesses ? JSON.stringify(b.witnesses) : null,
            b.description ?? null,
            b.immediateAction ?? null,
            b.followUpNeeded ?? null,
            b.deescalationStrategy ? JSON.stringify(b.deescalationStrategy) : null,
            b.teacherNotified !== undefined ? (b.teacherNotified ? 1 : 0) : null,
            b.parentNotified !== undefined ? (b.parentNotified ? 1 : 0) : null,
            b.counselorNotified !== undefined ? (b.counselorNotified ? 1 : 0) : null,
            b.principalNotified !== undefined ? (b.principalNotified ? 1 : 0) : null,
            b.deanNotified !== undefined ? (b.deanNotified ? 1 : 0) : null,
            b.supportStaffNotified !== undefined ? (b.supportStaffNotified ? 1 : 0) : null,
            b.reportedBy ?? null,
            b.status ?? null,
            b.notes ?? null,
            req.params.id
        );

        const row = db.prepare('SELECT * FROM incidents WHERE id = ?').get(req.params.id);
        res.json(serializeIncident(row));
    } catch (error) {
        console.error('Failed to update incident:', error);
        res.status(500).json({ error: 'Failed to update incident' });
    }
});

// Delete incident
router.delete('/:id', (req, res) => {
    try {
        const result = db.prepare('DELETE FROM incidents WHERE id = ?').run(req.params.id);
        if (result.changes === 0) return res.status(404).json({ error: 'Incident not found' });
        console.log(`🗑️ Incident deleted: ${req.params.id}`);
        res.json({ success: true });
    } catch (error) {
        console.error('Failed to delete incident:', error);
        res.status(500).json({ error: 'Failed to delete incident' });
    }
});

// ==================== AI: TRANSCRIBE ====================

router.post('/transcribe', upload.single('audio'), async (req, res) => {
    if (!openai) {
        return res.status(503).json({ error: 'OpenAI API key not configured. Add OPENAI_API_KEY to environment variables.' });
    }

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        const mimeType = req.file.mimetype || 'audio/webm';
        const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
        const file = new File([req.file.buffer], `recording.${ext}`, { type: mimeType });

        const response = await openai.audio.transcriptions.create({
            model: 'whisper-1',
            file,
            language: 'en',
        });

        console.log(`🎤 Transcription complete: "${response.text.substring(0, 60)}..."`);
        res.json({ transcript: response.text });
    } catch (error) {
        console.error('Transcription error:', error.message);
        res.status(500).json({ error: 'Transcription failed: ' + error.message });
    }
});

// ==================== AI: PARSE TRANSCRIPT ====================

router.post('/parse', async (req, res) => {
    if (!openai) {
        return res.status(503).json({ error: 'OpenAI API key not configured.' });
    }

    try {
        const { transcript, mode } = req.body;
        if (!transcript) return res.status(400).json({ error: 'No transcript provided' });

        const today = new Date().toISOString().split('T')[0];

        const modeContexts = {
            education: {
                role: 'K-12 school administration assistant',
                context: 'school incidents',
                people: 'students',
                types: 'Physical Altercation, Verbal Altercation, Disruption, Insubordination, Bullying, Vandalism, Theft, Drug/Alcohol, Weapons, Threat, Truancy, Dress Code, Technology Misuse, Other',
                strategies: 'Verbal Separation, Physical Separation, Restorative Conversation Scheduled, Safety Escort, Cool-Down Period, Peer Mediation, Other',
            },
            corporate: {
                role: 'corporate workplace documentation assistant',
                context: 'workplace incidents and reports',
                people: 'individuals/employees',
                types: 'Workplace Conflict, Safety Violation, Policy Breach, Harassment, Equipment Damage, Security Incident, Performance Issue, Customer Complaint, Accident / Injury, Misconduct, Data Breach, Discrimination, Theft / Loss, Environmental Hazard, Other',
                strategies: 'Verbal De-escalation, Separated Parties, Manager Mediation, HR Intervention, Security Called, Written Warning Issued, Break / Cool-Down, Peer Mediation, Other',
            },
            individual: {
                role: 'personal documentation and note-taking assistant',
                context: 'personal notes, meetings, and interactions',
                people: 'people',
                types: 'Meeting Notes, Phone Call, Client Interaction, Task / To-Do, Idea / Brainstorm, Complaint, Follow-Up Needed, Personal Note, Expense / Receipt, Travel, Health / Wellness, Other',
                strategies: 'Follow-Up Scheduled, Email Sent, Call Made, Task Created, Delegated, Tabled for Later, Resolved, Other',
            }
        };

        const mc = modeContexts[mode] || modeContexts.education;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: `You are a ${mc.role} that converts voice notes about ${mc.context} into structured, report-ready data. Extract all available information. Use today's date (${today}) if no date is mentioned.

CRITICAL: All text fields (description, immediateAction, followUpNeeded) MUST be written in polished, professional prose — correct all grammar, spelling, punctuation, and sentence structure. Write in past tense, third person, formal tone suitable for official documentation and legal review. Do NOT include filler words, false starts, or spoken-language artifacts from the transcript.

Return ONLY valid JSON:
{
  "date": "YYYY-MM-DD",
  "time": "H:MM AM/PM",
  "location": "specific location",
  "incidentType": "one of: ${mc.types}",
  "severity": "one of: Low, Medium, High, Critical",
  "studentsInvolved": ["full names of ${mc.people} involved, properly capitalized"],
  "staffInvolved": ["full names of other personnel/contacts, properly capitalized"],
  "witnesses": ["full names, properly capitalized"],
  "description": "polished, grammar-corrected factual summary in professional report language",
  "immediateAction": "grammar-corrected actions taken, or empty string",
  "followUpNeeded": "grammar-corrected next steps, or empty string",
  "deescalationStrategy": ["strategies used, from: ${mc.strategies}"]
}`
                },
                { role: 'user', content: transcript }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1,
        });

        const parsed = JSON.parse(response.choices[0].message.content || '{}');
        console.log(`🧠 Parsed incident: ${parsed.incidentType || 'Unknown'}`);
        res.json(parsed);
    } catch (error) {
        console.error('Parse error:', error.message);
        res.status(500).json({ error: 'Parsing failed: ' + error.message });
    }
});

// ==================== AI: COMMUNICATION TEMPLATES ====================

router.post('/templates', async (req, res) => {
    if (!openai) {
        return res.status(503).json({ error: 'OpenAI API key not configured.' });
    }

    try {
        const inc = req.body;
        const mode = inc.mode || 'education';

        const templatePrompts = {
            education: {
                system: `You are a K-12 school administrator assistant. Generate professional, legally safe, grammar-perfect communication templates. Rules:
- All output must use flawless grammar, spelling, and punctuation — suitable for official district records and legal review.
- Neutral, factual language. Never assign blame. Past tense for events.
- Teacher notification: Inform about incident and classroom impact. Include monitoring guidance.
- Parent notification: First name and last initial only. NEVER name other students.
- Counselor referral: Include behavioral context for support planning.
- Principal briefing: Executive summary with severity, pattern concerns, and recommended next steps for leadership.
- Dean notification: Operational detail for discipline follow-up, include student history context and consequence recommendations.
- Support staff memo: Brief situational awareness for aides, paras, security — include what to watch for and where.
- If de-escalation strategies were used, reference them positively in communications to reflect trauma-informed practice.`,
                json: `{ "teacherEmail": "Subject: ...\\n\\n...", "parentEmail": "Subject: ...\\n\\n...", "counselorReferral": "COUNSELOR REFERRAL\\n\\n...", "principalBriefing": "PRINCIPAL BRIEFING\\n\\n...", "deanNotification": "DEAN NOTIFICATION\\n\\n...", "supportStaffMemo": "SUPPORT STAFF MEMO\\n\\n..." }`
            },
            corporate: {
                system: `You are a corporate workplace documentation assistant. Generate professional, legally safe, grammar-perfect communication templates for workplace incidents. Rules:
- All output must use flawless grammar, spelling, and punctuation — suitable for official records and legal review.
- Neutral, factual language. Never assign blame. Past tense for events.
- Manager email: Inform direct manager with relevant operational details and any team impact.
- HR email: Formal HR documentation with policy references and recommended actions.
- Stakeholder brief: High-level summary for cross-functional stakeholders, focus on business impact.
- Executive summary: Concise C-suite briefing with risk assessment and recommended next steps.
- Legal memo: Factual account for legal review, highlight compliance concerns and liability considerations.
- Safety report: Incident details for safety officer, root cause indicators, prevention recommendations.`,
                json: `{ "managerEmail": "Subject: ...\\n\\n...", "hrEmail": "Subject: ...\\n\\n...", "stakeholderBrief": "STAKEHOLDER BRIEF\\n\\n...", "executiveSummary": "EXECUTIVE SUMMARY\\n\\n...", "legalMemo": "LEGAL MEMO\\n\\n...", "safetyReport": "SAFETY REPORT\\n\\n..." }`
            },
            individual: {
                system: `You are a personal documentation assistant. Generate clean, professional communication drafts. Rules:
- All output must use flawless grammar, spelling, and punctuation.
- Email draft: A professional email summarizing the key points, ready to send.
- Follow-up note: Action items and reminders with dates/deadlines where possible.
- Summary: A clean recap suitable for your records or sharing with others.`,
                json: `{ "emailDraft": "Subject: ...\\n\\n...", "followUpNote": "FOLLOW-UP\\n\\n...", "summaryNote": "SUMMARY\\n\\n..." }`
            }
        };

        const tp = templatePrompts[mode] || templatePrompts.education;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: `${tp.system}\n\nReturn ONLY valid JSON:\n${tp.json}`
                },
                {
                    role: 'user',
                    content: `Date: ${inc.date}\nTime: ${inc.time}\nLocation: ${inc.location}\nType: ${inc.incidentType}\nSeverity: ${inc.severity}\nPeople: ${(inc.studentsInvolved || []).join(', ')}\nDescription: ${inc.description}\nAction: ${inc.immediateAction}\nResolution: ${(inc.deescalationStrategy || []).join(', ') || 'None documented'}\nFollow-up: ${inc.followUpNeeded}\nReported by: ${inc.reportedBy}`
                }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3,
        });

        const templates = JSON.parse(response.choices[0].message.content || '{}');
        console.log(`📧 Templates generated for incident`);
        res.json(templates);
    } catch (error) {
        console.error('Template error:', error.message);
        res.status(500).json({ error: 'Template generation failed: ' + error.message });
    }
});

// ==================== AI: REFINE INCIDENT (CONVERSATIONAL) ====================

router.post('/refine', async (req, res) => {
    if (!openai) {
        return res.status(503).json({ error: 'OpenAI API key not configured.' });
    }

    try {
        const { message, currentData, history } = req.body;
        if (!message) return res.status(400).json({ error: 'No message provided' });

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: `You are an AI assistant helping a K-12 school administrator refine an incident report through natural conversation. You have full context of the current incident data.

Current incident data:
${JSON.stringify(currentData, null, 2)}

Your role:
- Help clarify incident details, correct errors, add missing information
- Handle student identity/anonymization requests — administrators often need to protect student names for legal reasons (FERPA)
- When the user wants to update fields, respond conversationally AND include a JSON code block with the exact field updates
- Fix grammar and ensure professional language in any text updates
- Be concise and helpful — this person is busy

Student identity system:
Each student has: { "realName": "actual name", "displayLabel": "what shows in reports", "labelMode": "alias|real|initials|custom" }
- "alias" = Student A, Student B, etc. (DEFAULT — protects identity)
- "real" = shows actual name
- "initials" = J.S., M.K., etc.
- "custom" = any label the recorder chooses

When suggesting updates, include a JSON block at the END of your response:
\`\`\`json
{"updates": {"fieldName": "value"}}
\`\`\`

Available fields: studentsInvolved (array of student objects), staffInvolved (string array), witnesses (string array), description, immediateAction, followUpNeeded, severity, location, incidentType, deescalationStrategy (string array).

If no updates are needed (just answering a question), respond without a JSON block.`
                },
                ...(history || []).map(m => ({ role: m.role, content: m.content })),
                { role: 'user', content: message }
            ],
            temperature: 0.3,
        });

        const reply = response.choices[0].message.content;

        let updates = null;
        const jsonMatch = reply.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[1]);
                updates = parsed.updates || parsed;
            } catch (e) {
                console.error('Failed to parse AI update JSON:', e.message);
            }
        }

        const cleanReply = reply.replace(/```json[\s\S]*?```/, '').trim();

        console.log(`💬 Refine chat: "${message.substring(0, 50)}..." → updates: ${updates ? 'yes' : 'no'}`);
        res.json({ reply: cleanReply, updates });
    } catch (error) {
        console.error('Refine error:', error.message);
        res.status(500).json({ error: 'AI refinement failed: ' + error.message });
    }
});

module.exports = router;
