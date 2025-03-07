/**
 * Extracts username from email address
 * @param email - The email address to extract username from
 * @returns The username part of the email (before @)
 */
export function extractUsernameFromEmail(email: string): string {
    if (!email) return '';
    return email.split('@')[0];
}

export function getCountryFlag(countryCode?: string) {
  if (!countryCode) {
    return '/images/default-flag.svg'; // Add a default flag image
  }
  return `https://flagcdn.com/${countryCode.toLowerCase()}.svg`;
}
