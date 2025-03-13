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



export function formatNumber(num: string | number | undefined): string {
  const number = typeof num === 'string' ? parseFloat(num) : num || 0;
  if (isNaN(number)) return 'N/A';
  
  if (number >= 1000000) {
    return `${(number / 1000000).toFixed(1)}M`;
  }
  if (number >= 1000) {
    return `${(number / 1000).toFixed(1)}K`;
  }
  return number.toString();
}



export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString();
}

import { NextRequest } from 'next/server';

/**
 * Extracts the subdomain from the request when using lvh.me.
 * For example, "mybusiness.lvh.me:3000" returns "mybusiness".
 */
export function getSubdomain(req: NextRequest): string | null {
  const host = req.headers.get('host') || '';
  const hostname = host.split(':')[0]; // Remove port if present
  const parts = hostname.split('.');
  // Expecting ["subdomain", "lvh", "me"]
  if (parts.length === 3 && parts[1] === 'lvh' && parts[2] === 'me') {
    return parts[0];
  }
  return null;
}



