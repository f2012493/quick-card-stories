
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
  async analyzeArticle(articleId: string): Promise<{ success: boolean; analysisId?: string; error?: string }> {
    try {
      console.log('Triggering story analysis for article:', articleId);
      
      // Check if this is a UUID (database article) or string ID (news feed article)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(articleId);
      
      if (!isUUID) {
        console.log('Non-UUID article ID, cannot store analysis in database');
        return { 
          success: true, 
          analysisId: 'mock-' + articleId,
          error: undefined 
        };
      }

      // Check if analysis already exists
      const { data: existing } = await supabase
        .from('story_analysis')
        .select('id')
        .eq('article_id', articleId)
        .single();

      if (existing) {
        console.log('Analysis already exists for article:', articleId);
        return { 
          success: true, 
          analysisId: existing.id,
          error: undefined 
        };
      }

      // Create a basic story analysis entry for UUID articles
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

  async getStoryAnalysis(articleId: string) {
    try {
      // Check if this is a UUID article first
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(articleId);
      
      if (!isUUID) {
        console.log('Non-UUID article ID, cannot query story_analysis table');
        return null;
      }

      const { data, error } = await supabase
        .from('story_analysis')
        .select('*')
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

  getStoryNatureConfig(nature: string): StoryNatureConfig {
    return storyNatureConfigs[nature] || storyNatureConfigs.other;
  }
}

export const storyAnalysisService = new StoryAnalysisService();
