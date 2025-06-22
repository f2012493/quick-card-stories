
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RelatedNewsRequest {
  headline: string;
  category: string;
  keywords?: string[];
}

interface RelatedNewsItem {
  headline: string;
  source: string;
  url: string;
  publishedAt: string;
  summary: string;
  score: number;
  cluster?: string;
}

interface StoryCluster {
  mainStory: RelatedNewsItem;
  relatedArticles: RelatedNewsItem[];
  clusterScore: number;
  topics: string[];
}

const extractSemanticKeywords = (headline: string, category: string): string[] => {
  // Enhanced keyword extraction with semantic understanding
  const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'will', 'has', 'have', 'had', 'says', 'said', 'reports', 'news'];
  
  // Extract entities, actions, and significant terms
  const words = headline.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => 
      word.length > 2 && 
      !commonWords.includes(word) &&
      /^[a-zA-Z]+$/.test(word)
    );
  
  // Priority keywords based on category
  const categoryKeywords = {
    'tech': ['technology', 'ai', 'artificial', 'intelligence', 'software', 'digital', 'cyber', 'data'],
    'politics': ['government', 'election', 'policy', 'parliament', 'minister', 'political', 'vote'],
    'business': ['economy', 'market', 'financial', 'company', 'corporate', 'trade', 'economic'],
    'health': ['medical', 'health', 'hospital', 'doctor', 'treatment', 'disease', 'vaccine'],
    'sports': ['match', 'game', 'player', 'team', 'championship', 'tournament', 'score']
  };
  
  const catWords = categoryKeywords[category.toLowerCase()] || [];
  const priorityWords = words.filter(word => catWords.some(cat => word.includes(cat) || cat.includes(word)));
  
  // Combine priority words with general keywords
  const allKeywords = [...new Set([...priorityWords, ...words.slice(0, 6)])];
  return allKeywords.slice(0, 8);
};

const calculateSourceAuthority = (source: string): number => {
  // Authority scores for major news sources
  const authorityMap: { [key: string]: number } = {
    'BBC': 0.95, 'Reuters': 0.93, 'Associated Press': 0.92, 'CNN': 0.85,
    'The Guardian': 0.88, 'The Times': 0.87, 'Washington Post': 0.86,
    'New York Times': 0.89, 'Bloomberg': 0.84, 'Financial Times': 0.83,
    'NPR': 0.82, 'Wall Street Journal': 0.85, 'ABC News': 0.80,
    'CBS News': 0.79, 'NBC News': 0.78, 'Fox News': 0.75,
    'Times of India': 0.77, 'The Hindu': 0.78, 'Indian Express': 0.76,
    'NDTV': 0.74, 'Hindustan Times': 0.73
  };
  
  const sourceLower = source.toLowerCase();
  for (const [authorSource, score] of Object.entries(authorityMap)) {
    if (sourceLower.includes(authorSource.toLowerCase())) {
      return score;
    }
  }
  return 0.5; // Default score for unknown sources
};

const calculateFreshnessScore = (publishedAt: string): number => {
  const published = new Date(publishedAt);
  const now = new Date();
  const hoursOld = (now.getTime() - published.getTime()) / (1000 * 60 * 60);
  
  if (hoursOld < 1) return 1.0;
  if (hoursOld < 6) return 0.9;
  if (hoursOld < 12) return 0.8;
  if (hoursOld < 24) return 0.7;
  if (hoursOld < 48) return 0.5;
  return 0.3;
};

const calculateSemanticSimilarity = (headline1: string, headline2: string): number => {
  const words1 = new Set(headline1.toLowerCase().split(/\s+/));
  const words2 = new Set(headline2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
};

const searchRelatedNews = async (keywords: string[], category: string, originalHeadline: string): Promise<RelatedNewsItem[]> => {
  const newsApiKey = Deno.env.get('NEWS_API_KEY') || '0043c6873e3d42e7a36db1d1a840d818';
  const newsDataApiKey = Deno.env.get('NEWS_DATA_API_KEY') || 'pub_cb335a5f57774d94927cfdc70ae36cd6';
  
  const relatedArticles: RelatedNewsItem[] = [];
  
  try {
    // Search with primary keywords
    const primaryQuery = keywords.slice(0, 3).join(' OR ');
    const newsApiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(primaryQuery)}&sortBy=relevancy&pageSize=15&language=en&apiKey=${newsApiKey}`;
    
    console.log('Searching with enhanced semantic query:', primaryQuery);
    
    const response = await fetch(newsApiUrl);
    const data = await response.json();
    
    if (data.articles && data.articles.length > 0) {
      data.articles.forEach((article: any) => {
        if (article.title && article.title !== originalHeadline) {
          const freshnessScore = calculateFreshnessScore(article.publishedAt);
          const authorityScore = calculateSourceAuthority(article.source?.name || 'Unknown');
          const semanticSimilarity = calculateSemanticSimilarity(originalHeadline, article.title);
          
          // Weighted scoring: freshness (30%), authority (40%), similarity (30%)
          const overallScore = (freshnessScore * 0.3) + (authorityScore * 0.4) + (semanticSimilarity * 0.3);
          
          relatedArticles.push({
            headline: article.title,
            source: article.source?.name || 'Unknown Source',
            url: article.url,
            publishedAt: article.publishedAt,
            summary: article.description?.substring(0, 120) + '...' || 'No summary available',
            score: overallScore
          });
        }
      });
    }
    
    // Search NewsData.io for additional coverage if needed
    if (relatedArticles.length < 8) {
      try {
        const newsDataUrl = `https://newsdata.io/api/1/latest?apikey=${newsDataApiKey}&q=${encodeURIComponent(keywords[0])}&language=en&size=10`;
        
        const newsDataResponse = await fetch(newsDataUrl);
        const newsDataData = await newsDataResponse.json();
        
        if (newsDataData.results) {
          newsDataData.results.forEach((article: any) => {
            if (article.title && article.title !== originalHeadline && relatedArticles.length < 12) {
              const freshnessScore = calculateFreshnessScore(article.pubDate);
              const authorityScore = calculateSourceAuthority(article.source_id || 'Unknown');
              const semanticSimilarity = calculateSemanticSimilarity(originalHeadline, article.title);
              
              const overallScore = (freshnessScore * 0.3) + (authorityScore * 0.4) + (semanticSimilarity * 0.3);
              
              relatedArticles.push({
                headline: article.title,
                source: article.source_id || 'News Source',
                url: article.link,
                publishedAt: article.pubDate,
                summary: article.description?.substring(0, 120) + '...' || 'No summary available',
                score: overallScore
              });
            }
          });
        }
      } catch (error) {
        console.error('NewsData.io search failed:', error);
      }
    }
    
  } catch (error) {
    console.error('Error in enhanced news search:', error);
  }
  
  return relatedArticles;
};

const clusterStories = (articles: RelatedNewsItem[], originalHeadline: string): StoryCluster[] => {
  const clusters: StoryCluster[] = [];
  const processed = new Set<number>();
  
  articles.forEach((article, index) => {
    if (processed.has(index)) return;
    
    const cluster: StoryCluster = {
      mainStory: article,
      relatedArticles: [],
      clusterScore: article.score,
      topics: extractSemanticKeywords(article.headline, '')
    };
    
    // Find similar articles for this cluster
    articles.forEach((otherArticle, otherIndex) => {
      if (index !== otherIndex && !processed.has(otherIndex)) {
        const similarity = calculateSemanticSimilarity(article.headline, otherArticle.headline);
        
        if (similarity > 0.3) { // Similarity threshold
          cluster.relatedArticles.push(otherArticle);
          cluster.clusterScore = Math.max(cluster.clusterScore, otherArticle.score);
          processed.add(otherIndex);
        }
      }
    });
    
    processed.add(index);
    clusters.push(cluster);
  });
  
  // Sort clusters by score and return top clusters
  return clusters
    .sort((a, b) => b.clusterScore - a.clusterScore)
    .slice(0, 5);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { headline, category, keywords }: RelatedNewsRequest = await req.json();
    
    console.log('Fetching semantically clustered related news for:', headline);

    // Extract enhanced semantic keywords
    const searchKeywords = keywords && keywords.length > 0 
      ? keywords 
      : extractSemanticKeywords(headline, category);
    
    // Search for related articles with enhanced scoring
    const relatedArticles = await searchRelatedNews(searchKeywords, category, headline);
    
    // Cluster similar stories
    const storyClusters = clusterStories(relatedArticles, headline);
    
    // Flatten clusters back to articles for display, maintaining diversity
    const clusteredNews: RelatedNewsItem[] = [];
    storyClusters.forEach(cluster => {
      clusteredNews.push(cluster.mainStory);
      // Add up to 1 related article per cluster for diversity
      if (cluster.relatedArticles.length > 0) {
        clusteredNews.push(cluster.relatedArticles[0]);
      }
    });
    
    console.log(`Clustered ${clusteredNews.length} articles into ${storyClusters.length} story groups`);

    return new Response(
      JSON.stringify({
        relatedNews: clusteredNews.slice(0, 8),
        keywords: searchKeywords,
        clusters: storyClusters.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in enhanced get-related-news function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
