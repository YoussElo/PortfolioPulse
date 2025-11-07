import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Shield, TrendingDown, AlertTriangle, Activity } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const volatilityData = [
  { month: "Jan", portfolio: 12, market: 15 },
  { month: "Feb", portfolio: 15, market: 14 },
  { month: "Mar", portfolio: 18, market: 20 },
  { month: "Apr", portfolio: 11, market: 16 },
  { month: "May", portfolio: 13, market: 17 },
  { month: "Jun", portfolio: 10, market: 14 },
];

const drawdownData = [
  { date: "Week 1", value: 0 },
  { date: "Week 2", value: -2.5 },
  { date: "Week 3", value: -5.2 },
  { date: "Week 4", value: -3.1 },
  { date: "Week 5", value: -1.8 },
  { date: "Week 6", value: 0 },
];

const riskMetrics = [
  { name: "Beta", value: 1.15, description: "Slightly more volatile than market", status: "medium" },
  { name: "Alpha", value: 2.3, description: "Outperforming market by 2.3%", status: "good" },
  { name: "Standard Deviation", value: 12.5, description: "Moderate volatility", status: "medium" },
  { name: "Max Drawdown", value: -5.2, description: "Largest peak-to-trough decline", status: "good" },
];

const getRiskColor = (status: string) => {
  if (status === "good") return "bg-success/10 text-success border-success/20";
  if (status === "medium") return "bg-warning/10 text-warning border-warning/20";
  return "bg-destructive/10 text-destructive border-destructive/20";
};

const RiskAnalysis = () => {
  const sharpeRatio = 1.8;
  const riskScore = 65; // 0-100, lower is less risky

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold">Risk Analysis</h1>
        <p className="text-muted-foreground">Comprehensive risk metrics for your portfolio</p>
      </div>

      {/* Key Risk Indicators */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Sharpe Ratio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-4xl font-bold">{sharpeRatio}</div>
              <Badge className="bg-success/10 text-success border-success/20">
                Excellent Risk-Adjusted Returns
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">
                Your portfolio generates {sharpeRatio} units of return for each unit of risk. 
                A ratio above 1.0 is considered good, above 2.0 is excellent.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-warning/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-warning" />
              Overall Risk Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-4xl font-bold">{riskScore}/100</div>
              <Badge className="bg-warning/10 text-warning border-warning/20">
                Medium Risk
              </Badge>
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Risk Level</span>
                  <span className="font-semibold">Medium</span>
                </div>
                <Progress value={riskScore} className="h-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {riskMetrics.map((metric) => (
          <Card key={metric.name} className={getRiskColor(metric.status)}>
            <CardHeader>
              <CardTitle className="text-lg">{metric.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">
                {typeof metric.value === 'number' && metric.value < 0 ? '' : ''}
                {typeof metric.value === 'number' ? Math.abs(metric.value).toFixed(1) : metric.value}
                {metric.name === "Standard Deviation" ? '%' : ''}
              </div>
              <p className="text-sm">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Volatility Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Volatility Comparison (6 Months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={volatilityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" label={{ value: 'Volatility %', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)"
                }} 
              />
              <Legend />
              <Bar dataKey="portfolio" fill="hsl(var(--primary))" name="Your Portfolio" radius={[8, 8, 0, 0]} />
              <Bar dataKey="market" fill="hsl(var(--muted-foreground))" name="S&P 500" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-sm text-muted-foreground mt-4">
            Your portfolio's volatility is generally lower than the market benchmark, indicating better risk management.
          </p>
        </CardContent>
      </Card>

      {/* Drawdown Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Drawdown Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={drawdownData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" label={{ value: 'Drawdown %', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)"
                }} 
              />
              <Line type="monotone" dataKey="value" stroke="hsl(var(--destructive))" strokeWidth={3} name="Drawdown" />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-sm text-muted-foreground mt-4">
            Maximum drawdown of -5.2% occurred in Week 3. Your portfolio has recovered well, showing resilience.
          </p>
        </CardContent>
      </Card>

      {/* Risk Explanation */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle>Understanding Risk Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-semibold">Sharpe Ratio</h4>
              <p className="text-sm text-muted-foreground">
                Measures risk-adjusted returns. Higher is better. Calculated as (Portfolio Return - Risk-Free Rate) / Standard Deviation.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Beta</h4>
              <p className="text-sm text-muted-foreground">
                Measures volatility relative to the market. Beta = 1 means same as market, &gt;1 means more volatile, &lt;1 means less volatile.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Alpha</h4>
              <p className="text-sm text-muted-foreground">
                Excess return compared to market benchmark. Positive alpha means you're outperforming the market.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Max Drawdown</h4>
              <p className="text-sm text-muted-foreground">
                Largest peak-to-trough decline. Shows worst-case scenario and helps assess downside risk tolerance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiskAnalysis;
