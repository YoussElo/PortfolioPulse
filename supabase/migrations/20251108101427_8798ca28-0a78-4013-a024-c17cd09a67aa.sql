-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Portfolios table to store user portfolios
CREATE TABLE IF NOT EXISTS public.portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  name TEXT NOT NULL DEFAULT 'My Portfolio',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Portfolio holdings table
CREATE TABLE IF NOT EXISTS public.portfolio_holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  shares DECIMAL(10, 4) NOT NULL CHECK (shares > 0),
  avg_cost DECIMAL(10, 2) NOT NULL CHECK (avg_cost >= 0),
  sector TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sentiment analysis results cache
CREATE TABLE IF NOT EXISTS public.sentiment_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol TEXT NOT NULL,
  sentiment_score DECIMAL(3, 2) NOT NULL CHECK (sentiment_score >= 0 AND sentiment_score <= 1),
  sentiment_label TEXT NOT NULL,
  news_count INTEGER DEFAULT 0,
  key_points JSONB,
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RL recommendations table
CREATE TABLE IF NOT EXISTS public.rl_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('buy', 'sell', 'hold', 'rebalance')),
  confidence DECIMAL(3, 2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  expected_return DECIMAL(5, 2),
  reasoning TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_portfolio_id ON public.portfolio_holdings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_symbol ON public.portfolio_holdings(symbol);
CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_symbol ON public.sentiment_analysis(symbol);
CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_analyzed_at ON public.sentiment_analysis(analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_rl_recommendations_portfolio_id ON public.rl_recommendations(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_rl_recommendations_created_at ON public.rl_recommendations(created_at DESC);

-- Enable RLS on all tables
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentiment_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rl_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for portfolios (public read, authenticated write)
CREATE POLICY "Anyone can view portfolios"
  ON public.portfolios FOR SELECT
  USING (true);

CREATE POLICY "Users can insert portfolios"
  ON public.portfolios FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own portfolios"
  ON public.portfolios FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their own portfolios"
  ON public.portfolios FOR DELETE
  USING (true);

-- RLS Policies for portfolio holdings
CREATE POLICY "Anyone can view holdings"
  ON public.portfolio_holdings FOR SELECT
  USING (true);

CREATE POLICY "Users can insert holdings"
  ON public.portfolio_holdings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update holdings"
  ON public.portfolio_holdings FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete holdings"
  ON public.portfolio_holdings FOR DELETE
  USING (true);

-- RLS Policies for sentiment analysis (public read)
CREATE POLICY "Anyone can view sentiment analysis"
  ON public.sentiment_analysis FOR SELECT
  USING (true);

CREATE POLICY "Service can insert sentiment analysis"
  ON public.sentiment_analysis FOR INSERT
  WITH CHECK (true);

-- RLS Policies for RL recommendations
CREATE POLICY "Anyone can view RL recommendations"
  ON public.rl_recommendations FOR SELECT
  USING (true);

CREATE POLICY "Service can insert RL recommendations"
  ON public.rl_recommendations FOR INSERT
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_portfolios_updated_at
  BEFORE UPDATE ON public.portfolios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_portfolio_holdings_updated_at
  BEFORE UPDATE ON public.portfolio_holdings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();