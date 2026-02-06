const DEPARTMENT_MAPPING: Record<string, string> = {
    'Computing Science': 'Computer Science',
    'Psychology Dept': 'Psychology'
};

const NICKNAME_MAP: Record<string, string[]> = {
    'elizabeth': ['beth', 'liz', 'lizzy', 'betty', 'eliza'],
    'william': ['bill', 'will', 'willy', 'billy'],
    'robert': ['bob', 'rob', 'bobby', 'robbie'],
    'richard': ['dick', 'rich', 'rick', 'ricky'],
    'michael': ['mike', 'mick', 'mickey'],
    'christopher': ['chris'],
    'alexander': ['alex', 'al', 'sandy'],
    'katherine': ['kate', 'kathy', 'katie', 'kat'],
    'margaret': ['maggie', 'meg', 'peggy'],
    'patricia': ['pat', 'patty', 'tricia'],
    'jennifer': ['jen', 'jenny'],
    'anthony': ['tony'],
    'benjamin': ['ben', 'benny'],
    'daniel': ['dan', 'danny'],
    'matthew': ['matt'],
    'joseph': ['joe', 'joey'],
    'jonathan': ['jon'],
    'nicholas': ['nick'],
    'theodore': ['ted', 'teddy', 'theo'],
    'thomas': ['tom', 'tommy'],
    'timothy': ['tim', 'timmy'],
    'andrew': ['andy', 'drew'],
    'charles': ['charlie', 'chuck'],
    'edward': ['ed', 'eddie', 'ted'],
    'james': ['jim', 'jimmy', 'jamie'],
    'david': ['dave', 'davy'],
    'lawrence': ['larry'],
    'douglas': ['doug'],
    'gregory': ['greg'],
    'stephen': ['steve', 'stevie'],
    'vincent': ['vince', 'vinny'],
};

const NICKNAME_TO_FORMAL = new Map<string, Set<string>>();
for (const [formal, nicknames] of Object.entries(NICKNAME_MAP)) {
    for (const nickname of nicknames) {
        if (!NICKNAME_TO_FORMAL.has(nickname)) {
            NICKNAME_TO_FORMAL.set(nickname, new Set());
        }
        NICKNAME_TO_FORMAL.get(nickname)!.add(formal);
    }
}

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

    if (fullName.includes(',')) {
        const [lastName, ...firstParts] = fullName.split(',').map(p => p.trim());
        const cleanedFirstParts = normalizeName(firstParts.join(' ')).split(' ').filter(p => p.length > 0);
        return {
            firstName: cleanedFirstParts[0] || '',
            lastName: normalizeName(lastName),
            middleParts: cleanedFirstParts.slice(1)
        };
    }

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
    if (NICKNAME_MAP[n1]?.includes(n2)) return true;
    if (NICKNAME_MAP[n2]?.includes(n1)) return true;

    const n1Formals = NICKNAME_TO_FORMAL.get(n1);
    const n2Formals = NICKNAME_TO_FORMAL.get(n2);
    if (n1Formals && n2Formals) {
        for (const formal of n1Formals) {
            if (n2Formals.has(formal)) return true;
        }
    }

    return false;
}

export function extractCourseCode(courseName: string): string | null {
    const regex = /^([A-Z]{2,8})\s*(\d{3}[A-Z]?)/i;
    const match = courseName.match(regex);
    if (!match) return null;
    return `${match[1].toUpperCase()} ${match[2].toUpperCase()}`;
}
