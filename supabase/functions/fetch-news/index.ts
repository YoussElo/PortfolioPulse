import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewsArticle {
  title: string;
  url: string;
  source: {
    name: string;
  };
  publishedAt: string;
  description: string;
  sentiment?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbols = [] } = await req.json();
    console.log('Fetching news for symbols:', symbols);

    const NEWSAPI_KEY = Deno.env.get('NEWSAPI_KEY');
    if (!NEWSAPI_KEY) {
      throw new Error('NEWSAPI_KEY not configured');
    }

    // Build search query from symbols
    const query = symbols.length > 0 
      ? symbols.map((s: string) => s.toUpperCase()).join(' OR ')
      : 'stock market OR finance OR investing';

    console.log('Search query:', query);

    // Fetch news from NewsAPI
    const newsUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&pageSize=10&apiKey=${NEWSAPI_KEY}`;
    
    const response = await fetch(newsUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('NewsAPI error:', response.status, errorText);
      throw new Error(`NewsAPI returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('NewsAPI response:', { 
      status: data.status, 
      totalResults: data.totalResults,
      articlesCount: data.articles?.length 
    });

    if (data.status !== 'ok') {
      throw new Error(`NewsAPI status: ${data.status}`);
    }

    // Transform and analyze sentiment
    const articles = data.articles.map((article: NewsArticle) => {
      // Simple sentiment analysis based on keywords
      const text = `${article.title} ${article.description}`.toLowerCase();
      let sentiment = 'neutral';
      
      const positiveKeywords = ['surge', 'rally', 'gain', 'rise', 'bullish', 'growth', 'profit', 'beat', 'success', 'positive', 'upgrade', 'up'];
      const negativeKeywords = ['fall', 'drop', 'decline', 'bearish', 'loss', 'miss', 'negative', 'down', 'crash', 'plunge', 'downgrade'];
      
      const positiveCount = positiveKeywords.filter(word => text.includes(word)).length;
      const negativeCount = negativeKeywords.filter(word => text.includes(word)).length;
      
      if (positiveCount > negativeCount) {
        sentiment = 'positive';
      } else if (negativeCount > positiveCount) {
        sentiment = 'negative';
      }

      // Calculate relative time
      const publishedDate = new Date(article.publishedAt);
      const now = new Date();
      const diffMs = now.getTime() - publishedDate.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      
      let publishedTime;
      if (diffHours < 1) {
        publishedTime = 'Just now';
      } else if (diffHours < 24) {
        publishedTime = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else if (diffDays < 7) {
        publishedTime = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else {
        publishedTime = publishedDate.toLocaleDateString();
      }

      return {
        title: article.title,
        url: article.url,
        source: article.source.name,
        published: publishedTime,
        sentiment: sentiment,
        description: article.description
      };
    }).filter((article: any) => article.title && article.url); // Filter out invalid articles

    console.log(`Returning ${articles.length} articles`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        articles: articles,
        totalResults: data.totalResults 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in fetch-news function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        articles: [] 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
