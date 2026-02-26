/**
 * PNEUOMA Incident Capture & Containment
 * Core application logic, API client, and shared utilities
 */

const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : 'https://pneuoma.onrender.com';

// ==================== MODE SYSTEM ====================

const MODES = {
    education: {
        key: 'education',
        name: 'Education',
        subtitle: 'K-12 & Campus Admin',
        desc: 'Incident documentation, parent communication, compliance reporting',
        icon: '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5"/></svg>',
        color: '#f59e0b',
        badge: 'Education',
        itemName: 'Incident',
        itemNamePlural: 'Incidents',
        captureTitle: 'Capture Incident',
        captureHint: 'Speak naturally about the incident',
        ctaLabel: 'Record New Incident',
        ctaHint: 'Tap to start voice capture',
        dashboardTitle: 'Dashboard',
        dashboardSub: "Today's incident overview",
        emptyTitle: 'No incidents logged today',
        emptyHint: 'Tap the mic above to record your first incident',
        primaryPeople: 'Students Involved',
        primaryPlaceholder: 'Student real name (stored privately)...',
        secondaryPeople: 'Staff Involved',
        secondaryPlaceholder: 'Staff name...',
        tertiaryPeople: 'Witnesses',
        tertiaryPlaceholder: 'Witness name...',
        aliasPrefix: 'Student',
        anonymizeNotice: 'Names anonymized by default. Tap a student to change labeling.',
        resolutionLabel: 'De-Escalation Strategy Used',
        types: [
            'Physical Altercation', 'Verbal Altercation', 'Disruption', 'Insubordination',
            'Bullying', 'Vandalism', 'Theft', 'Drug/Alcohol', 'Weapons', 'Threat',
            'Truancy', 'Dress Code', 'Technology Misuse', 'Other'
        ],
        locations: [
            'Hallway - Main', 'Hallway - East Wing', 'Hallway - West Wing', 'Hallway - Near Gym',
            'Cafeteria', 'Gymnasium', 'Playground', 'Parking Lot', 'Main Office', 'Classroom',
            'Restroom', 'Library', 'Auditorium', 'Bus Loading Zone', 'Stairwell',
            'Entrance - Front', 'Entrance - Side', 'Athletic Field', 'Other'
        ],
        strategies: [
            'Verbal Separation', 'Physical Separation', 'Restorative Conversation Scheduled',
            'Safety Escort', 'Cool-Down Period', 'Peer Mediation', 'Other'
        ],
        templateTabs: [
            { key: 'teacher', label: 'Teacher', field: 'teacherEmail', notify: 'teacherNotified' },
            { key: 'parent', label: 'Parent', field: 'parentEmail', notify: 'parentNotified' },
            { key: 'counselor', label: 'Counselor', field: 'counselorReferral', notify: 'counselorNotified' },
            { key: 'principal', label: 'Principal', field: 'principalBriefing', notify: 'principalNotified' },
            { key: 'dean', label: 'Dean', field: 'deanNotification', notify: 'deanNotified' },
            { key: 'support', label: 'Support Staff', field: 'supportStaffMemo', notify: 'supportStaffNotified' },
        ],
    },
    corporate: {
        key: 'corporate',
        name: 'Corporate',
        subtitle: 'Teams & Management',
        desc: 'Workplace reports, HR documentation, stakeholder communication',
        icon: '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/></svg>',
        color: '#3b82f6',
        badge: 'Corporate',
        itemName: 'Report',
        itemNamePlural: 'Reports',
        captureTitle: 'Capture Report',
        captureHint: 'Describe the situation naturally',
        ctaLabel: 'Record New Report',
        ctaHint: 'Tap to start voice capture',
        dashboardTitle: 'Dashboard',
        dashboardSub: "Today's report overview",
        emptyTitle: 'No reports logged today',
        emptyHint: 'Tap the mic above to record your first report',
        primaryPeople: 'Individuals Involved',
        primaryPlaceholder: 'Person name (stored privately)...',
        secondaryPeople: 'Team / Department',
        secondaryPlaceholder: 'Team or department...',
        tertiaryPeople: 'Witnesses',
        tertiaryPlaceholder: 'Witness name...',
        aliasPrefix: 'Person',
        anonymizeNotice: 'Names anonymized by default. Tap a person to change labeling.',
        resolutionLabel: 'Resolution Strategy Used',
        types: [
            'Workplace Conflict', 'Safety Violation', 'Policy Breach', 'Harassment',
            'Equipment Damage', 'Security Incident', 'Performance Issue', 'Customer Complaint',
            'Accident / Injury', 'Misconduct', 'Data Breach', 'Discrimination',
            'Theft / Loss', 'Environmental Hazard', 'Other'
        ],
        locations: [
            'Office - Main', 'Office - Executive', 'Conference Room', 'Break Room',
            'Warehouse', 'Factory Floor', 'Lobby', 'Parking Structure', 'Loading Dock',
            'Restroom', 'Stairwell', 'Elevator', 'Server Room', 'Cafeteria',
            'Remote / Off-site', 'Client Site', 'Other'
        ],
        strategies: [
            'Verbal De-escalation', 'Separated Parties', 'Manager Mediation',
            'HR Intervention', 'Security Called', 'Written Warning Issued',
            'Break / Cool-Down', 'Peer Mediation', 'Other'
        ],
        templateTabs: [
            { key: 'manager', label: 'Manager', field: 'managerEmail', notify: 'teacherNotified' },
            { key: 'hr', label: 'HR', field: 'hrEmail', notify: 'parentNotified' },
            { key: 'stakeholder', label: 'Stakeholder', field: 'stakeholderBrief', notify: 'counselorNotified' },
            { key: 'executive', label: 'Executive', field: 'executiveSummary', notify: 'principalNotified' },
            { key: 'legal', label: 'Legal', field: 'legalMemo', notify: 'deanNotified' },
            { key: 'safety', label: 'Safety Officer', field: 'safetyReport', notify: 'supportStaffNotified' },
        ],
    },
    individual: {
        key: 'individual',
        name: 'Individual',
        subtitle: 'Personal & Freelance',
        desc: 'Quick capture, personal documentation, client communication',
        icon: '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/></svg>',
        color: '#8b5cf6',
        badge: 'Personal',
        itemName: 'Note',
        itemNamePlural: 'Notes',
        captureTitle: 'Quick Capture',
        captureHint: 'Speak naturally — your AI scribe is listening',
        ctaLabel: 'Record New Note',
        ctaHint: 'Tap to start voice capture',
        dashboardTitle: 'Dashboard',
        dashboardSub: "Today's notes overview",
        emptyTitle: 'No notes captured today',
        emptyHint: 'Tap the mic above to capture your first note',
        primaryPeople: 'People Involved',
        primaryPlaceholder: 'Person name...',
        secondaryPeople: 'Related Contacts',
        secondaryPlaceholder: 'Contact name...',
        tertiaryPeople: 'Additional People',
        tertiaryPlaceholder: 'Name...',
        aliasPrefix: 'Person',
        anonymizeNotice: 'Names anonymized by default. Tap a person to change labeling.',
        resolutionLabel: 'Action Taken',
        types: [
            'Meeting Notes', 'Phone Call', 'Client Interaction', 'Task / To-Do',
            'Idea / Brainstorm', 'Complaint', 'Follow-Up Needed', 'Personal Note',
            'Expense / Receipt', 'Travel', 'Health / Wellness', 'Other'
        ],
        locations: [
            'Home Office', 'Office', 'Coffee Shop', 'Co-working Space',
            'Client Site', 'Phone / Virtual', 'In Transit', 'Restaurant',
            'Conference / Event', 'Gym / Outdoors', 'Other'
        ],
        strategies: [
            'Follow-Up Scheduled', 'Email Sent', 'Call Made', 'Task Created',
            'Delegated', 'Tabled for Later', 'Resolved', 'Other'
        ],
        templateTabs: [
            { key: 'email', label: 'Email Draft', field: 'emailDraft', notify: 'teacherNotified' },
            { key: 'followup', label: 'Follow-Up', field: 'followUpNote', notify: 'parentNotified' },
            { key: 'summary', label: 'Summary', field: 'summaryNote', notify: 'counselorNotified' },
        ],
    }
};

function getMode() {
    return MODES[localStorage.getItem('pneuoma_mode')] || null;
}

function getModeOrRedirect() {
    const mode = getMode();
    if (!mode) { window.location.href = 'home.html'; return null; }
    return mode;
}

// Backward-compatible constants (populated from active mode)
const _m = getMode() || MODES.education;
const INCIDENT_TYPES = _m.types;
const SEVERITY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];
const STATUS_OPTIONS = ['open', 'in-progress', 'resolved', 'closed'];
const DEESCALATION_STRATEGIES = _m.strategies;
const LOCATIONS = _m.locations;

// ==================== STUDENT IDENTITY MANAGEMENT ====================

const LABEL_MODES = [
    { key: 'alias', label: 'Alias' },
    { key: 'real', label: 'Real Name' },
    { key: 'initials', label: 'Initials' },
    { key: 'custom', label: 'Custom' }
];

function generateAlias(idx) {
    const prefix = (getMode() || { aliasPrefix: 'Student' }).aliasPrefix;
    return prefix + ' ' + String.fromCharCode(65 + (idx % 26));
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
    const m = getMode() || MODES.education;
    return [
        '═══════════════════════════════════════',
        (m.itemName + ' REPORT').toUpperCase(),
        '═══════════════════════════════════════',
        `Date: ${formatDate(inc.date)}`,
        `Time: ${inc.time}`,
        `Location: ${inc.location}`,
        `Type: ${inc.incidentType || inc.incident_type}`,
        `Severity: ${inc.severity}`,
        `Status: ${(inc.status || '').toUpperCase()}`,
        '',
        `${m.primaryPeople}: ${studentsForDisplay(inc.studentsInvolved).join(', ') || 'N/A'}`,
        `${m.secondaryPeople}: ${(inc.staffInvolved || []).join(', ') || 'N/A'}`,
        `${m.tertiaryPeople}: ${(inc.witnesses || []).join(', ') || 'N/A'}`,
        '',
        'DESCRIPTION:',
        inc.description,
        '',
        'IMMEDIATE ACTION:',
        inc.immediateAction || inc.immediate_action || 'N/A',
        '',
        (m.resolutionLabel + ':').toUpperCase(),
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
    const m = getMode() || MODES.education;
    return `
        <header class="top-nav">
            <a href="index.html" class="top-nav-logo">
                <span class="logo-icon">πνεῦμα</span>
                <span>PNEUOMA</span>
            </a>
            <a href="home.html" class="top-nav-badge" style="cursor:pointer">${escapeHtml(m.badge)} ▾</a>
        </header>
    `;
}
