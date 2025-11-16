import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { NewsSection } from "@/components/NewsSection";

const sentimentHistory = [
  { date: "Week 1", overall: 0.65, news: 0.70, social: 0.60 },
  { date: "Week 2", overall: 0.72, news: 0.75, social: 0.68 },
  { date: "Week 3", overall: 0.58, news: 0.55, social: 0.62 },
  { date: "Week 4", overall: 0.81, news: 0.85, social: 0.77 },
  { date: "Week 5", overall: 0.76, news: 0.73, social: 0.80 },
];

const stockSentiments = [
  { symbol: "AAPL", name: "Apple Inc.", score: 0.82, trend: "bullish", change: "+5%" },
  { symbol: "MSFT", name: "Microsoft Corp.", score: 0.78, trend: "bullish", change: "+3%" },
  { symbol: "GOOGL", name: "Alphabet Inc.", score: 0.65, trend: "neutral", change: "0%" },
  { symbol: "JPM", name: "JPMorgan Chase", score: 0.71, trend: "bullish", change: "+2%" },
  { symbol: "JNJ", name: "Johnson & Johnson", score: 0.45, trend: "bearish", change: "-4%" },
];

const getSentimentColor = (score: number) => {
  if (score >= 0.7) return "text-success";
  if (score >= 0.4) return "text-warning";
  return "text-destructive";
};

const getSentimentLabel = (score: number) => {
  if (score >= 0.7) return "Bullish";
  if (score >= 0.4) return "Neutral";
  return "Bearish";
};

const getTrendIcon = (trend: string) => {
  if (trend === "bullish") return <TrendingUp className="w-4 h-4 text-success" />;
  if (trend === "bearish") return <TrendingDown className="w-4 h-4 text-destructive" />;
  return <Minus className="w-4 h-4 text-warning" />;
};

const Sentiment = () => {
  const [sentimentData, setSentimentData] = useState(stockSentiments);
  const [overallScore, setOverallScore] = useState(0.76);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSentimentData();
  }, []);

  const loadSentimentData = async () => {
    const { data } = await supabase
      .from('sentiment_analysis')
      .select('*')
      .order('analyzed_at', { ascending: false });

    if (data && data.length > 0) {
      // Group by symbol and get latest
      const latestBySymbol = new Map();
      data.forEach(item => {
        if (!latestBySymbol.has(item.symbol)) {
          latestBySymbol.set(item.symbol, {
            symbol: item.symbol,
            name: item.symbol,
            score: Number(item.sentiment_score),
            trend: item.sentiment_label,
            change: `${(Number(item.sentiment_score) * 100).toFixed(0)}%`,
            key_points: item.key_points
          });
        }
      });

      const sentiments = Array.from(latestBySymbol.values());
      setSentimentData(sentiments);
      
      const avgScore = sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length;
      setOverallScore(avgScore);
    }
  };

  const analyzeSentiment = async () => {
    setIsAnalyzing(true);
    try {
      const symbols = ['AAPL', 'MSFT', 'GOOGL', 'JPM', 'JNJ'];
      
      const { data, error } = await supabase.functions.invoke('analyze-sentiment', {
        body: { symbols }
      });

      if (!error && data?.success) {
        await loadSentimentData();
        toast({
          title: "Sentiment Analysis Complete",
          description: `Analyzed sentiment for ${symbols.length} stocks`
        });
      } else {
        throw new Error(error?.message || 'Failed to analyze sentiment');
      }
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      toast({
        title: "Error",
        description: "Failed to analyze sentiment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Sentiment Analysis</h1>
          <p className="text-muted-foreground">Real-time market sentiment powered by NLP</p>
        </div>
        <Button 
          onClick={analyzeSentiment} 
          disabled={isAnalyzing}
          variant="outline"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
          {isAnalyzing ? 'Analyzing...' : 'Refresh Sentiment'}
        </Button>
      </div>

      {/* Overall Sentiment Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            Overall Portfolio Sentiment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold">{(overallScore * 100).toFixed(0)}%</div>
                <Badge className={`mt-2 ${getSentimentColor(overallScore)}`}>
                  {getSentimentLabel(overallScore)}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Based on analysis of:</p>
                <ul className="text-sm mt-1 space-y-1">
                  <li>• 1,250+ news articles</li>
                  <li>• 5,000+ social mentions</li>
                  <li>• 200+ analyst reports</li>
                </ul>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Sentiment Score</span>
                <span className="font-semibold">{overallScore}/1.0</span>
              </div>
              <Progress value={overallScore * 100} className="h-3" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sentiment Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Sentiment Trends (5 Weeks)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={sentimentHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={[0, 1]} stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)"
                }} 
              />
              <Legend />
              <Line type="monotone" dataKey="overall" stroke="hsl(var(--primary))" strokeWidth={3} name="Overall" />
              <Line type="monotone" dataKey="news" stroke="hsl(var(--accent))" strokeWidth={2} name="News" />
              <Line type="monotone" dataKey="social" stroke="hsl(var(--chart-3))" strokeWidth={2} name="Social Media" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Individual Stock Sentiments */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Stock Sentiment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sentimentData.map((stock) => (
              <div key={stock.symbol} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4 flex-1">
                  <div>
                    <div className="font-bold text-lg">{stock.symbol}</div>
                    <div className="text-sm text-muted-foreground">{stock.name}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(stock.trend)}
                    <span className={`text-sm font-semibold ${
                      stock.trend === 'bullish' ? 'text-success' : 
                      stock.trend === 'bearish' ? 'text-destructive' : 
                      'text-warning'
                    }`}>
                      {stock.change}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-48">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Sentiment</span>
                      <span className={`font-semibold ${getSentimentColor(stock.score)}`}>
                        {(stock.score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={stock.score * 100} className="h-2" />
                  </div>
                  <Badge variant="outline" className={getSentimentColor(stock.score)}>
                    {getSentimentLabel(stock.score)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle>How AI Sentiment Analysis Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                1
              </div>
              <h4 className="font-semibold">Data Collection</h4>
              <p className="text-sm text-muted-foreground">
                We aggregate data from news articles, social media, analyst reports, and financial forums in real-time.
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                2
              </div>
              <h4 className="font-semibold">NLP Processing</h4>
              <p className="text-sm text-muted-foreground">
                Advanced transformer models (BERT, FinBERT) analyze text to extract sentiment, context, and market signals.
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                3
              </div>
              <h4 className="font-semibold">Score Generation</h4>
              <p className="text-sm text-muted-foreground">
                Weighted sentiment scores (0-1) are calculated and visualized, helping you make informed decisions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-Time News */}
      <NewsSection symbols={sentimentData.map(s => s.symbol)} />
    </div>
  );
};

export default Sentiment;
