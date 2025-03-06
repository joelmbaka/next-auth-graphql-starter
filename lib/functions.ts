/**
 * Extracts username from email address
 * @param email - The email address to extract username from
 * @returns The username part of the email (before @)
 */
export function extractUsernameFromEmail(email: string): string {
    if (!email) return '';
    return email.split('@')[0];
}
