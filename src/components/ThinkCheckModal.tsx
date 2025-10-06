import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Brain, Target, Flame, AlertCircle, Search, Eye } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ThinkCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: {
    headline: string;
    author?: string;
    sourceUrl?: string;
    trustScore?: number;
    contextualInfo?: {
      topic: string;
      backgroundInfo: string[];
      keyFacts: string[];
      relatedConcepts: string[];
    };
  };
}

interface QuestionSectionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  defaultOpen?: boolean;
}

const QuestionSection = ({ icon, title, description, actionLabel, onAction, defaultOpen = false }: QuestionSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border-b border-border/50 last:border-b-0">
      <CollapsibleTrigger className="w-full py-4 flex items-start gap-3 hover:bg-accent/5 transition-colors px-4 -mx-4">
        <div className="flex-shrink-0 mt-0.5">
          {icon}
        </div>
        <div className="flex-1 text-left">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            {title}
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </h3>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4 space-y-3">
        <p className="text-muted-foreground text-sm leading-relaxed">
          {description}
        </p>
        {actionLabel && onAction && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onAction}
            className="text-xs"
          >
            {actionLabel}
          </Button>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

const ThinkCheckModal = ({ isOpen, onClose, article }: ThinkCheckModalProps) => {
  const handleViewSource = () => {
    if (article.sourceUrl) {
      window.open(article.sourceUrl, '_blank');
    }
  };

  const handleCompareePerspectives = () => {
    // This could trigger navigation to related articles or open a comparison view
    console.log('Compare perspectives');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-4 border-b">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            <DialogTitle className="text-xl font-bold">Think Check</DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Pause before you believe or share. Take a moment to reflect on what you're reading.
          </p>
        </DialogHeader>

        <div className="space-y-1 py-2">
          <QuestionSection
            icon={<Search className="w-5 h-5 text-primary" />}
            title="Who created this content?"
            description="Is the source transparent? What's their track record or possible agenda? Understanding who's behind the content helps you evaluate its reliability and potential biases."
            actionLabel="View source profile"
            onAction={handleViewSource}
            defaultOpen={true}
          />

          <QuestionSection
            icon={<Target className="w-5 h-5 text-blue-500" />}
            title="What's their goal?"
            description="Are they informing, persuading, provoking, or selling something? Every piece of content has a purpose. Consider whether the goal is to educate you objectively or influence your opinion or behavior."
          />

          <QuestionSection
            icon={<Flame className="w-5 h-5 text-orange-500" />}
            title="What emotions is this trying to trigger?"
            description="Are you feeling angry, afraid, proud, or outraged? Content designed to provoke strong emotions can bypass your critical thinking. Notice your emotional response and ask why you're feeling it."
          />

          <QuestionSection
            icon={<AlertCircle className="w-5 h-5 text-yellow-500" />}
            title="What's missing from this narrative?"
            description="Are you seeing all sides of the story? Every narrative has limitations. Consider what perspectives, context, or counterarguments might not be included."
            actionLabel="Compare with opposing perspectives"
            onAction={handleCompareePerspectives}
          />

          <QuestionSection
            icon={<Eye className="w-5 h-5 text-purple-500" />}
            title="What assumptions are you being nudged to accept?"
            description="What beliefs or ideas are being slipped in without evidence? Pay attention to loaded language, framing, and unstated premises that guide you toward particular conclusions."
          />
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center italic">
            Critical thinking is a skill. The more you practice, the better you become at spotting manipulation and making informed decisions.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ThinkCheckModal;
