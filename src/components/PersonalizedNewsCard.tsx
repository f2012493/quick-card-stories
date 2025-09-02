import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAgentPipeline, usePersonalizedContent } from '@/hooks/useAgentPipeline';
import { useAuth } from '@/contexts/AuthContext';
import { NewsItem } from '@/types/news';
import { PersonalizedContent } from '@/types/agents';
import { 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  Target, 
  Clock, 
  Zap,
  RefreshCw,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface PersonalizedNewsCardProps {
  news: NewsItem;
  isActive: boolean;
}

const PersonalizedNewsCard: React.FC<PersonalizedNewsCardProps> = ({ news, isActive }) => {
  const { user } = useAuth();
  const { processArticle, isProcessing } = useAgentPipeline();
  const { data: personalizedContent, refetch } = usePersonalizedContent(news.id, user?.id);
  const [showDetailedView, setShowDetailedView] = useState(false);

  const handleProcessArticle = async () => {
    try {
      await processArticle.mutateAsync({ 
        articleId: news.id, 
        userId: user?.id 
      });
      await refetch();
    } catch (error) {
      console.error('Failed to process article:', error);
      toast.error('Failed to process article');
    }
  };

  const renderTrustScore = (score: number) => {
    const color = score >= 0.8 ? 'text-green-400' : score >= 0.6 ? 'text-yellow-400' : 'text-red-400';
    const icon = score >= 0.8 ? CheckCircle : score >= 0.6 ? AlertCircle : AlertCircle;
    const Icon = icon;
    
    return (
      <div className="flex items-center gap-1">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className={`text-sm ${color}`}>{Math.round(score * 100)}%</span>
      </div>
    );
  };

  const renderPersonalizedContent = (content: PersonalizedContent) => {
    return (
      <div className="space-y-4">
        {/* Trust & Verification */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Trust Score:</span>
            {renderTrustScore(content.content.verification.trust_score)}
          </div>
          <Badge variant="outline" className="text-xs">
            {content.language.toUpperCase()} • {content.format}
          </Badge>
        </div>

        {/* Formatted Content */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {content.content.title}
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            {content.content.summary}
          </p>
          
          {showDetailedView ? (
            <div className="space-y-4">
              {/* Main Content */}
              <div className="whitespace-pre-wrap text-sm text-foreground">
                {content.content.formatted_content}
              </div>

              <Separator />

              {/* Context Section */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Context & Background
                </h4>
                <p className="text-xs text-muted-foreground">
                  {content.content.context.background_explainer}
                </p>
              </div>

              {/* Key Insights */}
              {content.content.analysis.key_insights.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Key Insights
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {content.content.analysis.key_insights.map((insight, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Items */}
              {content.content.impact.action_items.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    What You Can Do
                  </h4>
                  <div className="space-y-1">
                    {content.content.impact.action_items.slice(0, 3).map((action, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded bg-muted/30">
                        <div>
                          <p className="text-xs font-medium text-foreground">{action.title}</p>
                          <p className="text-xs text-muted-foreground">{action.description}</p>
                        </div>
                        <Badge 
                          variant={action.priority === 'high' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {action.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetailedView(true)}
                className="modern-button"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Full Analysis
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-background to-background/90">
      <Card className="h-full w-full enhanced-card border-0 bg-transparent">
        <div className="h-full flex flex-col p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {news.readTime}
              </span>
            </div>
            {user && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleProcessArticle}
                disabled={isProcessing}
                className="modern-button"
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                {isProcessing ? 'Processing...' : 'Analyze'}
              </Button>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {personalizedContent ? (
              renderPersonalizedContent(personalizedContent)
            ) : (
              <div className="space-y-4">
                {/* Original Content */}
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    {news.headline}
                  </h2>
                  <p className="text-muted-foreground text-sm mb-4">
                    {news.tldr}
                  </p>
                  {news.quote && (
                    <blockquote className="border-l-4 border-primary pl-4 italic text-sm text-muted-foreground">
                      {news.quote}
                    </blockquote>
                  )}
                </div>

                {/* Original Context Info */}
                {news.contextualInfo && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-foreground">Background</h4>
                    {news.contextualInfo.backgroundInfo.map((info, index) => (
                      <p key={index} className="text-xs text-muted-foreground">{info}</p>
                    ))}
                  </div>
                )}

                {user && (
                  <div className="text-center py-8">
                    <div className="space-y-2">
                      <Zap className="w-8 h-8 text-primary mx-auto" />
                      <p className="text-sm text-muted-foreground">
                        Get AI-powered insights tailored to your preferences
                      </p>
                      <Button
                        onClick={handleProcessArticle}
                        disabled={isProcessing}
                        className="modern-button"
                      >
                        {isProcessing ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Zap className="w-4 h-4 mr-2" />
                        )}
                        {isProcessing ? 'Processing...' : 'Get Personalized Analysis'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{news.author}</span>
              {news.trustScore && (
                <>
                  <span>•</span>
                  <span>Trust: {Math.round(news.trustScore * 100)}%</span>
                </>
              )}
            </div>
            {personalizedContent && (
              <Badge variant="secondary" className="text-xs">
                AI Enhanced
              </Badge>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PersonalizedNewsCard;