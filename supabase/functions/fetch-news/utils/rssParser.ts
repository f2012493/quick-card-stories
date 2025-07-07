
export const parseRSSFeed = (xmlText: string, sourceName: string): any[] => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');
    const items = doc.querySelectorAll('item');
    
    return Array.from(items).slice(0, 5).map(item => ({
      title: item.querySelector('title')?.textContent || 'News Update',
      description: item.querySelector('description')?.textContent || '',
      url: item.querySelector('link')?.textContent?.trim() || '',
      source: { name: sourceName },
      urlToImage: item.querySelector('media\\:content, enclosure')?.getAttribute('url') || '',
      publishedAt: item.querySelector('pubDate')?.textContent || new Date().toISOString(),
      author: sourceName
    }));
  } catch (error) {
    console.error(`Failed to parse RSS from ${sourceName}:`, error);
    return [];
  }
};
