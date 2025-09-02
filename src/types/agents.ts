export type AgentType = 'verifier' | 'contextualizer' | 'analyst' | 'impact';
export type ContentFormat = 'text' | 'bullets' | 'carousel' | 'video_script' | 'summary';
export type ContentLanguage = 'en' | 'es' | 'hi' | 'fr' | 'de';
export type ContentTone = 'professional' | 'casual' | 'friendly' | 'technical' | 'gen_z';

export interface UserPreferences {
  id: string;
  user_id: string;
  language: ContentLanguage;
  format: ContentFormat;
  tone: ContentTone;
  created_at: string;
  updated_at: string;
}

export interface AgentInput {
  article_id: string;
  content: string;
  headline: string;
  source_url?: string;
  user_preferences?: UserPreferences;
}

export interface AgentOutput {
  id: string;
  pipeline_id: string;
  agent_type: AgentType;
  input_data: Record<string, any>;
  output_data: Record<string, any>;
  metadata: Record<string, any>;
  processing_time_ms?: number;
  status: 'completed' | 'failed' | 'pending';
  error_message?: string;
  created_at: string;
}

export interface AgentPipeline {
  id: string;
  article_id: string;
  user_id?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface VerifierOutput {
  factual_accuracy: number; // 0-1 score
  trust_score: number; // 0-1 score
  misinformation_flags: string[];
  verification_sources: string[];
  fact_check_results: FactCheckResult[];
}

export interface FactCheckResult {
  claim: string;
  verdict: 'true' | 'false' | 'misleading' | 'unverified';
  sources: string[];
  confidence: number;
}

export interface ContextualizerOutput {
  historical_context: string;
  geopolitical_context: string;
  cultural_context: string;
  background_explainer: string;
  related_events: RelatedEvent[];
}

export interface RelatedEvent {
  title: string;
  date: string;
  description: string;
  relevance_score: number;
}

export interface AnalystOutput {
  key_insights: string[];
  implications: string[];
  data_points: DataPoint[];
  what_this_means: string;
  patterns_identified: string[];
}

export interface DataPoint {
  metric: string;
  value: string;
  context: string;
  significance: string;
}

export interface ImpactOutput {
  societal_impact: string;
  user_impact: string;
  action_items: ActionItem[];
  further_reading: string[];
  what_to_watch: string[];
}

export interface ActionItem {
  type: 'petition' | 'contact' | 'learn' | 'vote' | 'donate';
  title: string;
  description: string;
  url?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface PersonalizedContent {
  id: string;
  article_id: string;
  user_id: string;
  pipeline_id: string;
  language: ContentLanguage;
  format: ContentFormat;
  content: {
    title: string;
    summary: string;
    verification: VerifierOutput;
    context: ContextualizerOutput;
    analysis: AnalystOutput;
    impact: ImpactOutput;
    formatted_content: string;
  };
  created_at: string;
}

export interface AgentLog {
  id: string;
  pipeline_id: string;
  agent_type: AgentType;
  log_level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context: Record<string, any>;
  created_at: string;
}