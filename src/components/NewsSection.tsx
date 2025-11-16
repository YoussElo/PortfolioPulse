import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Newspaper, ExternalLink, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NewsItem {
  title: string;
  url: string;
  source: string;
  published: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

interface NewsSectionProps {
  symbols?: string[];
}

export const NewsSection = ({ symbols = [] }: NewsSectionProps) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const mockNews: NewsItem[] = [
    {
      title: "Market Rally Continues as Tech Stocks Surge",
      url: "#",
      source: "Financial Times",
      published: "2 hours ago",
      sentiment: 'positive'
    },
    {
      title: "Fed Signals Potential Rate Cuts in Q2",
      url: "#",
      source: "Bloomberg",
      published: "4 hours ago",
      sentiment: 'positive'
    },
    {
      title: "Apple Unveils New AI Features for iPhone",
      url: "#",
      source: "Reuters",
      published: "5 hours ago",
      sentiment: 'positive'
    },
    {
      title: "Energy Sector Faces Headwinds from Oil Price Volatility",
      url: "#",
      source: "WSJ",
      published: "6 hours ago",
      sentiment: 'negative'
    },
    {
      title: "Microsoft Cloud Revenue Beats Expectations",
      url: "#",
      source: "CNBC",
      published: "8 hours ago",
      sentiment: 'positive'
    },
    {
      title: "Market Analysis: Mixed Signals from Economic Data",
      url: "#",
      source: "MarketWatch",
      published: "10 hours ago",
      sentiment: 'neutral'
    }
  ];

  useEffect(() => {
    loadNews();
  }, [symbols]);

  const loadNews = async () => {
    setIsLoading(true);
    try {
      // In production, this would fetch from a real news API
      // For now, using mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      setNews(mockNews);
    } catch (error) {
      console.error('Error loading news:', error);
      toast({
        title: "Error",
        description: "Failed to load news",
        variant: "destructive"
      });
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
        <div className="space-y-4">
          {news.map((item, index) => (
            <div 
              key={index}
              className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-start gap-2">
                  <h4 className="font-semibold text-sm leading-tight">
                    {item.title}
                  </h4>
                  {getSentimentBadge(item.sentiment)}
                </div>
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
                onClick={() => window.open(item.url, '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
