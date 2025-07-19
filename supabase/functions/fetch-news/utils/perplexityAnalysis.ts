// Utility for analyzing news content using Perplexity API
export interface StoryAnalysis {
  storyNature: string;
  breakdown: string;
  confidence: number;
}

export const analyzeNewsStory = async (
  headline: string, 
  content: string, 
  description: string = ''
): Promise<StoryAnalysis> => {
  const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
  
  if (!perplexityApiKey) {
    console.warn('Perplexity API key not found, using fallback analysis');
    return generateFallbackAnalysis(headline, content, description);
  }

  try {
    const fullText = `${headline}\n\n${description}\n\n${content}`.trim();
    
    // First, identify the story nature
    const naturePrompt = `Analyze this news story and classify its nature. Choose ONE from these categories:
- policy_change: Government policy updates, new regulations, law changes
- scandal: Controversies, corruption, misconduct allegations
- court_judgement: Legal decisions, court rulings, judicial matters
- political_move: Elections, campaigns, political strategies
- economic_development: Market news, business developments, economic indicators
- technology_advancement: Tech innovations, AI developments, digital transformation
- health_development: Medical breakthroughs, healthcare policy, public health
- environmental_issue: Climate change, pollution, conservation
- security_incident: Crime, terrorism, safety incidents
- international_relations: Foreign affairs, diplomatic developments
- social_issue: Community concerns, social movements, civil rights
- other: General news that doesn't fit above categories

News story: "${fullText.substring(0, 1000)}"

Respond with just the category name (e.g., "policy_change").`;

    const natureResponse = await fetch('https://api.perplexity.ai/chat/completions', {
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
            content: 'You are a news categorization expert. Respond with only the category name, nothing else.'
          },
          {
            role: 'user',
            content: naturePrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 50,
        return_images: false,
        return_related_questions: false
      }),
    });

    let storyNature = 'other';
    if (natureResponse.ok) {
      const natureData = await natureResponse.json();
      const detectedNature = natureData.choices[0]?.message?.content?.trim().toLowerCase();
      if (detectedNature) {
        storyNature = detectedNature;
      }
    }

    // Then, generate the breakdown
    const breakdownPrompt = `Break down this ${storyNature.replace('_', ' ')} news story into a simple, clear explanation that helps readers understand what's really happening and why it matters.

Guidelines:
- Use simple, conversational language (8th grade reading level)
- Explain complex terms and concepts
- Focus on what this means for ordinary people
- Keep it under 300 words
- Structure: What happened → Why it matters → What's next

News story: "${fullText.substring(0, 1500)}"

Provide a clear, simple breakdown:`;

    const breakdownResponse = await fetch('https://api.perplexity.ai/chat/completions', {
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
            content: 'You are an expert at explaining complex news in simple terms. Write clear, accessible explanations that help people understand what news really means for them.'
          },
          {
            role: 'user',
            content: breakdownPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 400,
        return_images: false,
        return_related_questions: false
      }),
    });

    let breakdown = '';
    let confidence = 0.8;

    if (breakdownResponse.ok) {
      const breakdownData = await breakdownResponse.json();
      breakdown = breakdownData.choices[0]?.message?.content?.trim() || '';
      confidence = 0.9; // High confidence when API succeeds
    }

    if (!breakdown) {
      return generateFallbackAnalysis(headline, content, description);
    }

    console.log(`Perplexity analysis completed for: ${headline.substring(0, 50)}...`);
    
    return {
      storyNature,
      breakdown,
      confidence
    };

  } catch (error) {
    console.error('Perplexity API error:', error);
    return generateFallbackAnalysis(headline, content, description);
  }
};

// Fallback analysis when Perplexity API is unavailable
const generateFallbackAnalysis = (
  headline: string, 
  content: string, 
  description: string
): StoryAnalysis => {
  const fullText = `${headline} ${description} ${content}`.toLowerCase();
  
  // Simple rule-based story nature detection
  let storyNature = 'other';
  
  if (fullText.match(/(policy|regulation|law|bill|reform|government)/)) {
    storyNature = 'policy_change';
  } else if (fullText.match(/(scandal|corruption|fraud|allegation)/)) {
    storyNature = 'scandal';
  } else if (fullText.match(/(court|judge|ruling|verdict|legal)/)) {
    storyNature = 'court_judgement';
  } else if (fullText.match(/(election|political|minister|party|vote)/)) {
    storyNature = 'political_move';
  } else if (fullText.match(/(economy|market|business|financial|trade)/)) {
    storyNature = 'economic_development';
  } else if (fullText.match(/(technology|tech|ai|digital|innovation)/)) {
    storyNature = 'technology_advancement';
  } else if (fullText.match(/(health|medical|hospital|vaccine|disease)/)) {
    storyNature = 'health_development';
  } else if (fullText.match(/(environment|climate|pollution|green)/)) {
    storyNature = 'environmental_issue';
  } else if (fullText.match(/(security|crime|attack|violence|police)/)) {
    storyNature = 'security_incident';
  } else if (fullText.match(/(international|foreign|diplomatic|border)/)) {
    storyNature = 'international_relations';
  } else if (fullText.match(/(social|community|protest|rights|welfare)/)) {
    storyNature = 'social_issue';
  }

  // Generate simple breakdown
  const sentences = (content || description || headline).split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20)
    .slice(0, 3);

  const breakdown = sentences.length > 0 
    ? `This ${storyNature.replace('_', ' ')} story involves: ${sentences.join('. ')}.`
    : `This is a ${storyNature.replace('_', ' ')} development. ${headline}`;

  return {
    storyNature,
    breakdown: breakdown.substring(0, 300),
    confidence: 0.6 // Lower confidence for fallback
  };
};