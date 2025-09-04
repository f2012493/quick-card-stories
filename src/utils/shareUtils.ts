interface ShareData {
  title: string;
  text: string;
  url: string;
}

export const shareArticle = async (shareData: ShareData): Promise<void> => {
  try {
    // Try native share first (mobile devices)
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }
    
    // Fallback to clipboard
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareData.url);
      alert('Link copied to clipboard!');
      return;
    }
    
    // Final fallback - create temporary input element
    const tempInput = document.createElement('input');
    tempInput.value = shareData.url;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    alert('Link copied to clipboard!');
    
  } catch (error) {
    console.error('Share failed:', error);
    alert('Unable to share. Please copy the URL manually.');
  }
};

export interface SavedArticle {
  id: string;
  headline: string;
  tldr: string;
  author: string;
  imageUrl: string;
  sourceUrl?: string;
  savedAt: string;
}

export const saveArticle = (article: Omit<SavedArticle, 'savedAt'>): boolean => {
  try {
    const savedArticles = getSavedArticles();
    
    // Check if already saved
    const isAlreadySaved = savedArticles.some(saved => saved.id === article.id);
    
    if (isAlreadySaved) {
      alert('Article already saved!');
      return false;
    }
    
    const articleToSave: SavedArticle = {
      ...article,
      savedAt: new Date().toISOString()
    };
    
    savedArticles.push(articleToSave);
    localStorage.setItem('savedArticles', JSON.stringify(savedArticles));
    alert('Article saved successfully!');
    return true;
    
  } catch (error) {
    console.error('Error saving article:', error);
    alert('Failed to save article. Please try again.');
    return false;
  }
};

export const getSavedArticles = (): SavedArticle[] => {
  try {
    return JSON.parse(localStorage.getItem('savedArticles') || '[]');
  } catch (error) {
    console.error('Error loading saved articles:', error);
    return [];
  }
};

export const removeSavedArticle = (articleId: string): boolean => {
  try {
    const savedArticles = getSavedArticles();
    const filteredArticles = savedArticles.filter(article => article.id !== articleId);
    localStorage.setItem('savedArticles', JSON.stringify(filteredArticles));
    return true;
  } catch (error) {
    console.error('Error removing saved article:', error);
    return false;
  }
};