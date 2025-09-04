
const unwantedPhrases = [
  'only available in paid plans',
  'subscribe to continue reading',
  'premium content',
  'the news mill',
  'breaking news',
  'read more',
  'click here',
  'advertisement',
  'sponsored content',
  'paywall',
  'sign up',
  'login required',
  'subscription required',
  'premium subscription',
  'free trial',
  'upgrade to premium',
  'full access',
  'unlimited access',
  'get latest articles',
  'follow us',
  'subscribe now',
  'continue reading',
  'developing story',
  'stay tuned',
  'more details expected',
  'developing news story',
  'situation continues to evolve',
  'closely monitored',
  'stakeholders for further updates',
  'multiple factors and stakeholders',
  'officials and experts analyze',
  'implications and next steps',
  'being analyzed',
  'continue to monitor',
  'updates as it develops',
  'this represents a notable development',
  'this development is being',
  'the situation continues',
  'more information becomes available',
  'authorities and stakeholders',
  'relevant authorities',
  'situation as it updates',
  'news development involves',
  'continues to evolve',
  'being closely monitored',
  'key development involving',
  'situation involving',
  'development in',
  'notable development',
  'significant development',
  'mobile app',
  'onelink.to',
  'youtube',
  'download app',
  'app store',
  'google play',
  'breaking-news',
  'n180c_',
  '_indian18oc_',
  'desc-youtube'
];

export const cleanGarbageText = (text: string): string => {
  if (!text) return '';
  
  let cleaned = text.trim();
  
  // Comprehensive CDATA removal with multiple patterns
  const cdataPatterns = [
    /<!\[CDATA\[(.*?)\]\]>/gs,           // Standard CDATA
    /<!\[CDATA\[(.*?)$/gs,               // Unclosed CDATA (malformed)
    /^(.*?)\]\]>/gs,                     // CDATA end without start (malformed)
    /&lt;!\[CDATA\[(.*?)\]\]&gt;/gs,    // HTML-encoded CDATA
    /\[CDATA\[(.*?)\]\]/gs,              // CDATA without proper tags
  ];
  
  cdataPatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, (match, content) => {
      return content || ''; // Return content if captured, empty string otherwise
    });
  });
  
  // Handle UTF-8 and special characters
  cleaned = cleaned
    .replace(/â€™/g, "'")           // Smart apostrophe
    .replace(/â€œ/g, '"')           // Smart quote start
    .replace(/â€/g, '"')            // Smart quote end
    .replace(/â€"/g, '—')           // Em dash
    .replace(/â€"/g, '–')           // En dash
    .replace(/Â/g, '')              // Non-breaking space artifacts
    .replace(/\u00A0/g, ' ')        // Non-breaking space
    .replace(/\u2019/g, "'")        // Right single quotation mark
    .replace(/\u201C/g, '"')        // Left double quotation mark
    .replace(/\u201D/g, '"')        // Right double quotation mark
    .replace(/\u2013/g, '–')        // En dash
    .replace(/\u2014/g, '—')        // Em dash
    .replace(/\u2026/g, '...')      // Horizontal ellipsis
    .replace(/â‚¹/g, '₹');          // Rupee symbol
  
  // Remove URLs and app links
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/gi, '');
  cleaned = cleaned.replace(/www\.[^\s]+/gi, '');
  
  // Remove app-related garbage
  cleaned = cleaned.replace(/n180c_[^-]*-?/gi, '');
  cleaned = cleaned.replace(/_indian18oc_[^-]*-?/gi, '');
  cleaned = cleaned.replace(/breaking-newsNews\d+/gi, '');
  cleaned = cleaned.replace(/Mobile App - [^"]+/gi, '');
  cleaned = cleaned.replace(/desc-youtube/gi, '');
  cleaned = cleaned.replace(/onelink\.to\/[^\s]*/gi, '');
  
  // Remove garbage patterns
  unwantedPhrases.forEach(phrase => {
    const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    cleaned = cleaned.replace(regex, '');
  });
  
  // Clean up remaining artifacts
  cleaned = cleaned.replace(/[-_]{2,}/g, ' ');
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  cleaned = cleaned.replace(/^[-\s]+|[-\s]+$/g, '');
  
  return cleaned;
};

export const capitalizeFirstLetter = (text: string): string => {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
};
