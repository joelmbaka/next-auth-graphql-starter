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


/**
 * 
 * afunction to embedd(in memory), fetch and summarize an article
 * summarize with AI button
 * 
 * langchain
 * scrape.article
 * embedd
 * chatmodel
 * **/

/**
 * function to regenerate and publish article
 * 
 * embedd
 * write with chat prompt model
 * display results
 * publish now button
 * sharemodal- check platform - facebook , x, m
 * 
 */