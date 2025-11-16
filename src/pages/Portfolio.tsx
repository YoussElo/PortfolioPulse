import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, TrendingDown, Upload, RefreshCw } from "lucide-react";
import { CSVUpload } from "@/components/CSVUpload";
import { RLRecommendations } from "@/components/RLRecommendations";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSectorForSymbol } from "@/lib/sectorMapping";

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
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [portfolioName, setPortfolioName] = useState("My Portfolio");
  const [newPortfolioName, setNewPortfolioName] = useState("");
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
    loadAllPortfolios();
  }, []);

  const loadAllPortfolios = async () => {
    const { data: allPortfolios } = await supabase
      .from('portfolios')
      .select('*')
      .order('created_at', { ascending: false });

    if (allPortfolios && allPortfolios.length > 0) {
      setPortfolios(allPortfolios);
      setPortfolioId(allPortfolios[0].id);
      setPortfolioName(allPortfolios[0].name);
      loadHoldings(allPortfolios[0].id);
      loadRecommendations(allPortfolios[0].id);
    }
  };

  const switchPortfolio = (newPortfolioId: string) => {
    const selected = portfolios.find(p => p.id === newPortfolioId);
    if (selected) {
      setPortfolioId(selected.id);
      setPortfolioName(selected.name);
      loadHoldings(selected.id);
      loadRecommendations(selected.id);
    }
  };

  const loadHoldings = async (portId: string) => {
    const { data } = await supabase
      .from('portfolio_holdings')
      .select('*')
      .eq('portfolio_id', portId);

    if (data && data.length > 0) {
      // Transform DB data to UI format with auto-detected sectors
      const transformed = data.map(h => ({
        symbol: h.symbol,
        name: h.symbol,
        shares: Number(h.shares),
        avgCost: Number(h.avg_cost),
        currentPrice: Number(h.avg_cost) * 1.1, // Mock current price
        totalValue: Number(h.shares) * Number(h.avg_cost) * 1.1,
        gain: Number(h.shares) * Number(h.avg_cost) * 0.1,
        gainPercent: 10,
        sector: getSectorForSymbol(h.symbol)
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
      const portfolioNameToUse = newPortfolioName.trim() || `Portfolio ${new Date().toLocaleDateString()}`;
      
      // Always create a new portfolio for each CSV import
      const { data: newPortfolio, error: portfolioError } = await supabase
        .from('portfolios')
        .insert({ name: portfolioNameToUse })
        .select()
        .single();

      if (portfolioError || !newPortfolio) {
        toast({
          title: "Error",
          description: "Failed to create portfolio",
          variant: "destructive"
        });
        return;
      }

      const portId = newPortfolio.id;

      // Insert holdings with auto-detected sectors
      const { error } = await supabase
        .from('portfolio_holdings')
        .insert(
          data.map(h => ({
            portfolio_id: portId,
            symbol: h.symbol,
            shares: h.shares,
            avg_cost: h.avgCost,
            sector: getSectorForSymbol(h.symbol)
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
        // Reload all portfolios and switch to the new one
        await loadAllPortfolios();
        setPortfolioId(portId);
        setPortfolioName(portfolioNameToUse);
        await loadHoldings(portId);
        setShowUpload(false);
        setNewPortfolioName("");
        toast({
          title: "Success",
          description: `Created "${portfolioNameToUse}" with ${data.length} holdings`,
        });
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
      <div className="flex justify-between items-center gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Portfolio</h1>
          <p className="text-muted-foreground">Manage your investment holdings</p>
        </div>
        <div className="flex items-center gap-2">
          {portfolios.length > 0 && (
            <Select value={portfolioId || undefined} onValueChange={switchPortfolio}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Select portfolio" />
              </SelectTrigger>
              <SelectContent>
                {portfolios.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" size="icon" onClick={loadAllPortfolios}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog open={showUpload} onOpenChange={setShowUpload}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Import New Portfolio from CSV</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="portfolio-name">Portfolio Name</Label>
                  <Input
                    id="portfolio-name"
                    placeholder="e.g., Q1 2025 Portfolio"
                    value={newPortfolioName}
                    onChange={(e) => setNewPortfolioName(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Leave empty to auto-generate name with today's date
                  </p>
                </div>
                <CSVUpload onDataParsed={handleCSVData} />
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={() => generateRLRecommendations(portfolioId)} disabled={isLoadingRL || !portfolioId}>
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
