
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Professional tone utilities for clean, readable content generation
const cleanProfessionalTone = (text: string): string => {
  if (!text) return text;
  
  let cleanText = text;
  
  // Replace overly formal phrases with cleaner alternatives
  const replacements = [
    { formal: /\b(according to|reports indicate|sources say|it is reported)\b/gi, casual: '' },
    { formal: /\b(approximately|roughly)\b/gi, casual: 'around' },
    { formal: /\b(demonstrate|illustrate)\b/gi, casual: 'show' },
    { formal: /\b(commenced|initiated)\b/gi, casual: 'started' },
    { formal: /\b(terminated|concluded)\b/gi, casual: 'ended' },  
    { formal: /\b(utilize|employ)\b/gi, casual: 'use' },
    { formal: /\b(regarding|concerning)\b/gi, casual: 'about' },
    { formal: /\b(subsequent to|following)\b/gi, casual: 'after' },
    { formal: /\b(prior to)\b/gi, casual: 'before' },
    { formal: /\b(in order to)\b/gi, casual: 'to' },
    { formal: /\b(as a result of)\b/gi, casual: 'because of' },
    { formal: /\b(due to the fact that)\b/gi, casual: 'because' }
  ];
  
  replacements.forEach(({ formal, casual }) => {
    cleanText = cleanText.replace(formal, casual);
  });
  
  // Clean up extra spaces and ensure proper capitalization
  cleanText = cleanText
    .replace(/\s+/g, ' ')
    .trim();
  
  // Capitalize first letter if not already capitalized
  if (cleanText && !cleanText.match(/^[A-Z]/)) {
    cleanText = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
  }
  
  return cleanText;
};

// Advanced TLDR generation with proper HTML cleaning and sentence completion
const generateTLDR = (content: string, headline: string = '', description: string = ''): string => {
  if (!content && !headline) return 'No summary available';
  
  // Use content if available, otherwise combine headline and content for richer summaries
  let sourceText = '';
  if (content && content.length > 50) {
    sourceText = content;
  } else if (content && headline) {
    // Combine both for better context when content is short
    sourceText = `${headline}. ${content}`;
  } else {
    sourceText = headline || content || '';
  }
  
  // More aggressive cleaning for better content extraction
  let cleanContent = sourceText
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Remove HTML tags more aggressively
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags first
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove style tags first
    .replace(/<[^>]*>/g, '') // Remove all remaining HTML tags
    .replace(/\[.*?\]/g, '') // Remove [+ chars], [+n chars] type artifacts
    .replace(/\[\+\d+\s*chars?\]/gi, '') // Specifically target [+n chars]
    .replace(/\[Read more\]/gi, '') // Remove [Read more] artifacts
    .replace(/\[Continue reading\]/gi, '') // Remove [Continue reading] artifacts
    .replace(/\[Full story\]/gi, '') // Remove [Full story] artifacts
    // Remove content truncation patterns more aggressively
    .replace(/…\s*\[\+\d+\s*chars?\]/gi, '') // Remove "… [+n chars]"
    .replace(/\.\.\.\s*\[\+\d+\s*chars?\]/gi, '') // Remove "... [+n chars]"
    .replace(/\s*\[\+\d+\s*chars?\].*$/gi, '') // Remove everything from [+n chars] to end
    // Remove truncation patterns like "5870 chars." or "2168 chars."
    .replace(/\s+(?:in\s+a\s+)?\d+\s+chars?\.?\s*$/gi, '') // Remove "in a 5870 chars." or "2168 chars."
    .replace(/\s+\d+\s+chars?\.?\s*$/gi, '') // Remove trailing "5870 chars." patterns
    .replace(/….*$/g, '') // Remove everything after ellipsis
    .replace(/\.\.\.\s*.*$/g, '') // Remove everything after "..."
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\b(click here|read more|continue reading|full story|see more|learn more|find out more)\b.*$/gi, '') // Remove call-to-action endings
    .replace(/^\d+\s*/, '') // Remove leading numbers
    .replace(/\s*\d+\s*$/, '') // Remove trailing numbers and spaces
    .replace(/\s*0\s*$/, '') // Specifically remove trailing "0"
    .replace(/\.\.\.\s*$/, '') // Remove trailing ellipsis
    .replace(/…\s*$/, '') // Remove trailing unicode ellipsis
    .trim();
  
  // Remove common prefixes/suffixes that might be artifacts
  cleanContent = cleanContent
    .replace(/^(summary|tldr|description|story|article):\s*/i, '')
    .replace(/\.\.\.\s*$/, '')
    .replace(/…\s*$/, '')
    .replace(/\s*-\s*$/g, '') // Remove trailing dashes
    .replace(/\s+we\s+are\s+now\s+offici\s*$/gi, '') // Remove incomplete "We are now offici" patterns
    .replace(/\s+what\s+t\s*$/gi, ''); // Remove incomplete "what t" patterns
  
  if (!cleanContent || cleanContent.length < 10) {
    return headline ? cleanProfessionalTone(headline.split(' ').slice(0, 15).join(' ')) + '.' : 'No summary available';
  }
  
  // Smart sentence extraction - only use complete sentences
  const sentences = cleanContent.split(/[.!?]+/).filter(s => {
    const trimmed = s.trim();
    // Filter out very short fragments and incomplete sentences
    return trimmed.length > 20 && 
           !trimmed.match(/\b\w{1,2}$/) && // Not ending with 1-2 letter words (likely incomplete)
           !trimmed.match(/\d+\s*chars?\s*$/i) && // Not ending with char count
           !trimmed.match(/…|\.\.\./) && // No ellipsis indicating truncation
           trimmed.split(/\s+/).length >= 5; // At least 5 words
  });
  
  let summary = '';
  let targetWordCount = 50; // Slightly more room for complete sentences
  
  // Build summary with complete sentences only
  if (sentences.length > 0) {
    let totalWords = 0;
    const selectedSentences = [];
    
    for (const sentence of sentences) {
      const sentenceWords = sentence.trim().split(/\s+/).length;
      if (totalWords + sentenceWords <= targetWordCount) {
        selectedSentences.push(sentence.trim());
        totalWords += sentenceWords;
      } else {
        break; // Stop adding sentences if we'd exceed limit
      }
    }
    
    if (selectedSentences.length > 0) {
      summary = selectedSentences.join('. ');
    } else {
      // If no complete sentences fit, use the first sentence truncated at word boundary
      const firstSentence = sentences[0].trim();
      const words = firstSentence.split(/\s+/);
      if (words.length > targetWordCount) {
        summary = words.slice(0, targetWordCount - 5).join(' '); // Leave room for Gen-Z additions
      } else {
        summary = firstSentence;
      }
    }
  } else {
    // Fallback: use headline if no good sentences found
    summary = headline.split(' ').slice(0, 20).join(' ');
  }
  
  // Apply professional tone transformation
  summary = cleanProfessionalTone(summary);
  
  // Final cleanup and word limit enforcement
  const finalWords = summary.split(/\s+/).filter(word => word.length > 0);
  if (finalWords.length > 60) {
    // Find the last complete sentence within 60 words
    let truncatedSummary = finalWords.slice(0, 60).join(' ');
    const lastSentenceEnd = Math.max(
      truncatedSummary.lastIndexOf('.'),
      truncatedSummary.lastIndexOf('!'),
      truncatedSummary.lastIndexOf('?')
    );
    
    if (lastSentenceEnd > truncatedSummary.length * 0.7) {
      // If we have a sentence ending in the last 30% of the text, use that
      summary = truncatedSummary.substring(0, lastSentenceEnd + 1);
    } else {
      // Otherwise just truncate and add period
      summary = finalWords.slice(0, 58).join(' ') + '.';
    }
  }
  
  // Ensure proper ending
  if (!summary.match(/[.!?]$/)) {
    summary += '.';
  }
  
  return summary;
};

// Import Perplexity analysis utility
const analyzeNewsStory = async (headline: string, content: string, description: string = '') => {
  const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
  
  if (!perplexityApiKey) {
    console.warn('Perplexity API key not found, using fallback analysis');
    return { storyNature: 'other', breakdown: '', confidence: 0.0 };
  }

  try {
    const fullText = `${headline}\n\n${description}\n\n${content}`.trim();
    
    // Analyze story nature and generate breakdown
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a news analysis expert. Analyze the story nature and provide a simple breakdown that helps readers understand complex news.'
          },
          {
            role: 'user',
            content: `Analyze this news story:

Title: ${headline}
Content: ${fullText.substring(0, 1500)}

1. Classify the story nature (choose one): policy_change, scandal, court_judgement, political_move, economic_development, technology_advancement, health_development, environmental_issue, security_incident, international_relations, social_issue, other

2. Provide a simple breakdown (under 300 words) that explains:
   - What happened in simple terms
   - Why it matters to ordinary people
   - What might happen next

Format your response as:
NATURE: [category]
BREAKDOWN: [explanation]`
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
        return_images: false,
        return_related_questions: false
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';
      
      const natureMatch = content.match(/NATURE:\s*([^\n]+)/);
      const breakdownMatch = content.match(/BREAKDOWN:\s*([\s\S]+)/);
      
      return {
        storyNature: natureMatch ? natureMatch[1].trim().toLowerCase() : 'other',
        breakdown: breakdownMatch ? breakdownMatch[1].trim() : '',
        confidence: 0.9
      };
    }
  } catch (error) {
    console.error('Perplexity analysis error:', error);
  }
  
  return { storyNature: 'other', breakdown: '', confidence: 0.0 };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Article {
  title: string;
  content?: string;
  description?: string;
  url: string;
  imageUrl?: string;
  author?: string;
  publishedAt: string;
  source: string;
  category?: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const generateSimpleEmbedding = (text: string): number[] => {
  // Simple hash-based embedding as fallback
  const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  const embedding = new Array(1536).fill(0);
  
  words.forEach((word, index) => {
    const hash = word.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const pos = hash % 1536;
    embedding[pos] = Math.min(1, embedding[pos] + 0.1);
  });
  
  return embedding;
};

const calculateQualityScore = (article: Article): number => {
  let score = 0.5; // Base score

  // Check for clickbait indicators
  const clickbaitWords = ['shocking', 'unbelievable', 'you won\'t believe', 'amazing', 'incredible'];
  const titleLower = article.title.toLowerCase();
  const hasClickbait = clickbaitWords.some(word => titleLower.includes(word));
  
  if (hasClickbait) score -= 0.2;
  if (article.title.includes('?') && article.title.length < 50) score -= 0.1;
  if (article.content && article.content.length > 500) score += 0.2;
  if (article.author) score += 0.1;

  return Math.max(0, Math.min(1, score));
};

// Simple RSS parser for additional news sources
const fetchRSSFeed = async (url: string, sourceName: string): Promise<Article[]> => {
  try {
    console.log(`Fetching RSS from ${sourceName}: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlText = await response.text();
    const articles: Article[] = [];

    // Simple XML parsing for RSS items
    const itemMatches = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];
    
    for (const itemMatch of itemMatches.slice(0, 10)) { // Limit to 10 items per feed
      const title = itemMatch.match(/<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>|<title[^>]*>(.*?)<\/title>/i);
      const link = itemMatch.match(/<link[^>]*>(.*?)<\/link>/i);
      const description = itemMatch.match(/<description[^>]*><!\[CDATA\[(.*?)\]\]><\/description>|<description[^>]*>(.*?)<\/description>/i);
      const pubDate = itemMatch.match(/<pubDate[^>]*>(.*?)<\/pubDate>/i);

      if (title && link) {
        const titleText = title[1] || title[2] || '';
        const linkText = link[1] || '';
        const descText = description ? (description[1] || description[2] || '') : '';
        const pubDateText = pubDate ? pubDate[1] || '' : new Date().toISOString();

        if (titleText.trim() && linkText.trim()) {
          articles.push({
            title: titleText.trim().replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'),
            content: descText.trim().replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'),
            description: descText.trim().replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'),
            url: linkText.trim(),
            imageUrl: '',
            author: sourceName,
            publishedAt: pubDateText,
            source: sourceName,
            category: 'general'
          });
        }
      }
    }

    console.log(`Successfully parsed ${articles.length} articles from ${sourceName}`);
    return articles;
  } catch (error) {
    console.error(`Error fetching RSS from ${sourceName}:`, error);
    return [];
  }
};

const fetchNewsFromAPI = async (countryCode = 'us'): Promise<Article[]> => {
  const newsApiKey = Deno.env.get('NEWS_API_KEY');
  const articles: Article[] = [];
  const isIndianUser = countryCode === 'IN';

  if (newsApiKey) {
    try {
      // Fetch news based on user's country, default to US
      const targetCountry = isIndianUser ? 'in' : 'us';
      console.log(`Fetching news for country: ${targetCountry}`);
      
      const response = await fetch(
        `https://newsapi.org/v2/top-headlines?country=${targetCountry}&pageSize=30&apiKey=${newsApiKey}`
      );
      
      if (response.ok) {
        const data = await response.json();
        for (const article of data.articles || []) {
          if (article.title && article.url) {
            articles.push({
              title: article.title,
              content: article.content,
              description: article.description,
              url: article.url,
              imageUrl: article.urlToImage,
              author: article.author,
              publishedAt: article.publishedAt,
              source: article.source?.name || 'NewsAPI',
              category: 'general'
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching from NewsAPI:', error);
    }
  }

  // Add RSS feeds for better coverage, especially for Indian market
  if (isIndianUser) {
    // For Indian users, add more Indian RSS sources
    const indianRSSFeeds = [
      { url: 'https://www.news18.com/rss/india.xml', name: 'News18' },
      { url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms', name: 'Times of India' },
      { url: 'https://www.ndtv.com/rss/latest', name: 'NDTV' },
      { url: 'https://economictimes.indiatimes.com/rssfeedstopstories.cms', name: 'Economic Times' }
    ];

    for (const feed of indianRSSFeeds) {
      try {
        const rssArticles = await fetchRSSFeed(feed.url, feed.name);
        articles.push(...rssArticles.slice(0, 5)); // Limit per source
      } catch (error) {
        console.warn(`Failed to fetch from ${feed.name}:`, error);
      }
    }
  }

  return articles;
};

const storeArticle = async (article: Article) => {
  try {
    console.log(`Analyzing article: ${article.title.substring(0, 50)}...`);
    
    // Analyze the article using Perplexity API
    const analysis = await analyzeNewsStory(
      article.title,
      article.content || '',
      article.description || ''
    );
    
    // Check if article already exists
    const { data: existing } = await supabase
      .from('articles')
      .select('id')
      .eq('url', article.url)
      .single();

    if (existing) {
      console.log(`Article already exists: ${article.title}`);
      return null;
    }

    // Get or create news source
    let { data: source } = await supabase
      .from('news_sources')
      .select('id, trust_score')
      .eq('name', article.source)
      .single();

    if (!source) {
      const domain = new URL(article.url).hostname;
      const { data: newSource } = await supabase
        .from('news_sources')
        .insert({
          name: article.source,
          domain: domain,
          trust_score: 0.5,
          trust_level: 'medium'
        })
        .select('id, trust_score')
        .single();
      
      source = newSource;
    }

    // Generate simple embeddings instead of OpenAI
    const titleEmbedding = generateSimpleEmbedding(article.title);
    const contentEmbedding = generateSimpleEmbedding(
      (article.content || article.description || article.title).substring(0, 2000)
    );

    // Calculate quality score
    const qualityScore = calculateQualityScore(article);

    // Generate 60-word TLDR
    const tldr = generateTLDR(
      article.content || '', 
      article.title, 
      article.description || ''
    );

    // Store article
    const { data: storedArticle, error } = await supabase
      .from('articles')
      .insert({
        source_id: source?.id,
        title: article.title,
        content: article.content,
        description: article.description,
        url: article.url,
        image_url: article.imageUrl,
        author: article.author,
        published_at: article.publishedAt,
        category: article.category,
        title_embedding: titleEmbedding,
        content_embedding: contentEmbedding,
        quality_score: qualityScore,
        content_hash: btoa(article.title + article.url), // Simple hash for deduplication
        story_breakdown: analysis.breakdown,
        story_nature: analysis.storyNature,
        analysis_confidence: analysis.confidence,
        tldr: tldr
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing article:', error);
      return null;
    }

    console.log(`Stored article: ${article.title}`);
    return storedArticle;
  } catch (error) {
    console.error('Error in storeArticle:', error);
    return null;
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Starting news ingestion...');
    
    // Extract location data from request
    const body = await req.json().catch(() => ({}));
    const { country, countryCode, city, region } = body;
    
    console.log('Ingesting news with location context:', {
      country,
      countryCode, 
      city,
      region
    });
    
    // Fetch articles from external APIs with location context
    const articles = await fetchNewsFromAPI(countryCode);
    console.log(`Fetched ${articles.length} articles from external sources for ${countryCode || 'global'} market`);

    // Store articles in database
    const storedArticles = [];
    for (const article of articles) {
      const stored = await storeArticle(article);
      if (stored) storedArticles.push(stored);
    }

    console.log(`Successfully ingested ${storedArticles.length} new articles`);

    // Trigger clustering function
    try {
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/cluster-articles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trigger: 'ingest' })
      });
    } catch (error) {
      console.error('Error triggering clustering:', error);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        ingested: storedArticles.length,
        total_fetched: articles.length,
        market: countryCode === 'IN' ? 'India' : 'Global'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ingest-news function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
