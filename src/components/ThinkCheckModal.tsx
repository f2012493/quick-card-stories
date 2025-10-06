import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  Search,
  Target,
  Heart,
  AlertCircle,
  Eye,
  ExternalLink,
  Sparkles,
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
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
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
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Brain className="w-6 h-6 text-primary" />
            Think Check AI
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          </DialogTitle>
          <DialogDescription className="text-base">
            Critical thinking insights powered by AI. Pause before you believe or share.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Analysis Failed</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
            </div>
          )}

          {data && (
            <>
              <Accordion type="multiple" className="space-y-3">
                {/* Question 1: Who created this? */}
                <AccordionItem
                  value="source"
                  className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg px-4 hover:bg-card/70 transition-colors"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3 text-left">
                      <Search className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="font-semibold">Who created this content?</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-sm">
                        {data.analysis.source.name}
                      </Badge>
                      <Badge variant="outline" className={getBiasColor(data.analysis.source.bias)}>
                        {data.analysis.source.bias}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Reliability Score</span>
                        <span className="font-medium">{data.analysis.source.reliability}%</span>
                      </div>
                      <Progress value={data.analysis.source.reliability} className="h-2" />
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {data.analysis.source.description}
                    </p>
                    {sourceUrl && (
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Source Profile
                        </a>
                      </Button>
                    )}
                  </AccordionContent>
                </AccordionItem>

                {/* Question 2: What's their goal? */}
                <AccordionItem
                  value="intent"
                  className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg px-4 hover:bg-card/70 transition-colors"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3 text-left">
                      <Target className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="font-semibold">What's their goal?</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-sm capitalize">
                        {data.analysis.intent.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {data.analysis.intent.confidence}% confidence
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {data.analysis.intent.explanation}
                    </p>
                  </AccordionContent>
                </AccordionItem>

                {/* Question 3: What emotions? */}
                <AccordionItem
                  value="emotions"
                  className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg px-4 hover:bg-card/70 transition-colors"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3 text-left">
                      <Heart className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="font-semibold">What emotions is this triggering?</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {data.analysis.emotions.map((emotion, idx) => (
                        <Badge
                          key={idx}
                          className={`${getEmotionColor(emotion.type)} capitalize`}
                        >
                          {emotion.type} ({emotion.intensity}%)
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Notice how the content makes you feel. Strong emotions can cloud judgment.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                {/* Question 4: What's missing? */}
                <AccordionItem
                  value="missing"
                  className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg px-4 hover:bg-card/70 transition-colors"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3 text-left">
                      <AlertCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="font-semibold">What's missing from this narrative?</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4 space-y-3">
                    <ul className="space-y-2">
                      {data.analysis.missing.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-primary mt-1">•</span>
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                    <Button variant="outline" size="sm" className="w-full">
                      Compare with Opposing Perspectives
                    </Button>
                  </AccordionContent>
                </AccordionItem>

                {/* Question 5: What assumptions? */}
                <AccordionItem
                  value="assumptions"
                  className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg px-4 hover:bg-card/70 transition-colors"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3 text-left">
                      <Eye className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="font-semibold">What assumptions are being nudged?</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4 space-y-3">
                    <ul className="space-y-2">
                      {data.analysis.assumptions.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-primary mt-1">•</span>
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Disclaimer */}
              <div className="bg-muted/30 border border-border/30 rounded-lg p-4 mt-6">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <AlertCircle className="w-3 h-3 inline mr-1" />
                  {data.disclaimer}
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ThinkCheckModal;
