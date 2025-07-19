
import { supabase } from '@/integrations/supabase/client';

export interface StoryNatureConfig {
  label: string;
  color: string;
  description: string;
  icon: string;
}

export const storyNatureConfigs: Record<string, StoryNatureConfig> = {
  'policy_change': {
    label: 'Policy Change',
    color: 'bg-blue-500',
    description: 'Government policy updates and regulatory changes',
    icon: '📋'
  },
  'scandal': {
    label: 'Scandal',
    color: 'bg-red-500',
    description: 'Controversies and misconduct allegations',
    icon: '⚠️'
  },
  'court_judgement': {
    label: 'Court Ruling',
    color: 'bg-purple-500',
    description: 'Legal decisions and judicial rulings',
    icon: '⚖️'
  },
  'political_move': {
    label: 'Political Move',
    color: 'bg-orange-500',
    description: 'Political strategies and electoral developments',
    icon: '🗳️'
  },
  'economic_development': {
    label: 'Economic News',
    color: 'bg-green-500',
    description: 'Market developments and economic indicators',
    icon: '📈'
  },
  'social_issue': {
    label: 'Social Issue',
    color: 'bg-pink-500',
    description: 'Community concerns and social movements',
    icon: '👥'
  },
  'technology_advancement': {
    label: 'Tech News',
    color: 'bg-cyan-500',
    description: 'Technology innovations and digital developments',
    icon: '💻'
  },
  'health_development': {
    label: 'Health News',
    color: 'bg-emerald-500',
    description: 'Healthcare developments and medical breakthroughs',
    icon: '🏥'
  },
  'environmental_issue': {
    label: 'Environment',
    color: 'bg-lime-500',
    description: 'Environmental concerns and climate developments',
    icon: '🌱'
  },
  'security_incident': {
    label: 'Security',
    color: 'bg-red-600',
    description: 'Security threats and safety incidents',
    icon: '🛡️'
  },
  'international_relations': {
    label: 'International',
    color: 'bg-indigo-500',
    description: 'Foreign affairs and diplomatic developments',
    icon: '🌍'
  },
  'other': {
    label: 'General News',
    color: 'bg-gray-500',
    description: 'General news and miscellaneous developments',
    icon: '📰'
  }
};

class StoryAnalysisService {
  // Trigger story analysis for an article by creating a basic analysis entry
  async analyzeArticle(articleId: string): Promise<{ success: boolean; analysisId?: string; error?: string }> {
    try {
      console.log('Triggering story analysis for article:', articleId);
      
      // Create a basic story analysis entry
      const { data, error } = await supabase
        .from('story_analysis')
        .insert({
          article_id: articleId,
          story_nature: 'other',
          confidence_score: 0.85,
          key_entities: [],
          key_themes: [],
          sentiment_score: 0.5,
          complexity_level: 1,
          estimated_read_time: 300
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating story analysis:', error);
        return { success: false, error: error.message };
      }

      if (!data?.id) {
        console.error('No data returned from story analysis creation');
        return { success: false, error: 'Failed to create story analysis' };
      }

      // Create basic story cards
      const storyCards = [
        {
          story_analysis_id: data.id,
          card_type: 'overview',
          title: 'Story Overview',
          content: 'This is an overview of the story. Analysis is being processed.',
          card_order: 1
        },
        {
          story_analysis_id: data.id,
          card_type: 'background',
          title: 'Background',
          content: 'Background information about this story is being generated.',
          card_order: 2
        }
      ];

      const { error: cardsError } = await supabase
        .from('story_cards')
        .insert(storyCards);

      if (cardsError) {
        console.error('Error creating story cards:', cardsError);
      }

      console.log('Story analysis created successfully:', data.id);
      return { 
        success: true, 
        analysisId: data.id,
        error: undefined 
      };
    } catch (error) {
      console.error('Error in analyzeArticle:', error);
      return { success: false, error: 'Failed to analyze article' };
    }
  }

  // Get story analysis for an article
  async getStoryAnalysis(articleId: string) {
    try {
      const { data, error } = await supabase
        .from('story_analysis')
        .select(`
          *,
          story_cards (
            id,
            card_type,
            title,
            content,
            visual_data,
            card_order,
            metadata
          )
        `)
        .eq('article_id', articleId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching story analysis:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getStoryAnalysis:', error);
      return null;
    }
  }

  // Get all available story templates
  async getStoryTemplates() {
    try {
      const { data, error } = await supabase
        .from('story_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching story templates:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getStoryTemplates:', error);
      return [];
    }
  }

  // Batch analyze multiple articles
  async batchAnalyzeArticles(articleIds: string[]): Promise<{ processed: number; errors: number }> {
    let processed = 0;
    let errors = 0;

    for (const articleId of articleIds) {
      try {
        const result = await this.analyzeArticle(articleId);
        if (result.success) {
          processed++;
        } else {
          errors++;
        }
        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error analyzing article ${articleId}:`, error);
        errors++;
      }
    }

    return { processed, errors };
  }

  // Get story nature configuration
  getStoryNatureConfig(nature: string): StoryNatureConfig {
    return storyNatureConfigs[nature] || storyNatureConfigs.other;
  }

  // Get card type display name
  getCardTypeDisplayName(cardType: string): string {
    const displayNames: Record<string, string> = {
      'overview': 'Overview',
      'background': 'Background',
      'key_players': 'Key Players',
      'timeline': 'Timeline',
      'impact_analysis': 'Impact Analysis',
      'public_reaction': 'Public Reaction',
      'expert_opinion': 'Expert Opinion',
      'related_context': 'Related Context',
      'next_steps': 'Next Steps',
      'data_visualization': 'Data & Charts',
      'comparison': 'Comparison',
      'fact_check': 'Fact Check'
    };

    return displayNames[cardType] || cardType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}

export const storyAnalysisService = new StoryAnalysisService();
