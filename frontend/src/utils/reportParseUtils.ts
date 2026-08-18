export interface ParsedFactorContent {
    bullets: string[];
    title?: string;
    raw: string;
}

export function parseFactorContent(
    statement: string | null | undefined
): ParsedFactorContent {
    if (!statement) return { bullets: [], raw: '' };

    // Strategy 1: Try JSON parse
    try {
        const parsed = JSON.parse(statement);
        if (parsed && typeof parsed === 'object') {
            const bullets = Array.isArray(parsed.bullets) ? parsed.bullets : [];
            return { bullets, title: parsed.title ?? undefined, raw: statement };
        }
    } catch {
        // Not JSON
    }

    // Strategy 2: Detect bullet lines
    const lines = statement.split('\n').map(l => l.trim()).filter(Boolean);
    const bulletLines = lines.filter(l => /^[-•*]\s+/.test(l));
    if (bulletLines.length >= 2) {
        return {
            bullets: bulletLines.map(l => l.replace(/^[-•*]\s+/, '')),
            raw: statement,
        };
    }

    // Strategy 3: Plain text
    return { bullets: [], raw: statement };
}
