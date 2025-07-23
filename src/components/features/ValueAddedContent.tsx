
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Eye, TrendingUp } from 'lucide-react';

interface ValueAddedContentProps {
  articleId: string;
  title: string;
  content: string;
}

const ValueAddedContent: React.FC<ValueAddedContentProps> = ({ 
  articleId, 
  title, 
  content 
}) => {
  // Mock data for demonstration since clustering is removed
  const mockStats = {
    readTime: Math.floor(content.length / 200) || 1,
    trending: Math.random() > 0.7,
    views: Math.floor(Math.random() * 1000) + 100
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Article Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {mockStats.readTime} min read
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {mockStats.views} views
            </Badge>
            {mockStats.trending && (
              <Badge variant="default">
                Trending
              </Badge>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>This article covers current events and news topics.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ValueAddedContent;
