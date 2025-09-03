
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
      // Remove CDATA sections from title
      title = title.replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1');
      
      // Description handling for different formats
      let description = '';
      const descElem = item.querySelector('description') || 
                      item.querySelector('summary') || 
                      item.querySelector('content');
      if (descElem) {
        description = descElem.textContent?.trim() || '';
        // Remove CDATA sections
        description = description.replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1');
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
