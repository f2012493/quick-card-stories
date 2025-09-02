-- Create user preferences table
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  format VARCHAR(20) NOT NULL DEFAULT 'text',
  tone VARCHAR(20) NOT NULL DEFAULT 'professional',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create agent types enum
CREATE TYPE public.agent_type AS ENUM ('verifier', 'contextualizer', 'analyst', 'impact');

-- Create agent processing pipeline table
CREATE TABLE public.agent_pipeline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create agent outputs table
CREATE TABLE public.agent_outputs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_id UUID NOT NULL REFERENCES public.agent_pipeline(id) ON DELETE CASCADE,
  agent_type public.agent_type NOT NULL,
  input_data JSONB NOT NULL,
  output_data JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  processing_time_ms INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'completed',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create agent logs table for observability
CREATE TABLE public.agent_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_id UUID NOT NULL REFERENCES public.agent_pipeline(id) ON DELETE CASCADE,
  agent_type public.agent_type NOT NULL,
  log_level VARCHAR(10) NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create personalized content table
CREATE TABLE public.personalized_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pipeline_id UUID NOT NULL REFERENCES public.agent_pipeline(id) ON DELETE CASCADE,
  language VARCHAR(10) NOT NULL,
  format VARCHAR(20) NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(article_id, user_id, language, format)
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personalized_content ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own preferences" 
ON public.user_preferences 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own pipelines" 
ON public.agent_pipeline 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Service role can manage pipelines" 
ON public.agent_pipeline 
FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Users can view agent outputs for their pipelines" 
ON public.agent_outputs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.agent_pipeline 
    WHERE id = agent_outputs.pipeline_id 
    AND (user_id = auth.uid() OR user_id IS NULL)
  )
);

CREATE POLICY "Service role can manage agent outputs" 
ON public.agent_outputs 
FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Users can view agent logs for their pipelines" 
ON public.agent_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.agent_pipeline 
    WHERE id = agent_logs.pipeline_id 
    AND (user_id = auth.uid() OR user_id IS NULL)
  )
);

CREATE POLICY "Service role can manage agent logs" 
ON public.agent_logs 
FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their personalized content" 
ON public.personalized_content 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage personalized content" 
ON public.personalized_content 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create indexes for performance
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX idx_agent_pipeline_article_id ON public.agent_pipeline(article_id);
CREATE INDEX idx_agent_pipeline_user_id ON public.agent_pipeline(user_id);
CREATE INDEX idx_agent_pipeline_status ON public.agent_pipeline(status);
CREATE INDEX idx_agent_outputs_pipeline_id ON public.agent_outputs(pipeline_id);
CREATE INDEX idx_agent_outputs_agent_type ON public.agent_outputs(agent_type);
CREATE INDEX idx_agent_logs_pipeline_id ON public.agent_logs(pipeline_id);
CREATE INDEX idx_personalized_content_user_article ON public.personalized_content(user_id, article_id);

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_pipeline_updated_at
  BEFORE UPDATE ON public.agent_pipeline
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();