import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { getSectorForSymbol, getSectorColor } from "@/lib/sectorMapping";
const performanceData = [{
  month: "Jan",
  value: 45000,
  benchmark: 43000
}, {
  month: "Feb",
  value: 47500,
  benchmark: 44000
}, {
  month: "Mar",
  value: 46800,
  benchmark: 45200
}, {
  month: "Apr",
  value: 51200,
  benchmark: 46500
}, {
  month: "May",
  value: 53800,
  benchmark: 48000
}, {
  month: "Jun",
  value: 58500,
  benchmark: 49500
}];
const allocationData = [{
  name: "Tech",
  value: 40,
  color: "hsl(var(--chart-1))"
}, {
  name: "Finance",
  value: 25,
  color: "hsl(var(--chart-2))"
}, {
  name: "Healthcare",
  value: 20,
  color: "hsl(var(--chart-3))"
}, {
  name: "Energy",
  value: 15,
  color: "hsl(var(--chart-4))"
}];
const sentimentData = [{
  date: "Mon",
  score: 0.65
}, {
  date: "Tue",
  score: 0.72
}, {
  date: "Wed",
  score: 0.58
}, {
  date: "Thu",
  score: 0.81
}, {
  date: "Fri",
  score: 0.76
}];
const Dashboard = () => {
  const [totalValue, setTotalValue] = useState(58500);
  const [totalGain, setTotalGain] = useState(13500);
  const [marketSentiment, setMarketSentiment] = useState(0.76);
  const [portfolioAllocation, setPortfolioAllocation] = useState(allocationData);
  const [holdings, setHoldings] = useState<any[]>([]);
  useEffect(() => {
    loadDashboardData();
  }, []);
  const loadDashboardData = async () => {
    // Load portfolio data
    const {
      data: portfolios
    } = await supabase.from('portfolios').select('*').order('created_at', {
      ascending: false
    }).limit(1);
    if (portfolios && portfolios.length > 0) {
      const {
        data: holdingsData
      } = await supabase.from('portfolio_holdings').select('*').eq('portfolio_id', portfolios[0].id);
      if (holdingsData && holdingsData.length > 0) {
        setHoldings(holdingsData);

        // Calculate totals
        const value = holdingsData.reduce((sum, h) => {
          return sum + Number(h.shares) * Number(h.avg_cost) * 1.1;
        }, 0);
        setTotalValue(value);
        setTotalGain(value * 0.23);

        // Calculate sector allocation with auto-detected sectors
        const sectorMap = new Map();
        holdingsData.forEach(h => {
          const sector = getSectorForSymbol(h.symbol);
          const val = Number(h.shares) * Number(h.avg_cost) * 1.1;
          sectorMap.set(sector, (sectorMap.get(sector) || 0) + val);
        });
        const allocation = Array.from(sectorMap.entries()).map(([name, value]) => ({
          name,
          value: Math.round(value / value * 100),
          color: getSectorColor(name)
        }));
        setPortfolioAllocation(allocation);
      }
    }

    // Load sentiment data
    const {
      data: sentimentData
    } = await supabase.from('sentiment_analysis').select('sentiment_score').order('analyzed_at', {
      ascending: false
    }).limit(10);
    if (sentimentData && sentimentData.length > 0) {
      const avgSentiment = sentimentData.reduce((sum, s) => sum + Number(s.sentiment_score), 0) / sentimentData.length;
      setMarketSentiment(avgSentiment);
    }
  };
  const gainPercent = (totalGain / (totalValue - totalGain) * 100).toFixed(1);
  const sentimentLabel = marketSentiment >= 0.7 ? 'Bullish' : marketSentiment >= 0.4 ? 'Neutral' : 'Bearish';
  return <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your portfolio analytics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-success flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +{gainPercent}% total return
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gain/Loss</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalGain >= 0 ? 'text-success' : 'text-destructive'}`}>
              ${Math.abs(totalGain).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {gainPercent}% ROI since inception
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Sentiment</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sentimentLabel}</div>
            <p className="text-xs text-success flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              {(marketSentiment * 100).toFixed(0)}% positive sentiment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Medium</div>
            <p className="text-xs text-muted-foreground mt-1">
              Sharpe ratio: 1.8
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-2">
          
          
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Portfolio Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={portfolioAllocation} cx="50%" cy="50%" labelLine={false} label={({
                name,
                percent
              }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                  {portfolioAllocation.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)"
              }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Sentiment Score (Weekly)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sentimentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={[0, 1]} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)"
              }} />
                <Bar dataKey="score" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} name="Sentiment" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default Dashboard;