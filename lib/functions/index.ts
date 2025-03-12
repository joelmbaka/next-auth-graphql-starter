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



