import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Enhanced story nature detection with more sophisticated patterns
const detectStoryNature = (title: string, content: string, description: string = ''): string => {
  const fullText = `${title} ${description} ${content}`.toLowerCase();
  
  // Policy change patterns
  if (fullText.match(/(policy|regulation|rule|guideline|framework|reform|amendment|bill|act|law).*(change|new|introduce|implement|announce|approve|pass|enact)/)) {
    return 'policy_change';
  }
  
  // Scandal patterns
  if (fullText.match(/(scandal|corruption|bribe|fraud|misconduct|allegation|investigate|probe|expose|leak)/)) {
    return 'scandal';
  }
  
  // Court judgement patterns
  if (fullText.match(/(court|judge|verdict|ruling|sentence|appeal|supreme court|high court|tribunal|justice|legal)/)) {
    return 'court_judgement';
  }
  
  // Political move patterns
  if (fullText.match(/(election|campaign|party|minister|opposition|coalition|vote|parliament|assembly|political|candidate)/)) {
    return 'political_move';
  }
  
  // Economic development patterns
  if (fullText.match(/(economy|market|gdp|inflation|growth|business|trade|investment|stock|rupee|financial|economic)/)) {
    return 'economic_development';
  }
  
  // Technology advancement patterns
  if (fullText.match(/(technology|ai|artificial intelligence|digital|startup|innovation|tech|software|app|cyber|internet)/)) {
    return 'technology_advancement';
  }
  
  // Health development patterns
  if (fullText.match(/(health|medical|hospital|vaccine|disease|treatment|doctor|patient|healthcare|medicine)/)) {
    return 'health_development';
  }
  
  // Environmental issue patterns
  if (fullText.match(/(environment|climate|pollution|green|carbon|renewable|forest|wildlife|conservation|sustainability)/)) {
    return 'environmental_issue';
  }
  
  // Security incident patterns
  if (fullText.match(/(security|terror|attack|violence|crime|police|arrest|incident|threat|safety)/)) {
    return 'security_incident';
  }
  
  // International relations patterns
  if (fullText.match(/(international|foreign|embassy|diplomat|treaty|border|trade deal|summit|bilateral)/)) {
    return 'international_relations';
  }
  
  // Social issue patterns
  if (fullText.match(/(social|community|protest|rights|equality|discrimination|welfare|education|housing)/)) {
    return 'social_issue';
  }
  
  return 'other';
};

// Extract key entities from text
const extractKeyEntities = (text: string): any[] => {
  const entities: any[] = [];
  
  // Person names (titles + names)
  const personPattern = /\b(?:Mr|Mrs|Ms|Dr|Prof|President|Minister|PM|CEO|Director|Justice|Judge)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
  const personMatches = text.match(personPattern);
  if (personMatches) {
    personMatches.forEach(match => {
      entities.push({ text: match.trim(), type: 'PERSON', confidence: 0.8 });
    });
  }
  
  // Organizations
  const orgPattern = /\b[A-Z][a-z]*(?:\s+[A-Z][a-z]*)*\s+(?:Ltd|Limited|Corp|Corporation|Inc|Company|Group|Bank|Authority|Commission|Ministry|Department|University|Institute|Agency|Association)\b/g;
  const orgMatches = text.match(orgPattern);
  if (orgMatches) {
    orgMatches.forEach(match => {
      entities.push({ text: match.trim(), type: 'ORG', confidence: 0.7 });
    });
  }
  
  // Locations
  const locationKeywords = [
    'India', 'Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune',
    'Maharashtra', 'Gujarat', 'Karnataka', 'Tamil Nadu', 'West Bengal', 'Rajasthan',
    'United States', 'China', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal'
  ];
  
  locationKeywords.forEach(location => {
    const regex = new RegExp(`\\b${location}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      entities.push({ text: location, type: 'LOCATION', confidence: 0.9 });
    }
  });
  
  return entities;
};

// Extract key themes from text
const extractKeyThemes = (text: string): string[] => {
  const themes: string[] = [];
  const lowerText = text.toLowerCase();
  
  const themePatterns = {
    'governance': ['government', 'policy', 'administration', 'bureaucracy'],
    'economy': ['economic', 'financial', 'market', 'business', 'trade'],
    'technology': ['tech', 'digital', 'innovation', 'ai', 'software'],
    'healthcare': ['health', 'medical', 'hospital', 'treatment', 'vaccine'],
    'education': ['education', 'school', 'university', 'student', 'learning'],
    'environment': ['environment', 'climate', 'green', 'pollution', 'conservation'],
    'security': ['security', 'defense', 'military', 'police', 'safety'],
    'justice': ['court', 'legal', 'law', 'justice', 'rights'],
    'international': ['foreign', 'international', 'global', 'diplomatic'],
    'social': ['social', 'community', 'society', 'cultural', 'welfare']
  };
  
  Object.entries(themePatterns).forEach(([theme, keywords]) => {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      themes.push(theme);
    }
  });
  
  return themes;
};

// Calculate sentiment score
const calculateSentiment = (text: string): number => {
  const positiveWords = ['good', 'great', 'excellent', 'positive', 'success', 'achievement', 'progress', 'improvement', 'benefit', 'growth'];
  const negativeWords = ['bad', 'terrible', 'negative', 'failure', 'crisis', 'problem', 'decline', 'loss', 'damage', 'concern'];
  
  const lowerText = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;
  
  positiveWords.forEach(word => {
    const matches = lowerText.match(new RegExp(`\\b${word}\\b`, 'g'));
    if (matches) positiveCount += matches.length;
  });
  
  negativeWords.forEach(word => {
    const matches = lowerText.match(new RegExp(`\\b${word}\\b`, 'g'));
    if (matches) negativeCount += matches.length;
  });
  
  const totalWords = positiveCount + negativeCount;
  if (totalWords === 0) return 0.5; // Neutral
  
  return positiveCount / totalWords;
};

// Generate enhanced card content based on story nature and card type
const generateCardContent = (cardType: string, storyNature: string, title: string, content: string): string => {
  const baseContent = content.substring(0, 500);
  
  switch (cardType) {
    case 'overview':
      return `This ${storyNature.replace('_', ' ')} involves ${title.toLowerCase()}. ${baseContent}...`;
    
    case 'background':
      if (storyNature === 'policy_change') {
        return 'This policy change builds on previous government initiatives and responds to current challenges in the sector.';
      } else if (storyNature === 'court_judgement') {
        return 'This court ruling follows legal proceedings and has implications for similar cases and legal precedents.';
      } else if (storyNature === 'scandal') {
        return 'This controversy has emerged from ongoing investigations and public scrutiny of the involved parties.';
      }
      return 'This development has historical context and builds on previous events in this area.';
    
    case 'key_players':
      const entities = extractKeyEntities(content);
      if (entities.length > 0) {
        const people = entities.filter(e => e.type === 'PERSON').map(e => e.text);
        const orgs = entities.filter(e => e.type === 'ORG').map(e => e.text);
        let result = '';
        if (people.length > 0) result += `Key people: ${people.slice(0, 3).join(', ')}\n\n`;
        if (orgs.length > 0) result += `Organizations involved: ${orgs.slice(0, 3).join(', ')}`;
        return result || 'Key stakeholders and decision-makers are involved in this development.';
      }
      return 'Various stakeholders, officials, and organizations are involved in this story.';
    
    case 'impact_analysis':
      if (storyNature === 'economic_development') {
        return 'This economic development will impact markets, businesses, and consumers. Long-term effects include changes in investment patterns and economic growth.';
      } else if (storyNature === 'policy_change') {
        return 'This policy change will affect citizens, businesses, and government operations. Implementation will require coordination across multiple departments.';
      }
      return 'This development will have immediate and long-term implications for various stakeholders and the broader community.';
    
    case 'public_reaction':
      return 'Public response has been mixed, with various stakeholders expressing different viewpoints. Media coverage has highlighted the significance of this development.';
    
    case 'next_steps':
      if (storyNature === 'policy_change') {
        return 'Implementation will begin in phases, with monitoring and evaluation mechanisms in place. Further announcements are expected.';
      } else if (storyNature === 'court_judgement') {
        return 'Appeals may be filed, and compliance with the ruling will be monitored. This may set precedent for similar cases.';
      }
      return 'Further developments are expected as stakeholders respond and implement necessary changes.';
    
    default:
      return baseContent;
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { article_id } = await req.json();
    
    if (!article_id) {
      return new Response(
        JSON.stringify({ error: 'Article ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing story for article: ${article_id}`);

    // Get article data
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', article_id)
      .single();

    if (articleError || !article) {
      return new Response(
        JSON.stringify({ error: 'Article not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if analysis already exists
    const { data: existingAnalysis } = await supabase
      .from('story_analysis')
      .select('id')
      .eq('article_id', article_id)
      .single();

    if (existingAnalysis) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          analysis_id: existingAnalysis.id,
          message: 'Analysis already exists'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Analyze the story
    const fullText = `${article.title} ${article.description || ''} ${article.content || ''}`;
    const storyNature = detectStoryNature(article.title, article.content || '', article.description || '');
    const keyEntities = extractKeyEntities(fullText);
    const keyThemes = extractKeyThemes(fullText);
    const sentimentScore = calculateSentiment(fullText);
    
    // Calculate complexity based on content length and entity count
    const wordCount = fullText.split(' ').length;
    const complexityLevel = Math.min(5, Math.max(1, Math.ceil((wordCount / 200) + (keyEntities.length / 5))));
    
    // Get appropriate template
    const { data: template } = await supabase
      .from('story_templates')
      .select('*')
      .eq('story_nature', storyNature)
      .eq('is_active', true)
      .single();

    // Create story analysis
    const { data: analysis, error: analysisError } = await supabase
      .from('story_analysis')
      .insert({
        article_id: article_id,
        cluster_id: article.cluster_id,
        story_nature: storyNature,
        confidence_score: 0.85,
        key_entities: keyEntities,
        key_themes: keyThemes,
        sentiment_score: sentimentScore,
        complexity_level: complexityLevel,
        estimated_read_time: Math.max(60, wordCount * 0.5), // Rough reading time estimate
        template_id: template?.id,
        analysis_metadata: {
          processed_at: new Date().toISOString(),
          word_count: wordCount,
          entity_count: keyEntities.length,
          theme_count: keyThemes.length
        }
      })
      .select()
      .single();

    if (analysisError) {
      console.error('Error creating story analysis:', analysisError);
      return new Response(
        JSON.stringify({ error: 'Failed to create story analysis' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate story cards if template exists
    if (template && template.card_sequence) {
      const cards = template.card_sequence.map((cardType: string, index: number) => ({
        story_analysis_id: analysis.id,
        card_type: cardType,
        title: cardType === 'overview' ? 'What Happened' :
               cardType === 'background' ? 'Background Context' :
               cardType === 'key_players' ? 'Key Players' :
               cardType === 'timeline' ? 'Timeline of Events' :
               cardType === 'impact_analysis' ? 'Impact Analysis' :
               cardType === 'public_reaction' ? 'Public Reaction' :
               cardType === 'next_steps' ? 'What\'s Next' :
               cardType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        content: generateCardContent(cardType, storyNature, article.title, article.content || ''),
        card_order: index + 1,
        metadata: {
          generated_at: new Date().toISOString(),
          story_nature: storyNature,
          template_used: template.name
        }
      }));

      const { error: cardsError } = await supabase
        .from('story_cards')
        .insert(cards);

      if (cardsError) {
        console.error('Error creating story cards:', cardsError);
      } else {
        console.log(`Created ${cards.length} story cards`);
      }
    }

    console.log(`Story analysis completed for article: ${article_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis_id: analysis.id,
        story_nature: storyNature,
        card_count: template?.card_sequence?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in story-analyzer function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});