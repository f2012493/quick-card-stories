
// Utility for extracting full article content from various news sources
export const extractFullContent = async (url: string, sourceName: string): Promise<string> => {
  try {
    // Use a CORS proxy to fetch the full article
    const corsProxies = [
      'https://api.allorigins.win/get?url=',
      'https://corsproxy.io/?',
    ];
    
    for (const proxy of corsProxies) {
      try {
        const proxyUrl = proxy + encodeURIComponent(url);
        const response = await fetch(proxyUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          signal: AbortSignal.timeout(15000) // Increased timeout
        });
        
        if (!response.ok) continue;
        
        let html;
        if (proxy.includes('allorigins')) {
          const data = await response.json();
          html = data.contents;
        } else {
          html = await response.text();
        }
        
        // Extract article content based on source
        const content = extractContentFromHTML(html, sourceName);
        if (content && content.length > 200) {
          return content;
        }
      } catch (error) {
        console.warn(`Failed to extract content with ${proxy}:`, error);
        continue;
      }
    }
    
    return '';
  } catch (error) {
    console.error('Content extraction failed:', error);
    return '';
  }
};

const extractContentFromHTML = (html: string, sourceName: string): string => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Remove unwanted elements
    const unwantedSelectors = [
      'script', 'style', 'nav', 'header', 'footer', 
      '.advertisement', '.ad', '.social-share',
      '.related-articles', '.comments', '.sidebar',
      '.newsletter-signup', '.social-media',
      '[class*="ad-"]', '[id*="ad-"]',
      '.cookie-banner', '.subscription-popup'
    ];
    
    unwantedSelectors.forEach(selector => {
      const elements = doc.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });
    
    // Try different content selectors based on common news site patterns
    const contentSelectors = [
      'article p',
      '.article-content p',
      '.story-body p',
      '.post-content p',
      '.entry-content p',
      '.content p',
      '[data-testid="article-body"] p',
      '.article-body p',
      '.main-content p',
      '.news-content p',
      '.article-text p',
      '.story-content p'
    ];
    
    for (const selector of contentSelectors) {
      const paragraphs = doc.querySelectorAll(selector);
      if (paragraphs.length > 2) {
        let content = '';
        paragraphs.forEach(p => {
          const text = p.textContent?.trim();
          if (text && text.length > 30 && !isUnwantedContent(text)) {
            content += text + '\n\n';
          }
        });
        
        if (content.length > 500) {
          return cleanExtractedContent(content);
        }
      }
    }
    
    // Fallback: get all paragraphs
    const allParagraphs = doc.querySelectorAll('p');
    let content = '';
    allParagraphs.forEach(p => {
      const text = p.textContent?.trim();
      if (text && text.length > 30 && !isUnwantedContent(text)) {
        content += text + '\n\n';
      }
    });
    
    return cleanExtractedContent(content);
  } catch (error) {
    console.error('HTML parsing failed:', error);
    return '';
  }
};

const isUnwantedContent = (text: string): boolean => {
  const unwantedPatterns = [
    /cookie/i,
    /subscribe/i,
    /advertisement/i,
    /follow us/i,
    /share this/i,
    /read more/i,
    /click here/i,
    /download app/i,
    /sign up/i,
    /newsletter/i,
    /email/i,
    /login/i,
    /register/i
  ];
  
  return unwantedPatterns.some(pattern => pattern.test(text)) || 
         text.length < 30 || 
         text.split(' ').length < 5;
};

const cleanExtractedContent = (content: string): string => {
  return content
    .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
    .replace(/\s{2,}/g, ' ') // Remove excessive spaces
    .replace(/^\s+|\s+$/gm, '') // Trim each line
    .trim()
    .substring(0, 5000); // Increased content length limit for full articles
};
