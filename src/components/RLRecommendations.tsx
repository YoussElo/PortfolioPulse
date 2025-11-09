import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus, Brain, Sparkles } from "lucide-react";

interface Recommendation {
  symbol: string;
  action: string;
  confidence: number;
  expected_return: number;
  reasoning: string;
}

interface NewOpportunity {
  symbol: string;
  confidence: number;
  expected_return: number;
  reasoning: string;
}

interface RLRecommendationsProps {
  recommendations: Recommendation[];
  newOpportunities: NewOpportunity[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

const getActionIcon = (action: string) => {
  switch (action) {
    case 'buy':
      return <TrendingUp className="w-4 h-4 text-success" />;
    case 'sell':
      return <TrendingDown className="w-4 h-4 text-destructive" />;
    case 'rebalance':
      return <Sparkles className="w-4 h-4 text-warning" />;
    default:
      return <Minus className="w-4 h-4 text-muted-foreground" />;
  }
};

const getActionColor = (action: string) => {
  switch (action) {
    case 'buy':
      return 'bg-success/10 text-success border-success/20';
    case 'sell':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'rebalance':
      return 'bg-warning/10 text-warning border-warning/20';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export const RLRecommendations = ({ 
  recommendations,
  newOpportunities,
  onRefresh, 
  isLoading 
}: RLRecommendationsProps) => {
  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" />
              Portfolio Recommendations
            </CardTitle>
            {onRefresh && (
              <Button 
                onClick={onRefresh} 
                size="sm" 
                variant="outline"
                disabled={isLoading}
              >
                {isLoading ? 'Analyzing...' : 'Refresh'}
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            AI-powered portfolio optimization using Reinforcement Learning
          </p>
        </CardHeader>
        <CardContent>
          {recommendations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No recommendations available yet.</p>
              <p className="text-sm mt-2">Click "Generate RL Insights" to analyze your portfolio.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec, idx) => (
                <div 
                  key={idx}
                  className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="font-bold text-lg">{rec.symbol}</div>
                      <Badge 
                        variant="outline" 
                        className={getActionColor(rec.action)}
                      >
                        <span className="flex items-center gap-1">
                          {getActionIcon(rec.action)}
                          {rec.action.toUpperCase()}
                        </span>
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${
                        rec.expected_return >= 0 ? 'text-success' : 'text-destructive'
                      }`}>
                        {rec.expected_return > 0 ? '+' : ''}{rec.expected_return.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Expected Return</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Confidence</span>
                        <span className="font-semibold">{(rec.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={rec.confidence * 100} className="h-2" />
                    </div>

                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {rec.reasoning}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Investment Opportunities */}
      {newOpportunities && newOpportunities.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              New Investment Opportunities
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Potential stocks to add to your portfolio based on sentiment analysis
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {newOpportunities.map((opp, idx) => (
                <div 
                  key={idx}
                  className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="font-bold text-lg">{opp.symbol}</div>
                      <Badge variant="outline" className="bg-primary/10 text-primary">
                        New Opportunity
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${
                        opp.expected_return >= 0 ? 'text-success' : 'text-destructive'
                      }`}>
                        {opp.expected_return > 0 ? '+' : ''}{opp.expected_return.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Expected Return</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Confidence</span>
                        <span className="font-semibold">{(opp.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={opp.confidence * 100} className="h-2" />
                    </div>

                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {opp.reasoning}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
