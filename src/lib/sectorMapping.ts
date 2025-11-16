// Stock symbol to sector mapping
const sectorMap: Record<string, string> = {
  // Technology
  'AAPL': 'Technology',
  'MSFT': 'Technology',
  'GOOGL': 'Technology',
  'GOOG': 'Technology',
  'NVDA': 'Technology',
  'META': 'Technology',
  'TSLA': 'Technology',
  'NFLX': 'Technology',
  'AMD': 'Technology',
  'INTC': 'Technology',
  'CRM': 'Technology',
  'ORCL': 'Technology',
  'ADBE': 'Technology',
  'CSCO': 'Technology',
  'AVGO': 'Technology',
  'QCOM': 'Technology',
  'TXN': 'Technology',
  'NKLA': 'Technology',
  'IYW': 'Technology',
  
  // Finance
  'JPM': 'Finance',
  'BAC': 'Finance',
  'WFC': 'Finance',
  'GS': 'Finance',
  'MS': 'Finance',
  'C': 'Finance',
  'BLK': 'Finance',
  'SCHW': 'Finance',
  'AXP': 'Finance',
  'V': 'Finance',
  'MA': 'Finance',
  'PYPL': 'Finance',
  'FRD': 'Finance',
  
  // Healthcare
  'JNJ': 'Healthcare',
  'UNH': 'Healthcare',
  'PFE': 'Healthcare',
  'ABBV': 'Healthcare',
  'TMO': 'Healthcare',
  'ABT': 'Healthcare',
  'MRK': 'Healthcare',
  'DHR': 'Healthcare',
  'BMY': 'Healthcare',
  'AMGN': 'Healthcare',
  'LLY': 'Healthcare',
  
  // Energy
  'XOM': 'Energy',
  'CVX': 'Energy',
  'COP': 'Energy',
  'SLB': 'Energy',
  'EOG': 'Energy',
  'MPC': 'Energy',
  'PSX': 'Energy',
  'VLO': 'Energy',
  
  // Consumer
  'AMZN': 'Consumer',
  'WMT': 'Consumer',
  'HD': 'Consumer',
  'PG': 'Consumer',
  'KO': 'Consumer',
  'PEP': 'Consumer',
  'COST': 'Consumer',
  'NKE': 'Consumer',
  'MCD': 'Consumer',
  'SBUX': 'Consumer',
  
  // Real Estate / REITs
  'VNQ': 'Real Estate',
  'O': 'Real Estate',
  'PLD': 'Real Estate',
  'AMT': 'Real Estate',
  'SPG': 'Real Estate',
  'EQIX': 'Real Estate',
  'PSA': 'Real Estate',
  'DLR': 'Real Estate',
  
  // Bonds & Fixed Income
  'LQD': 'Fixed Income',
  'AGG': 'Fixed Income',
  'BND': 'Fixed Income',
  'BSV': 'Fixed Income',
  'TLT': 'Fixed Income',
  'HYG': 'Fixed Income',
  
  // Commodities
  'GLD': 'Commodities',
  'SLV': 'Commodities',
  'USO': 'Commodities',
  'DBA': 'Commodities',
  'GDX': 'Commodities',
  
  // Crypto / Alternative
  'GBTC': 'Crypto',
  'ETHE': 'Crypto',
  'DOGE': 'Crypto',
  
  // Broad Market ETFs
  'VOO': 'Broad Market',
  'SPY': 'Broad Market',
  'QQQ': 'Broad Market',
  'IWM': 'Broad Market',
  'VTI': 'Broad Market',
  'DIA': 'Broad Market',
  
  // International
  'IEFA': 'International',
  'EEM': 'International',
  'VEU': 'International',
  'VXUS': 'International',
  'EFA': 'International',
  'VWO': 'International',
  
  // Meme Stocks / High Risk
  'GME': 'Speculative',
  'AMC': 'Speculative',
  'BBBY': 'Speculative',
  'LK': 'Speculative',
  'SHLDQ': 'Distressed',
  'ENRONQ': 'Distressed',
  'SUNEQ': 'Distressed',
};

export const getSectorForSymbol = (symbol: string): string => {
  const upperSymbol = symbol.toUpperCase();
  return sectorMap[upperSymbol] || 'Other';
};

export const getSectorColor = (sector: string): string => {
  const colorMap: Record<string, string> = {
    'Technology': 'hsl(var(--chart-1))',
    'Finance': 'hsl(var(--chart-2))',
    'Healthcare': 'hsl(var(--chart-3))',
    'Energy': 'hsl(var(--chart-4))',
    'Consumer': 'hsl(var(--chart-5))',
    'Real Estate': 'hsl(var(--chart-1))',
    'Fixed Income': 'hsl(var(--chart-2))',
    'Commodities': 'hsl(var(--chart-3))',
    'Crypto': 'hsl(var(--chart-4))',
    'Broad Market': 'hsl(var(--chart-5))',
    'International': 'hsl(var(--chart-1))',
    'Speculative': 'hsl(var(--destructive))',
    'Distressed': 'hsl(var(--destructive))',
    'Other': 'hsl(var(--muted))',
  };
  return colorMap[sector] || 'hsl(var(--muted))';
};
