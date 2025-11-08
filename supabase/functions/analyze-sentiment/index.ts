import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbols } = await req.json();
    console.log('Analyzing sentiment for symbols:', symbols);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const results = [];

    for (const symbol of symbols) {
      console.log(`Processing sentiment for ${symbol}`);

      // Simulate news headlines (in production, fetch from RSS feeds)
      const mockNews = [
        `${symbol} reports strong quarterly earnings, beating expectations`,
        `Analysts upgrade ${symbol} stock with bullish outlook`,
        `${symbol} announces new product line expansion`,
        `Market volatility affects ${symbol} trading volume`,
        `${symbol} CEO discusses growth strategy in interview`,
      ];

      // Call Lovable AI for sentiment analysis
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: 'You are a financial sentiment analysis expert. Analyze news headlines and provide a sentiment score between 0 (very bearish) and 1 (very bullish), along with key insights. Return JSON with: sentiment_score (number 0-1), sentiment_label (bearish/neutral/bullish), key_points (array of strings).'
            },
            {
              role: 'user',
              content: `Analyze these news headlines for ${symbol}:\n${mockNews.join('\n')}\n\nProvide sentiment analysis in JSON format.`
            }
          ],
          tools: [{
            type: "function",
            function: {
              name: "analyze_sentiment",
              description: "Analyze financial sentiment from news headlines",
              parameters: {
                type: "object",
                properties: {
                  sentiment_score: { type: "number", description: "Score between 0 (bearish) and 1 (bullish)" },
                  sentiment_label: { type: "string", enum: ["bearish", "neutral", "bullish"] },
                  key_points: { type: "array", items: { type: "string" }, description: "Key insights from analysis" }
                },
                required: ["sentiment_score", "sentiment_label", "key_points"],
                additionalProperties: false
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "analyze_sentiment" } }
        }),
      });

      if (!response.ok) {
        console.error(`AI API error for ${symbol}:`, response.status);
        continue;
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      const analysis = toolCall ? JSON.parse(toolCall.function.arguments) : {
        sentiment_score: 0.7,
        sentiment_label: 'bullish',
        key_points: ['Strong market position', 'Positive analyst outlook']
      };

      // Store in database
      const { error: insertError } = await supabase
        .from('sentiment_analysis')
        .insert({
          symbol,
          sentiment_score: analysis.sentiment_score,
          sentiment_label: analysis.sentiment_label,
          news_count: mockNews.length,
          key_points: analysis.key_points,
        });

      if (insertError) {
        console.error(`Error storing sentiment for ${symbol}:`, insertError);
      }

      results.push({
        symbol,
        ...analysis,
        news_count: mockNews.length
      });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-sentiment:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});