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

function formatEvent(event: any) {
  // Parse the event's start and end date-times
  const eventStart = new Date(event.start.dateTime);
  const eventEnd = new Date(event.end.dateTime);
  const now = new Date();

  // Format the time (you might have your own formatting function)
  function formatTime(date: Date) {
    // For example, a simple time string format:
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Check if the event has already ended
  if (now > eventEnd) {
    return `You had an event '${event.summary}' from ${formatTime(eventStart)} to ${formatTime(eventEnd)} today.`;
  } else {
    return `You have an event '${event.summary}' from ${formatTime(eventStart)} to ${formatTime(eventEnd)} today.`;
  }
}

