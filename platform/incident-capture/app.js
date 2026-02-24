/**
 * PNEUOMA Incident Capture & Containment
 * Core application logic, API client, and shared utilities
 */

const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : 'https://pneuoma.onrender.com';

const INCIDENT_TYPES = [
    'Physical Altercation', 'Verbal Altercation', 'Disruption', 'Insubordination',
    'Bullying', 'Vandalism', 'Theft', 'Drug/Alcohol', 'Weapons', 'Threat',
    'Truancy', 'Dress Code', 'Technology Misuse', 'Other'
];

const SEVERITY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];

const STATUS_OPTIONS = ['open', 'in-progress', 'resolved', 'closed'];

const DEESCALATION_STRATEGIES = [
    'Verbal Separation',
    'Physical Separation',
    'Restorative Conversation Scheduled',
    'Safety Escort',
    'Cool-Down Period',
    'Peer Mediation',
    'Other'
];

const LOCATIONS = [
    'Hallway - Main', 'Hallway - East Wing', 'Hallway - West Wing', 'Hallway - Near Gym',
    'Cafeteria', 'Gymnasium', 'Playground', 'Parking Lot', 'Main Office', 'Classroom',
    'Restroom', 'Library', 'Auditorium', 'Bus Loading Zone', 'Stairwell',
    'Entrance - Front', 'Entrance - Side', 'Athletic Field', 'Other'
];

// ==================== STUDENT IDENTITY MANAGEMENT ====================

const LABEL_MODES = [
    { key: 'alias', label: 'Alias' },
    { key: 'real', label: 'Real Name' },
    { key: 'initials', label: 'Initials' },
    { key: 'custom', label: 'Custom' }
];

function generateAlias(idx) {
    return 'Student ' + String.fromCharCode(65 + (idx % 26));
}

function getInitials(name) {
    return (name || '').split(/\s+/).filter(Boolean).map(w => w.charAt(0).toUpperCase() + '.').join('');
}

function studentDisplayLabel(student, idx) {
    if (typeof student === 'string') return student;
    switch (student.labelMode) {
        case 'real': return student.realName;
        case 'initials': return getInitials(student.realName);
        case 'custom': return student.displayLabel || generateAlias(idx);
        case 'alias':
        default: return generateAlias(idx);
    }
}

function normalizeStudents(students) {
    if (!Array.isArray(students)) return [];
    return students.map((s, i) => {
        if (typeof s === 'string') {
            return { realName: s, displayLabel: generateAlias(i), labelMode: 'alias' };
        }
        s.displayLabel = studentDisplayLabel(s, i);
        return s;
    });
}

function studentsForDisplay(students) {
    return normalizeStudents(students).map((s, i) => studentDisplayLabel(s, i));
}

// ==================== PDF SAVE (iOS-compatible) ====================

async function savePDF(doc, filename) {
    const blob = doc.output('blob');
    if (navigator.share) {
        try {
            const file = new File([blob], filename, { type: 'application/pdf' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file], title: filename });
                return;
            }
        } catch (e) {
            if (e.name === 'AbortError') return;
        }
    }
    doc.save(filename);
}

// ==================== API CLIENT ====================

const api = {
    async get(path) {
        const res = await fetch(`${API_BASE}${path}`);
        if (!res.ok) throw new Error((await res.json()).error || res.statusText);
        return res.json();
    },

    async post(path, body) {
        const res = await fetch(`${API_BASE}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error((await res.json()).error || res.statusText);
        return res.json();
    },

    async postForm(path, formData) {
        const res = await fetch(`${API_BASE}${path}`, {
            method: 'POST',
            body: formData,
        });
        if (!res.ok) throw new Error((await res.json()).error || res.statusText);
        return res.json();
    },

    async put(path, body) {
        const res = await fetch(`${API_BASE}${path}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error((await res.json()).error || res.statusText);
        return res.json();
    },

    async del(path) {
        const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE' });
        if (!res.ok) throw new Error((await res.json()).error || res.statusText);
        return res.json();
    }
};

// ==================== UTILITIES ====================

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T12:00:00'));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateLong(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T12:00:00'));
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function todayISO() {
    return new Date().toISOString().split('T')[0];
}

function nowTime() {
    return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function severityClass(sev) {
    return 'badge-' + (sev || 'medium').toLowerCase();
}

function statusClass(status) {
    return 'badge-' + (status || 'open').replace(/\s+/g, '-').toLowerCase();
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

function generateClipboardText(inc) {
    return [
        '═══════════════════════════════════════',
        'INCIDENT REPORT',
        '═══════════════════════════════════════',
        `Date: ${formatDate(inc.date)}`,
        `Time: ${inc.time}`,
        `Location: ${inc.location}`,
        `Type: ${inc.incidentType || inc.incident_type}`,
        `Severity: ${inc.severity}`,
        `Status: ${(inc.status || '').toUpperCase()}`,
        '',
        `Students Involved: ${studentsForDisplay(inc.studentsInvolved).join(', ') || 'N/A'}`,
        `Staff Involved: ${(inc.staffInvolved || []).join(', ') || 'N/A'}`,
        `Witnesses: ${(inc.witnesses || []).join(', ') || 'N/A'}`,
        '',
        'DESCRIPTION:',
        inc.description,
        '',
        'IMMEDIATE ACTION:',
        inc.immediateAction || inc.immediate_action || 'N/A',
        '',
        'DE-ESCALATION STRATEGY:',
        (inc.deescalationStrategy || []).length ? inc.deescalationStrategy.join(', ') : 'N/A',
        '',
        'FOLLOW-UP NEEDED:',
        inc.followUpNeeded || inc.follow_up_needed || 'N/A',
        '',
        inc.notes ? `NOTES:\n${inc.notes}\n` : '',
        `Reported By: ${inc.reportedBy || inc.reported_by}`,
        '═══════════════════════════════════════',
    ].filter(Boolean).join('\n');
}

// ==================== RENDER HELPERS ====================

function renderIncidentCard(inc) {
    const allLabels = studentsForDisplay(inc.studentsInvolved);
    const students = allLabels.slice(0, 3);
    return `
        <a href="incident.html?id=${inc.id}" class="incident-card">
            <div class="incident-card-header">
                <div>
                    <div class="incident-card-title">${escapeHtml(inc.incidentType || inc.incident_type)}</div>
                    <div class="incident-card-meta">${escapeHtml(inc.time)} · ${escapeHtml(inc.location)}</div>
                </div>
                <div class="badges">
                    <span class="badge ${severityClass(inc.severity)}">${escapeHtml(inc.severity)}</span>
                    <span class="badge ${statusClass(inc.status)}">${escapeHtml(inc.status)}</span>
                </div>
            </div>
            <div class="incident-card-desc">${escapeHtml(inc.description)}</div>
            <div class="incident-card-footer">
                <div class="incident-tags">
                    ${students.map(s => `<span class="tag tag-student">${escapeHtml(s)}</span>`).join('')}
                    ${allLabels.length > 3 ? `<span class="tag tag-student">+${allLabels.length - 3}</span>` : ''}
                </div>
                <span style="font-size:11px;color:var(--text-muted)">${formatDate(inc.createdAt || inc.created_at)}</span>
            </div>
        </a>
    `;
}

function renderSpinner() {
    return '<div class="loading"><div class="spinner"></div></div>';
}

function renderEmpty(title, subtitle) {
    return `
        <div class="empty-state">
            <div class="empty-icon">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/>
                </svg>
            </div>
            <h3>${title}</h3>
            <p>${subtitle}</p>
        </div>
    `;
}

// SVG icons used across pages
const ICONS = {
    mic: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>',
    stop: '<svg fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>',
    chevronRight: '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>',
    chevronLeft: '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>',
    home: '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>',
    list: '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/></svg>',
    doc: '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>',
};

function bottomNav(activePage) {
    const items = [
        { href: 'index.html', icon: ICONS.home, label: 'Dashboard', key: 'dashboard' },
        { href: 'capture.html', icon: ICONS.mic, label: 'Capture', key: 'capture', primary: true },
        { href: 'incidents.html', icon: ICONS.list, label: 'Incidents', key: 'incidents' },
        { href: 'reports.html', icon: ICONS.doc, label: 'Reports', key: 'reports' },
    ];

    return `
        <nav class="bottom-nav">
            ${items.map(item => {
                const isActive = item.key === activePage;
                if (item.primary) {
                    return `<a href="${item.href}" class="nav-item primary ${isActive ? 'active' : ''}">
                        <div class="nav-icon-wrap">${item.icon}</div>
                        <span>${item.label}</span>
                    </a>`;
                }
                return `<a href="${item.href}" class="nav-item ${isActive ? 'active' : ''}">
                    ${item.icon}
                    <span>${item.label}</span>
                </a>`;
            }).join('')}
        </nav>
    `;
}

function topNav() {
    return `
        <header class="top-nav">
            <a href="index.html" class="top-nav-logo">
                <span class="logo-icon">πνεῦμα</span>
                <span>PNEUOMA</span>
            </a>
            <span class="top-nav-badge">Incident Capture</span>
        </header>
    `;
}
