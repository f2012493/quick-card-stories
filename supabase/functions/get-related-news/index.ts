
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
  perspective?: string;
}

interface CoverageCluster {
  mainStory: RelatedNewsItem;
  perspectives: RelatedNewsItem[];
  sources: string[];
  coverage_score: number;
}

const extractNewsEntities = (headline: string): string[] => {
  // Extract key entities like people, places, organizations, events
  const words = headline.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
  
  // Common stop words to remove
  const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'will', 'has', 'have', 'had', 'says', 'said', 'reports', 'news', 'after', 'over', 'from', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'up', 'down', 'out', 'off', 'under', 'again', 'further', 'then', 'once'];
  
  // Filter out stop words and prioritize important terms
  const entities = words.filter(word => 
    !stopWords.includes(word) && 
    /^[a-zA-Z]+$/.test(word)
  );
  
  // Return top entities for search
  return entities.slice(0, 5);
};

const calculateSourceDiversity = (sources: string[]): number => {
  // Prefer diverse source types (local, national, international, different political leanings)
  const sourceTypes = new Set();
  const knownSources = {
    'BBC': 'international',
    'CNN': 'national_us',
    'Fox News': 'national_us_conservative',
    'Reuters': 'international_wire',
    'Associated Press': 'wire',
    'The Guardian': 'international_liberal',
    'Wall Street Journal': 'national_business',
    'New York Times': 'national_liberal',
    'Washington Post': 'national_liberal',
    'Times of India': 'national_india',
    'NDTV': 'national_india',
    'The Hindu': 'national_india'
  };
  
  sources.forEach(source => {
    const sourceType = knownSources[source] || 'other';
    sourceTypes.add(sourceType);
  });
  
  return sourceTypes.size / Math.max(sources.length, 1);
};

const categorizeArticlePerspective = (headline: string, source: string, summary: string): string => {
  const content = (headline + ' ' + summary).toLowerCase();
  
  // Identify different types of coverage perspectives
  if (content.includes('analysis') || content.includes('opinion') || content.includes('editorial')) {
    return 'analysis';
  }
  if (content.includes('breaking') || content.includes('developing') || content.includes('latest')) {
    return 'breaking';
  }
  if (content.includes('investigation') || content.includes('exclusive') || content.includes('probe')) {
    return 'investigation';
  }
  if (content.includes('reaction') || content.includes('response') || content.includes('statement')) {
    return 'reaction';
  }
  if (content.includes('background') || content.includes('context') || content.includes('explainer')) {
    return 'background';
  }
  
  return 'standard';
};

const searchFullCoverage = async (entities: string[], originalHeadline: string): Promise<RelatedNewsItem[]> => {
  const newsApiKey = Deno.env.get('NEWS_API_KEY') || '0043c6873e3d42e7a36db1d1a840d818';
  const newsDataApiKey = Deno.env.get('NEWS_DATA_API_KEY') || 'pub_cb335a5f57774d94927cfdc70ae36cd6';
  
  const allArticles: RelatedNewsItem[] = [];
  
  try {
    // Search with entity-based queries for full coverage
    const searchQuery = entities.join(' AND ');
    console.log('Searching for full coverage with query:', searchQuery);
    
    // NewsAPI search for comprehensive coverage
    const newsApiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(searchQuery)}&sortBy=relevancy&pageSize=20&language=en&apiKey=${newsApiKey}&from=${getDateDaysAgo(3)}`;
    
    const response = await fetch(newsApiUrl);
    const data = await response.json();
    
    if (data.articles && data.articles.length > 0) {
      data.articles.forEach((article: any) => {
        if (article.title && article.title !== originalHeadline) {
          const perspective = categorizeArticlePerspective(article.title, article.source?.name || '', article.description || '');
          const relevanceScore = calculateRelevanceScore(originalHeadline, article.title, entities);
          
          if (relevanceScore > 0.3) { // Only include relevant articles
            allArticles.push({
              headline: article.title,
              source: article.source?.name || 'Unknown Source',
              url: article.url,
              publishedAt: article.publishedAt,
              summary: article.description?.substring(0, 150) + '...' || 'No summary available',
              score: relevanceScore,
              perspective: perspective
            });
          }
        }
      });
    }
    
    // Additional search with NewsData.io for more diverse sources
    if (allArticles.length < 10) {
      try {
        const newsDataUrl = `https://newsdata.io/api/1/latest?apikey=${newsDataApiKey}&q=${encodeURIComponent(entities[0])}&language=en&size=10`;
        
        const newsDataResponse = await fetch(newsDataUrl);
        const newsDataData = await newsDataResponse.json();
        
        if (newsDataData.results) {
          newsDataData.results.forEach((article: any) => {
            if (article.title && article.title !== originalHeadline) {
              const perspective = categorizeArticlePerspective(article.title, article.source_id || '', article.description || '');
              const relevanceScore = calculateRelevanceScore(originalHeadline, article.title, entities);
              
              if (relevanceScore > 0.3) {
                allArticles.push({
                  headline: article.title,
                  source: article.source_id || 'News Source',
                  url: article.link,
                  publishedAt: article.pubDate,
                  summary: article.description?.substring(0, 150) + '...' || 'No summary available',
                  score: relevanceScore,
                  perspective: perspective
                });
              }
            }
          });
        }
      } catch (error) {
        console.error('NewsData.io search failed:', error);
      }
    }
    
  } catch (error) {
    console.error('Error in full coverage search:', error);
  }
  
  return allArticles;
};

const calculateRelevanceScore = (originalHeadline: string, articleHeadline: string, entities: string[]): number => {
  const originalWords = new Set(originalHeadline.toLowerCase().split(/\s+/));
  const articleWords = new Set(articleHeadline.toLowerCase().split(/\s+/));
  
  // Calculate word overlap
  const intersection = new Set([...originalWords].filter(x => articleWords.has(x)));
  const wordOverlap = intersection.size / Math.max(originalWords.size, articleWords.size);
  
  // Calculate entity overlap
  let entityOverlap = 0;
  entities.forEach(entity => {
    if (articleHeadline.toLowerCase().includes(entity)) {
      entityOverlap += 1;
    }
  });
  entityOverlap = entityOverlap / entities.length;
  
  // Combined score: 60% entity overlap, 40% word overlap
  return (entityOverlap * 0.6) + (wordOverlap * 0.4);
};

const getDateDaysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

const organizeCoverageByPerspective = (articles: RelatedNewsItem[]): CoverageCluster => {
  // Group articles by perspective and source diversity
  const perspectiveGroups: { [key: string]: RelatedNewsItem[] } = {};
  const allSources = new Set<string>();
  
  articles.forEach(article => {
    const perspective = article.perspective || 'standard';
    if (!perspectiveGroups[perspective]) {
      perspectiveGroups[perspective] = [];
    }
    perspectiveGroups[perspective].push(article);
    allSources.add(article.source);
  });
  
  // Select diverse perspectives and sources
  const selectedArticles: RelatedNewsItem[] = [];
  const usedSources = new Set<string>();
  
  // Prioritize different perspectives
  const perspectivePriority = ['breaking', 'analysis', 'investigation', 'reaction', 'background', 'standard'];
  
  perspectivePriority.forEach(perspective => {
    if (perspectiveGroups[perspective]) {
      // Sort by score and pick the best from each source
      const sortedByScore = perspectiveGroups[perspective]
        .sort((a, b) => b.score - a.score);
      
      sortedByScore.forEach(article => {
        if (!usedSources.has(article.source) && selectedArticles.length < 8) {
          selectedArticles.push(article);
          usedSources.add(article.source);
        }
      });
    }
  });
  
  // If we still need more articles, add remaining high-scoring ones
  if (selectedArticles.length < 8) {
    const remaining = articles
      .filter(article => !selectedArticles.includes(article))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8 - selectedArticles.length);
    
    selectedArticles.push(...remaining);
  }
  
  const diversityScore = calculateSourceDiversity(Array.from(allSources));
  
  return {
    mainStory: selectedArticles[0],
    perspectives: selectedArticles.slice(1),
    sources: Array.from(allSources),
    coverage_score: diversityScore
  };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { headline, category }: RelatedNewsRequest = await req.json();
    
    console.log('Fetching full coverage for:', headline);

    // Extract key entities from headline for comprehensive search
    const entities = extractNewsEntities(headline);
    console.log('Extracted entities:', entities);
    
    // Search for full coverage across multiple sources and perspectives
    const coverageArticles = await searchFullCoverage(entities, headline);
    
    // Organize by perspective and source diversity (Google News "Full Coverage" style)
    const fullCoverage = organizeCoverageByPerspective(coverageArticles);
    
    console.log(`Found full coverage: ${fullCoverage.perspectives.length + 1} articles from ${fullCoverage.sources.length} sources`);

    return new Response(
      JSON.stringify({
        relatedNews: [fullCoverage.mainStory, ...fullCoverage.perspectives],
        entities: entities,
        sources: fullCoverage.sources.length,
        coverage_quality: fullCoverage.coverage_score
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in full coverage function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
