import { supabase } from '@/integrations/supabase/client';
import { 
  AgentType, 
  AgentInput, 
  AgentOutput, 
  UserPreferences, 
  PersonalizedContent,
  ContentFormat,
  ContentLanguage 
} from '@/types/agents';

export class AgentService {
  
  async createPipeline(articleId: string, userId?: string): Promise<string> {
    const { data, error } = await supabase
      .from('agent_pipeline')
      .insert({
        article_id: articleId,
        user_id: userId,
        status: 'pending'
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  async updatePipelineStatus(pipelineId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('agent_pipeline')
      .update({ status })
      .eq('id', pipelineId);

    if (error) throw error;
  }

  async runVerifierAgent(input: AgentInput, pipelineId: string): Promise<any> {
    const { data, error } = await supabase.functions.invoke('verifier-agent', {
      body: { ...input, pipeline_id: pipelineId }
    });

    if (error) throw error;
    return data;
  }

  async runContextualizerAgent(input: AgentInput & { verifier_output: any }, pipelineId: string): Promise<any> {
    const { data, error } = await supabase.functions.invoke('contextualizer-agent', {
      body: { ...input, pipeline_id: pipelineId }
    });

    if (error) throw error;
    return data;
  }

  async runAnalystAgent(input: AgentInput & { contextualizer_output: any }, pipelineId: string): Promise<any> {
    const { data, error } = await supabase.functions.invoke('analyst-agent', {
      body: { ...input, pipeline_id: pipelineId }
    });

    if (error) throw error;
    return data;
  }

  async runImpactAgent(input: AgentInput & { analyst_output: any }, pipelineId: string): Promise<any> {
    const { data, error } = await supabase.functions.invoke('impact-agent', {
      body: { ...input, pipeline_id: pipelineId }
    });

    if (error) throw error;
    return data;
  }

  async processArticlePipeline(articleId: string, userId?: string): Promise<PersonalizedContent> {
    try {
      // Get user preferences
      const preferences = userId ? await this.getUserPreferences(userId) : null;
      
      // Get article data
      const { data: article, error: articleError } = await supabase
        .from('articles')
        .select('*')
        .eq('id', articleId)
        .single();

      if (articleError) throw articleError;

      // Create pipeline
      const pipelineId = await this.createPipeline(articleId, userId);
      
      // Update status to processing
      await this.updatePipelineStatus(pipelineId, 'processing');

      const agentInput: AgentInput = {
        article_id: articleId,
        content: article.content || '',
        headline: article.title,
        source_url: article.url,
        user_preferences: preferences || undefined
      };

      // Run agents in sequence
      const verifierOutput = await this.runVerifierAgent(agentInput, pipelineId);
      
      const contextualizerOutput = await this.runContextualizerAgent({
        ...agentInput,
        verifier_output: verifierOutput
      }, pipelineId);

      const analystOutput = await this.runAnalystAgent({
        ...agentInput,
        contextualizer_output: contextualizerOutput
      }, pipelineId);

      const impactOutput = await this.runImpactAgent({
        ...agentInput,
        analyst_output: analystOutput
      }, pipelineId);

      // Generate personalized content
      const personalizedContent = await this.generatePersonalizedContent({
        articleId,
        userId: userId || '',
        pipelineId,
        verifierOutput,
        contextualizerOutput,
        analystOutput,
        impactOutput,
        preferences
      });

      // Update pipeline status to completed
      await this.updatePipelineStatus(pipelineId, 'completed');

      return personalizedContent;

    } catch (error) {
      console.error('Pipeline processing failed:', error);
      throw error;
    }
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as UserPreferences | null;
  }

  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        ...preferences
      })
      .select()
      .single();

    if (error) throw error;
    return data as UserPreferences;
  }

  private async generatePersonalizedContent({
    articleId,
    userId,
    pipelineId,
    verifierOutput,
    contextualizerOutput,
    analystOutput,
    impactOutput,
    preferences
  }: {
    articleId: string;
    userId: string;
    pipelineId: string;
    verifierOutput: any;
    contextualizerOutput: any;
    analystOutput: any;
    impactOutput: any;
    preferences?: UserPreferences | null;
  }): Promise<PersonalizedContent> {
    
    const language = preferences?.language || 'en';
    const format = preferences?.format || 'text';

    // Format content based on user preferences
    const formattedContent = await this.formatContent({
      verifierOutput,
      contextualizerOutput,
      analystOutput,
      impactOutput,
      format,
      language,
      tone: preferences?.tone || 'professional'
    });

    const content = {
      title: formattedContent.title,
      summary: formattedContent.summary,
      verification: verifierOutput,
      context: contextualizerOutput,
      analysis: analystOutput,
      impact: impactOutput,
      formatted_content: formattedContent.final_content
    };

    const { data, error } = await supabase
      .from('personalized_content')
      .upsert({
        article_id: articleId,
        user_id: userId,
        pipeline_id: pipelineId,
        language,
        format,
        content
      })
      .select()
      .single();

    if (error) throw error;
    return data as unknown as PersonalizedContent;
  }

  private async formatContent({
    verifierOutput,
    contextualizerOutput,
    analystOutput,
    impactOutput,
    format,
    language,
    tone
  }: {
    verifierOutput: any;
    contextualizerOutput: any;
    analystOutput: any;
    impactOutput: any;
    format: ContentFormat;
    language: ContentLanguage;
    tone: string;
  }): Promise<{ title: string; summary: string; final_content: string }> {
    
    // Use OpenAI to format content based on preferences
    const { data, error } = await supabase.functions.invoke('content-formatter', {
      body: {
        verifier_output: verifierOutput,
        contextualizer_output: contextualizerOutput,
        analyst_output: analystOutput,
        impact_output: impactOutput,
        format,
        language,
        tone
      }
    });

    if (error) throw error;
    return data;
  }

  async getPersonalizedContent(articleId: string, userId: string): Promise<PersonalizedContent | null> {
    const { data, error } = await supabase
      .from('personalized_content')
      .select('*')
      .eq('article_id', articleId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as unknown as PersonalizedContent | null;
  }

  async getPipelineOutputs(pipelineId: string): Promise<AgentOutput[]> {
    const { data, error } = await supabase
      .from('agent_outputs')
      .select('*')
      .eq('pipeline_id', pipelineId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as AgentOutput[];
  }
}

export const agentService = new AgentService();