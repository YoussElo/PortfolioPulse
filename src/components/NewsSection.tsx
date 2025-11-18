import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Newspaper, ExternalLink, RefreshCw, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface NewsItem {
  title: string;
  url: string;
  source: string;
  published: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  description?: string;
}

interface NewsSectionProps {
  symbols?: string[];
}

export const NewsSection = ({ symbols = [] }: NewsSectionProps) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadNews();
    
    // Auto-refresh news every 5 minutes
    const interval = setInterval(() => {
      loadNews();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [symbols.join(',')]); // Use join to properly track array changes

  const loadNews = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching news for symbols:', symbols);
      
      const { data, error } = await supabase.functions.invoke('fetch-news', {
        body: { symbols }
      });

      if (error) {
        console.error('Error fetching news:', error);
        throw error;
      }

      if (data?.success && data?.articles) {
        console.log('Received articles:', data.articles.length);
        setNews(data.articles);
        
        if (data.articles.length === 0) {
          toast({
            title: "No News Found",
            description: "No recent news articles found for the selected stocks",
          });
        }
      } else {
        throw new Error(data?.error || 'Failed to fetch news');
      }
    } catch (error) {
      console.error('Error loading news:', error);
      toast({
        title: "Error",
        description: "Failed to load news. Please try again.",
        variant: "destructive"
      });
      // Set empty array on error
      setNews([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'secondary'> = {
      positive: 'default',
      negative: 'destructive',
      neutral: 'secondary'
    };
    return (
      <Badge variant={variants[sentiment] || 'secondary'} className="ml-2">
        {sentiment}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5" />
          <CardTitle>Real-Time Market News</CardTitle>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={loadNews}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Newspaper className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No news articles available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {news.map((item, index) => (
              <div 
                key={index}
                className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => setSelectedArticle(item)}
              >
                <div className="flex-1">
                  <div className="flex items-start gap-2">
                    <h4 className="font-semibold text-sm leading-tight">
                      {item.title}
                    </h4>
                    {getSentimentBadge(item.sentiment)}
                  </div>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span className="font-medium">{item.source}</span>
                    <span>•</span>
                    <span>{item.published}</span>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="ml-2 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(item.url, '_blank');
                  }}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl pr-8">{selectedArticle?.title}</DialogTitle>
            <DialogDescription className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">{selectedArticle?.source}</span>
                {selectedArticle && getSentimentBadge(selectedArticle.sentiment)}
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span className="text-xs">{selectedArticle?.published}</span>
              </div>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            {selectedArticle?.description && (
              <p className="text-sm text-foreground leading-relaxed">
                {selectedArticle.description}
              </p>
            )}
            
            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={() => window.open(selectedArticle?.url, '_blank')}
                className="flex-1"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Read Full Article
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedArticle(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
