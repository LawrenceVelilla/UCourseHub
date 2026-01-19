/**
 * Utility functions for Professor and Course data processing
 */

const DEPARTMENT_MAPPING: Record<string, string> = {
    'Computing Science': 'Computer Science',
    'Psychology Dept': 'Psychology'
};

export function normalizeDepartment(ualbertaDept: string): string {
    return DEPARTMENT_MAPPING[ualbertaDept] || ualbertaDept;
}

export function normalizeName(name: string): string {
    return name.toLowerCase().replace(/^(dr\.?|prof\.?|professor)\s*/i, '')
        .replace(/,?\s*(ph\.?d\.?|phd|m\.?sc?\.?|m\.?a\.?|b\.?sc?\.?)$/i, '')
        .replace(/\s+/g, ' ').trim();
}


export function parseNameParts(fullName: string): { firstName: string; lastName: string; middleParts: string[] } {
    const normalized = normalizeName(fullName);
    const parts = normalized.split(' ').filter(p => p.length > 0);

    if (parts.length === 1) {
        return { firstName: '', lastName: parts[0], middleParts: [] };
    }

    // Handle "Last, First" format
    if (fullName.includes(',')) {
        const [lastName, ...firstParts] = fullName.split(',').map(p => p.trim());
        const cleanedFirstParts = normalizeName(firstParts.join(' ')).split(' ').filter(p => p.length > 0);
        return {
            firstName: cleanedFirstParts[0] || '',
            lastName: normalizeName(lastName),
            middleParts: cleanedFirstParts.slice(1)
        };
    }

    // Handle "First Middle Last" format
    // First part is first name, last part is last name, everything in between is middle
    const firstName = parts[0];
    const lastName = parts[parts.length - 1];
    const middleParts = parts.slice(1, -1);

    return { firstName, lastName, middleParts };
}

export function firstNamesMatch(name1: string, name2: string): boolean {
    const n1 = name1.toLowerCase().trim();
    const n2 = name2.toLowerCase().trim();

    if (n1 === n2) return true;

    if (n1.length === 1 && n2.startsWith(n1)) return true;
    if (n2.length === 1 && n1.startsWith(n2)) return true;

    return false;
}

export function extractCourseCode(courseName: string): string | null {
    const regex = /^([A-Z]{2,8})\s*(\d{3}[A-Z]?)/i;
    const match = courseName.match(regex);

    if (!match) {
        return null;
    }
    return `${match[1].toUpperCase()} ${match[2].toUpperCase()}`;
}
