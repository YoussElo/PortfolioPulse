import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// RSS feed sources for financial news
const RSS_FEEDS = [
  'https://feeds.finance.yahoo.com/rss/2.0/headline',
  'https://www.cnbc.com/id/10000664/device/rss/rss.html',
  'https://www.investing.com/rss/news.rss',
];

interface Article {
  title: string;
  url: string;
  source: string;
  published: string;
  sentiment: string;
  description: string;
}

// Simple XML parser for RSS feeds
function parseRSSFeed(xmlText: string): Article[] {
  const articles: Article[] = [];
  
  // Extract items using regex
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  const items = xmlText.match(itemRegex);
  
  if (!items) return articles;
  
  items.forEach((item) => {
    // Extract title
    const titleMatch = item.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : '';
    
    // Extract link
    const linkMatch = item.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
    const link = linkMatch ? linkMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : '';
    
    // Extract description
    const descMatch = item.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
    const description = descMatch ? descMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]*>/g, '').trim() : '';
    
    // Extract pubDate
    const pubDateMatch = item.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i);
    const pubDate = pubDateMatch ? pubDateMatch[1].trim() : '';
    
    if (title && link) {
      articles.push({
        title,
        url: link,
        description: description.substring(0, 150),
        pubDate, // Keep pubDate for later processing
      } as any);
    }
  });
  
  return articles;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbols = [] } = await req.json();
    console.log('Fetching news for symbols:', symbols);

    const allArticles: Article[] = [];

    // Fetch from multiple RSS feeds
    for (const feedUrl of RSS_FEEDS) {
      try {
        console.log(`Fetching feed: ${feedUrl}`);
        const response = await fetch(feedUrl);
        if (!response.ok) {
          console.log(`Feed ${feedUrl} returned ${response.status}`);
          continue;
        }
        
        const xmlText = await response.text();
        const parsedArticles = parseRSSFeed(xmlText);
        
        parsedArticles.forEach((article: any) => {
          const { title, url, description, pubDate } = article;
          
          // Filter by symbols if provided
          if (symbols.length > 0) {
            const hasSymbol = symbols.some((symbol: string) => 
              title.toUpperCase().includes(symbol.toUpperCase()) ||
              description.toUpperCase().includes(symbol.toUpperCase())
            );
            if (!hasSymbol) return;
          }

          // Simple sentiment analysis
          const text = `${title} ${description}`.toLowerCase();
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
          const publishedDate = new Date(pubDate);
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

          allArticles.push({
            title,
            url,
            source: new URL(feedUrl).hostname.replace('www.', ''),
            published: publishedTime,
            sentiment,
            description: description.substring(0, 150)
          });
        });
        
        console.log(`Parsed ${parsedArticles.length} articles from ${feedUrl}`);
      } catch (error) {
        console.error(`Error fetching feed ${feedUrl}:`, error);
        continue;
      }
    }

    // Sort by most recent and limit to 10
    const articles = allArticles
      .sort((a, b) => {
        // Simple sorting - prioritize "Just now" and recent items
        if (a.published === 'Just now') return -1;
        if (b.published === 'Just now') return 1;
        return 0;
      })
      .slice(0, 10);

    console.log(`Returning ${articles.length} articles`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        articles: articles,
        totalResults: articles.length 
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
