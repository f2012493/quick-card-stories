import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Brain,
  Search,
  Target,
  Heart,
  AlertCircle,
  Eye,
  ExternalLink,
  Sparkles,
  MessageCircle,
  Repeat2,
  BarChart3,
} from 'lucide-react';
import { useThinkCheckAnalysis, ThinkCheckResponse } from '@/hooks/useThinkCheckAnalysis';
import { toast } from 'sonner';

interface ThinkCheckModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleId: string;
  headline: string;
  content: string;
  author?: string;
  sourceUrl?: string;
}

const ThinkCheckModal = ({
  open,
  onOpenChange,
  articleId,
  headline,
  content,
  author,
  sourceUrl,
}: ThinkCheckModalProps) => {
  const { analyzeArticle, isLoading, error, data } = useThinkCheckAnalysis();

  useEffect(() => {
    if (open && !data && !isLoading && !error) {
      analyzeArticle(articleId, headline, content, author, sourceUrl).catch((err) => {
        toast.error('Failed to analyze article');
      });
    }
  }, [open]);

  const getBiasColor = (bias: string) => {
    switch (bias.toLowerCase()) {
      case 'left':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'right':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'center':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getEmotionColor = (emotion: string) => {
    switch (emotion.toLowerCase()) {
      case 'fear':
        return 'bg-purple-500/20 text-purple-400';
      case 'anger':
        return 'bg-red-500/20 text-red-400';
      case 'joy':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'sadness':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const FeedItem = ({
    icon: Icon,
    title,
    children,
    iconColor = 'text-primary',
  }: {
    icon: React.ElementType;
    title: string;
    children: React.ReactNode;
    iconColor?: string;
  }) => (
    <div className="flex gap-3 p-4 border-b border-border/50 hover:bg-muted/30 transition-colors">
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">{title}</span>
          <span className="text-xs text-muted-foreground">• AI Analysis</span>
        </div>
        <div className="text-sm text-foreground/90 leading-relaxed">{children}</div>
        <div className="flex items-center gap-6 pt-2 text-muted-foreground">
          <button className="flex items-center gap-1.5 text-xs hover:text-primary transition-colors">
            <MessageCircle className="w-4 h-4" />
            <span>Reply</span>
          </button>
          <button className="flex items-center gap-1.5 text-xs hover:text-green-500 transition-colors">
            <Repeat2 className="w-4 h-4" />
            <span>Share</span>
          </button>
          <button className="flex items-center gap-1.5 text-xs hover:text-primary transition-colors">
            <BarChart3 className="w-4 h-4" />
            <span>Details</span>
          </button>
        </div>
      </div>
    </div>
  );

  const SkeletonFeedItem = () => (
    <div className="flex gap-3 p-4 border-b border-border/50">
      <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] p-0 overflow-hidden bg-background border-border/50">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border/50 px-4 py-3">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Brain className="w-5 h-5 text-primary" />
              Think Check AI
              <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
            </DialogTitle>
            <DialogDescription className="text-sm">
              Critical thinking insights • Pause before you believe or share
            </DialogDescription>
          </DialogHeader>
        </div>

        <ScrollArea className="h-[70vh]">
          {isLoading && (
            <div>
              {[1, 2, 3, 4, 5].map((i) => (
                <SkeletonFeedItem key={i} />
              ))}
            </div>
          )}

          {error && (
            <div className="p-4">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Analysis Failed</p>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {data && (
            <div className="divide-y divide-border/50">
              {/* Source Analysis */}
              <FeedItem icon={Search} title="Who created this content?">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {data.analysis.source.name}
                    </Badge>
                    <Badge variant="outline" className={`text-xs ${getBiasColor(data.analysis.source.bias)}`}>
                      {data.analysis.source.bias}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{data.analysis.source.description}</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Reliability</span>
                      <span className="font-medium">{data.analysis.source.reliability}%</span>
                    </div>
                    <Progress value={data.analysis.source.reliability} className="h-1.5" />
                  </div>
                  {sourceUrl && (
                    <Button variant="ghost" size="sm" className="h-8 px-3 text-xs" asChild>
                      <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3 mr-1.5" />
                        View Source
                      </a>
                    </Button>
                  )}
                </div>
              </FeedItem>

              {/* Intent Analysis */}
              <FeedItem icon={Target} title="What's their goal?">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs capitalize">
                      {data.analysis.intent.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {data.analysis.intent.confidence}% confidence
                    </span>
                  </div>
                  <p className="text-muted-foreground">{data.analysis.intent.explanation}</p>
                </div>
              </FeedItem>

              {/* Emotions Analysis */}
              <FeedItem icon={Heart} title="What emotions is this triggering?">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {data.analysis.emotions.map((emotion, idx) => (
                      <Badge
                        key={idx}
                        className={`text-xs capitalize ${getEmotionColor(emotion.type)}`}
                      >
                        {emotion.type} • {emotion.intensity}%
                      </Badge>
                    ))}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Strong emotions can cloud judgment. Notice how this makes you feel.
                  </p>
                </div>
              </FeedItem>

              {/* Missing Context */}
              <FeedItem icon={AlertCircle} title="What's missing from this narrative?">
                <div className="space-y-2">
                  {data.analysis.missing.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-primary text-xs mt-0.5">→</span>
                      <span>{item}</span>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" className="h-8 px-3 text-xs mt-2">
                    Compare Perspectives
                  </Button>
                </div>
              </FeedItem>

              {/* Assumptions */}
              <FeedItem icon={Eye} title="What assumptions are being nudged?">
                <div className="space-y-2">
                  {data.analysis.assumptions.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-primary text-xs mt-0.5">→</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </FeedItem>

              {/* Disclaimer */}
              <div className="p-4 bg-muted/20">
                <p className="text-xs text-muted-foreground leading-relaxed flex items-start gap-2">
                  <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>{data.disclaimer}</span>
                </p>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ThinkCheckModal;
