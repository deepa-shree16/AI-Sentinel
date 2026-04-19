// AI-Sentinel Sensitivity Engine
const SENSITIVITY_LEVELS = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
};

const RULES = {
    MEDIUM: [
        { name: 'Email Address', regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
        { name: 'Employee ID', regex: /EMP\d{3,8}/gi },
        { name: 'Internal Project Mention', regex: /project\s+[a-z0-9_-]+/gi }
    ],
    HIGH: [
        { name: 'Credit/Debit Card', regex: /\b(?:\d[ -]?){13,16}\b/g },
        { name: 'API Key / Secret', regex: /[a-z0-9_-]{32,}/gi },
        { name: 'Aadhaar Card', regex: /\b\d{4}\s\d{4}\s\d{4}\b/g },
        { name: 'PAN Card', regex: /[A-Z]{5}[0-9]{4}[A-Z]{1}/g },
        { name: 'SSN (US)', regex: /\b\d{3}-\d{2}-\d{4}\b/g },
        { name: 'Possible Password', regex: /password[:= ]\s*\S+/gi },
        { name: 'OTP/Code', regex: /\b\d{4,6}\b/g },
        { name: 'Legal/Confidential Keyword', regex: /\b(confidential|contract|agreement|legal|internal use only)\b/gi }
    ]
};

function checkSensitivity(text, level) {
    let findings = [];

    // Low level does no checking by design ("Public Info")
    if (level === SENSITIVITY_LEVELS.LOW) return { safe: true };

    // Medium checks medium rules
    RULES.MEDIUM.forEach(rule => {
        const matches = text.match(rule.regex);
        if (matches) matches.forEach(m => findings.push({ type: rule.name, value: m }));
    });

    // High checks high + medium rules
    if (level === SENSITIVITY_LEVELS.HIGH) {
        RULES.HIGH.forEach(rule => {
            const matches = text.match(rule.regex);
            if (matches) matches.forEach(m => findings.push({ type: rule.name, value: m }));
        });
    }

    return {
        safe: findings.length === 0,
        findings: findings
    };
}

function sanitizeText(text, findings) {
    let sanitized = text;
    findings.forEach(f => {
        sanitized = sanitized.replace(f.value, `[REDACTED ${f.type}]`);
    });
    return sanitized;
}
