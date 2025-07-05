
export const getContextualPlaceholder = (headline: string, description: string = ''): string => {
  const content = `${headline} ${description}`.toLowerCase();
  
  // Business/Economy themed images
  if (content.includes('economy') || content.includes('market') || content.includes('business') || content.includes('financial')) {
    return `https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80`;
  }
  
  // Technology themed images
  if (content.includes('technology') || content.includes('ai') || content.includes('digital') || content.includes('startup')) {
    return `https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80`;
  }
  
  // Politics/Government themed images
  if (content.includes('modi') || content.includes('bjp') || content.includes('congress') || content.includes('election') || content.includes('government')) {
    return `https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80`;
  }
  
  // Healthcare themed images
  if (content.includes('health') || content.includes('medical') || content.includes('hospital') || content.includes('vaccine')) {
    return `https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80`;
  }
  
  // Environment/Climate themed images
  if (content.includes('climate') || content.includes('environment') || content.includes('pollution') || content.includes('green')) {
    return `https://images.unsplash.com/photo-1569163139394-de44cb33c2a0?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80`;
  }
  
  // City/Urban themed images for city-specific news
  if (content.includes('mumbai') || content.includes('delhi') || content.includes('bangalore') || content.includes('chennai')) {
    return `https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80`;
  }
  
  // Default news/breaking news image
  return `https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80`;
};
