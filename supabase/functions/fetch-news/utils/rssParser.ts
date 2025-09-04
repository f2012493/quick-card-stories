
// Comprehensive CDATA cleaning function
const cleanCDATAContent = (text: string, sourceName: string, fieldType: string): string => {
  if (!text) return text;
  
  let cleaned = text;
  
  try {
    // Multiple CDATA removal patterns to handle malformed or nested CDATA
    const cdataPatterns = [
      /<!\[CDATA\[(.*?)\]\]>/gs,           // Standard CDATA
      /<!\[CDATA\[(.*?)$/gs,               // Unclosed CDATA (malformed)
      /^(.*?)\]\]>/gs,                     // CDATA end without start (malformed)
      /&lt;!\[CDATA\[(.*?)\]\]&gt;/gs,    // HTML-encoded CDATA
      /\[CDATA\[(.*?)\]\]/gs,              // CDATA without proper tags
    ];
    
    cdataPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, (match, content) => {
        return content || match; // Return content if captured, otherwise original match
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
      .trim();
    
    // Special handling for Economic Times which often has encoding issues
    if (sourceName === 'Economic Times') {
      cleaned = cleaned
        .replace(/â‚¹/g, '₹')          // Rupee symbol
        .replace(/per cent/g, '%')     // Economic Times specific
        .replace(/crore/g, 'crore')    // Ensure proper crore formatting
        .replace(/lakh/g, 'lakh');     // Ensure proper lakh formatting
    }
    
    // Log problematic content for debugging
    if (text !== cleaned && (text.includes('CDATA') || text.includes('â€'))) {
      console.log(`[${sourceName}] CDATA/encoding cleaned in ${fieldType}:`, {
        original: text.substring(0, 100),
        cleaned: cleaned.substring(0, 100)
      });
    }
    
  } catch (error) {
    console.warn(`[${sourceName}] Error cleaning CDATA from ${fieldType}:`, error);
    // Fallback: simple CDATA removal
    cleaned = text.replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1');
  }
  
  return cleaned;
};

export const parseRSSFeed = (xmlText: string, sourceName: string): any[] => {
  try {
    // Clean the XML text first
    const cleanXml = xmlText.replace(/^\uFEFF/, '').trim(); // Remove BOM
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(cleanXml, 'text/xml');
    
    // Check for parsing errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      console.error(`XML parsing error for ${sourceName}:`, parserError.textContent);
      return [];
    }
    
    // Try different RSS/Atom formats
    let items = doc.querySelectorAll('item'); // RSS format
    if (items.length === 0) {
      items = doc.querySelectorAll('entry'); // Atom format
    }
    
    if (items.length === 0) {
      console.warn(`No items found in ${sourceName} feed`);
      return [];
    }
    
    return Array.from(items).slice(0, 10).map((item, index) => {
      // Handle both RSS and Atom formats
      let title = item.querySelector('title')?.textContent?.trim() || 'News Update';
      
      // Comprehensive CDATA cleaning for title
      title = cleanCDATAContent(title, sourceName, 'title');
      
      // Description handling for different formats
      let description = '';
      const descElem = item.querySelector('description') || 
                      item.querySelector('summary') || 
                      item.querySelector('content');
      if (descElem) {
        description = descElem.textContent?.trim() || '';
        
        // Comprehensive CDATA cleaning for description
        description = cleanCDATAContent(description, sourceName, 'description');
        
        // Clean HTML tags if present
        description = description.replace(/<[^>]*>/g, '').trim();
      }
      
      // Link handling
      let link = '';
      const linkElem = item.querySelector('link');
      if (linkElem) {
        link = linkElem.textContent?.trim() || linkElem.getAttribute('href') || '';
      }
      
      // Date handling
      let publishedAt = new Date().toISOString();
      const dateElem = item.querySelector('pubDate') || 
                      item.querySelector('published') || 
                      item.querySelector('updated');
      if (dateElem) {
        const dateStr = dateElem.textContent?.trim();
        if (dateStr) {
          const parsedDate = new Date(dateStr);
          if (!isNaN(parsedDate.getTime())) {
            publishedAt = parsedDate.toISOString();
          }
        }
      }
      
      // Image handling
      let imageUrl = '';
      const mediaContent = item.querySelector('media\\:content, content[type*="image"]');
      if (mediaContent) {
        imageUrl = mediaContent.getAttribute('url') || '';
      } else {
        const enclosure = item.querySelector('enclosure[type*="image"]');
        if (enclosure) {
          imageUrl = enclosure.getAttribute('url') || '';
        }
      }
      
      return {
        title: title,
        description: description,
        url: link,
        source: { name: sourceName },
        urlToImage: imageUrl,
        publishedAt: publishedAt,
        author: sourceName
      };
    }).filter(article => article.title !== 'News Update' && article.title.length > 5);
    
  } catch (error) {
    console.error(`Failed to parse RSS from ${sourceName}:`, error);
    return [];
  }
};
