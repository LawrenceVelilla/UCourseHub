export function encodeDepartmentId(departmentId: string | number): string {
    const prefixed = `Department-${departmentId}`;
    return Buffer.from(prefixed).toString('base64');
}

export function decodeDepartmentId(encoded: string): string {
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
    return decoded.replace('Department-', '');
}
