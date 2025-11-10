import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, TrendingDown, Upload } from "lucide-react";
import { CSVUpload } from "@/components/CSVUpload";
import { RLRecommendations } from "@/components/RLRecommendations";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const defaultHoldings = [
  { 
    symbol: "AAPL", 
    name: "Apple Inc.", 
    shares: 50, 
    avgCost: 150.50, 
    currentPrice: 175.30, 
    totalValue: 8765, 
    gain: 1240,
    gainPercent: 16.5,
    sector: "Technology"
  },
  { 
    symbol: "MSFT", 
    name: "Microsoft Corp.", 
    shares: 40, 
    avgCost: 280.00, 
    currentPrice: 335.50, 
    totalValue: 13420, 
    gain: 2220,
    gainPercent: 19.8,
    sector: "Technology"
  },
  { 
    symbol: "GOOGL", 
    name: "Alphabet Inc.", 
    shares: 30, 
    avgCost: 125.00, 
    currentPrice: 138.75, 
    totalValue: 4163, 
    gain: 413,
    gainPercent: 11.0,
    sector: "Technology"
  },
  { 
    symbol: "JPM", 
    name: "JPMorgan Chase", 
    shares: 60, 
    avgCost: 145.00, 
    currentPrice: 152.80, 
    totalValue: 9168, 
    gain: 468,
    gainPercent: 5.4,
    sector: "Finance"
  },
  { 
    symbol: "JNJ", 
    name: "Johnson & Johnson", 
    shares: 45, 
    avgCost: 165.00, 
    currentPrice: 158.20, 
    totalValue: 7119, 
    gain: -306,
    gainPercent: -4.1,
    sector: "Healthcare"
  },
];

const Portfolio = () => {
  const [holdings, setHoldings] = useState(defaultHoldings);
  const [portfolioId, setPortfolioId] = useState<string | null>(null);
  const [rlRecommendations, setRlRecommendations] = useState<any[]>([]);
  const [newOpportunities, setNewOpportunities] = useState<any[]>([]);
  const [isLoadingRL, setIsLoadingRL] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const { toast } = useToast();

  const totalValue = holdings.reduce((sum, h) => sum + h.totalValue, 0);
  const totalGain = holdings.reduce((sum, h) => sum + h.gain, 0);
  const totalCost = totalValue - totalGain;
  const totalGainPercent = ((totalGain / totalCost) * 100).toFixed(1);

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    const { data: portfolios } = await supabase
      .from('portfolios')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (portfolios && portfolios.length > 0) {
      setPortfolioId(portfolios[0].id);
      loadHoldings(portfolios[0].id);
      loadRecommendations(portfolios[0].id);
    }
  };

  const loadHoldings = async (portId: string) => {
    const { data } = await supabase
      .from('portfolio_holdings')
      .select('*')
      .eq('portfolio_id', portId);

    if (data && data.length > 0) {
      // Transform DB data to UI format (simplified for demo)
      const transformed = data.map(h => ({
        symbol: h.symbol,
        name: h.symbol,
        shares: Number(h.shares),
        avgCost: Number(h.avg_cost),
        currentPrice: Number(h.avg_cost) * 1.1, // Mock current price
        totalValue: Number(h.shares) * Number(h.avg_cost) * 1.1,
        gain: Number(h.shares) * Number(h.avg_cost) * 0.1,
        gainPercent: 10,
        sector: h.sector || 'Unknown'
      }));
      setHoldings(transformed);
    }
  };

  const loadRecommendations = async (portId: string) => {
    const { data } = await supabase
      .from('rl_recommendations')
      .select('*')
      .eq('portfolio_id', portId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setRlRecommendations(data.map(r => ({
        symbol: r.symbol,
        action: r.action,
        confidence: Number(r.confidence),
        expected_return: Number(r.expected_return),
        reasoning: r.reasoning
      })));
    }
  };

  const handleCSVData = async (data: any[]) => {
    try {
      // Create portfolio if doesn't exist
      let portId = portfolioId;
      if (!portId) {
        const { data: newPortfolio } = await supabase
          .from('portfolios')
          .insert({ name: 'Imported Portfolio' })
          .select()
          .single();
        portId = newPortfolio?.id || null;
        setPortfolioId(portId);
      }

      if (portId) {
        // Insert holdings
        const { error } = await supabase
          .from('portfolio_holdings')
          .insert(
            data.map(h => ({
              portfolio_id: portId,
              symbol: h.symbol,
              shares: h.shares,
              avg_cost: h.avgCost,
              sector: h.sector || 'Unknown'
            }))
          );

        if (error) {
          console.error('Error inserting holdings:', error);
          toast({
            title: "Error",
            description: error.message || "Failed to save portfolio holdings",
            variant: "destructive"
          });
        } else {
          // Reload all data after import
          await loadHoldings(portId);
          await loadRecommendations(portId);
          setShowUpload(false);
          toast({
            title: "Success",
            description: `Imported ${data.length} new holdings. Total holdings: ${holdings.length + data.length}`,
          });
        }
      }
    } catch (error) {
      console.error('Error saving portfolio:', error);
      toast({
        title: "Error",
        description: "Failed to save portfolio",
        variant: "destructive"
      });
    }
  };

  const generateRLRecommendations = async (portId: string | null) => {
    if (!portId) {
      toast({
        title: "No Portfolio",
        description: "Please create or import a portfolio first",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoadingRL(true);
    try {
      console.log('Generating RL recommendations for portfolio:', portId);
      console.log('Holdings data:', holdings);
      
      const { data, error } = await supabase.functions.invoke('rl-recommendations', {
        body: { 
          portfolio_id: portId,
          holdings: holdings.map(h => ({
            symbol: h.symbol,
            shares: h.shares,
            avgCost: h.avgCost,
            currentPrice: h.currentPrice,
            gainPercent: h.gainPercent
          }))
        }
      });

      console.log('RL recommendations response:', { data, error });

      if (error) {
        console.error('Error from edge function:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to generate recommendations",
          variant: "destructive"
        });
        return;
      }

      if (data?.portfolio_recommendations) {
        setRlRecommendations(data.portfolio_recommendations);
        setNewOpportunities(data.new_opportunities || []);
        
        const totalRecs = data.portfolio_recommendations.length + (data.new_opportunities?.length || 0);
        toast({
          title: "RL Analysis Complete",
          description: `Generated ${data.portfolio_recommendations.length} portfolio recommendations and ${data.new_opportunities?.length || 0} new opportunities`
        });
      } else {
        toast({
          title: "No Recommendations",
          description: "No recommendations were generated",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error generating RL recommendations:', error);
      toast({
        title: "Error",
        description: "Failed to generate recommendations",
        variant: "destructive"
      });
    } finally {
      setIsLoadingRL(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Portfolio</h1>
          <p className="text-muted-foreground">Manage your investment holdings</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showUpload} onOpenChange={setShowUpload}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Import Portfolio from CSV</DialogTitle>
              </DialogHeader>
              <CSVUpload onDataParsed={handleCSVData} />
            </DialogContent>
          </Dialog>
          <Button onClick={() => generateRLRecommendations(portfolioId)} disabled={isLoadingRL}>
            <Plus className="mr-2 h-4 w-4" />
            {isLoadingRL ? 'Analyzing...' : 'Generate RL Insights'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Market Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Cost Basis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Gain/Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalGain >= 0 ? 'text-success' : 'text-destructive'}`}>
              ${Math.abs(totalGain).toLocaleString()} ({totalGainPercent}%)
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Holdings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Company</TableHead>
                <TableHead className="text-right">Shares</TableHead>
                <TableHead className="text-right">Avg Cost</TableHead>
                <TableHead className="text-right">Current Price</TableHead>
                <TableHead className="text-right">Market Value</TableHead>
                <TableHead className="text-right">Gain/Loss</TableHead>
                <TableHead>Sector</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holdings.map((holding) => (
                <TableRow key={holding.symbol} className="hover:bg-muted/50 cursor-pointer">
                  <TableCell className="font-bold">{holding.symbol}</TableCell>
                  <TableCell>{holding.name}</TableCell>
                  <TableCell className="text-right">{holding.shares}</TableCell>
                  <TableCell className="text-right">${holding.avgCost.toFixed(2)}</TableCell>
                  <TableCell className="text-right">${holding.currentPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-semibold">${holding.totalValue.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <div className={`flex items-center justify-end gap-1 ${holding.gain >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {holding.gain >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span className="font-semibold">
                        ${Math.abs(holding.gain).toFixed(0)} ({Math.abs(holding.gainPercent)}%)
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{holding.sector}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* RL Recommendations */}
      <RLRecommendations 
        recommendations={rlRecommendations}
        newOpportunities={newOpportunities}
        onRefresh={() => generateRLRecommendations(portfolioId)}
        isLoading={isLoadingRL}
      />
    </div>
  );
};

export default Portfolio;
