import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";

const holdings = [
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
  const totalValue = holdings.reduce((sum, h) => sum + h.totalValue, 0);
  const totalGain = holdings.reduce((sum, h) => sum + h.gain, 0);
  const totalCost = totalValue - totalGain;
  const totalGainPercent = ((totalGain / totalCost) * 100).toFixed(1);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Portfolio</h1>
          <p className="text-muted-foreground">Manage your investment holdings</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Holding
        </Button>
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
    </div>
  );
};

export default Portfolio;
