/**
 * Utility functions to encode/decode RMP IDs
 */


/**
 * Encodes a department ID to RMP's base64 format
 * @param departmentId - Numeric department ID (e.g., "11")
 * @returns Base64 encoded string (e.g., "RGVwYXJ0bWVudC0xMQ==")
 */
export function encodeDepartmentId(departmentId: string | number): string {
    const prefixed = `Department-${departmentId}`;
    return Buffer.from(prefixed).toString('base64');
}

/**
 * Decodes a base64 department ID to numeric ID
 * @param encoded - Base64 encoded department ID
 * @returns Numeric department ID (e.g., "11")
 */
export function decodeDepartmentId(encoded: string): string {
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
    return decoded.replace('Department-', '');
}

/**
 * Examples:
 *
 * encodeDepartmentId("11")         → "RGVwYXJ0bWVudC0xMQ=="
 * encodeDepartmentId(11)           → "RGVwYXJ0bWVudC0xMQ=="
 *
 * decodeDepartmentId("RGVwYXJ0bWVudC0xMQ==") → "11"
 */
