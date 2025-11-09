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
    const { portfolio_id, holdings } = await req.json();
    console.log('Generating RL recommendations for portfolio:', portfolio_id);
    console.log('Received holdings:', JSON.stringify(holdings));

    if (!holdings || holdings.length === 0) {
      console.error('No holdings provided');
      return new Response(
        JSON.stringify({ error: 'No holdings provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Portfolio symbols
    const portfolioSymbols = holdings.map((h: any) => h.symbol);
    console.log('Portfolio symbols:', portfolioSymbols);
    
    // Popular stocks to analyze for new opportunities
    const popularStocks = ['NVDA', 'AMD', 'META', 'AMZN', 'NFLX', 'DIS', 'BA', 'V', 'MA', 'UNH', 'COST', 'INTC'];
    const newOpportunitySymbols = popularStocks.filter(s => !portfolioSymbols.includes(s));
    console.log('Analyzing new opportunities:', newOpportunitySymbols);
    
    const allSymbols = [...portfolioSymbols, ...newOpportunitySymbols];
    
    // Get sentiment data
    const { data: sentimentData, error: sentimentError } = await supabase
      .from('sentiment_analysis')
      .select('*')
      .in('symbol', allSymbols)
      .order('analyzed_at', { ascending: false });

    if (sentimentError) {
      console.error('Error fetching sentiment data:', sentimentError);
    }

    // Create sentiment maps
    const portfolioSentimentMap = new Map();
    const opportunitySentimentMap = new Map();
    
    sentimentData?.forEach(s => {
      if (portfolioSymbols.includes(s.symbol) && !portfolioSentimentMap.has(s.symbol)) {
        portfolioSentimentMap.set(s.symbol, s);
      } else if (newOpportunitySymbols.includes(s.symbol) && !opportunitySentimentMap.has(s.symbol)) {
        opportunitySentimentMap.set(s.symbol, s);
      }
    });

    // Generate portfolio context
    const portfolioContext = holdings.map((h: any) => {
      const sentiment = portfolioSentimentMap.get(h.symbol);
      return {
        symbol: h.symbol,
        shares: h.shares,
        avg_cost: h.avgCost,
        current_price: h.currentPrice,
        gain_percent: h.gainPercent,
        sentiment_score: sentiment?.sentiment_score || 0.5,
        sentiment_label: sentiment?.sentiment_label || 'neutral'
      };
    }).map((h: any) => JSON.stringify(h)).join('\n');

    // Generate opportunities context
    const opportunitiesContext = newOpportunitySymbols.map(symbol => {
      const sentiment = opportunitySentimentMap.get(symbol);
      return {
        symbol,
        sentiment_score: sentiment?.sentiment_score || 0.5,
        sentiment_label: sentiment?.sentiment_label || 'neutral'
      };
    }).map((o: any) => JSON.stringify(o)).join('\n');

    console.log('Sending request to Lovable AI...');

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
            content: 'You are an advanced Reinforcement Learning agent trained for portfolio optimization. Analyze portfolio holdings and identify new investment opportunities based on sentiment analysis. Provide actionable recommendations with confidence scores and reasoning.'
          },
          {
            role: 'user',
            content: `Current Portfolio Analysis:\n${portfolioContext}\n\nPotential New Investment Opportunities (NOT in portfolio):\n${opportunitiesContext}\n\nProvide:\n1. Recommendations for existing holdings (buy/sell/hold/rebalance)\n2. Suggest 2-3 NEW stocks to consider buying based on positive sentiment\n\nConsider sentiment scores, gains/losses, and diversification.`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_rl_recommendations",
            description: "Generate portfolio recommendations and new investment opportunities",
            parameters: {
              type: "object",
              properties: {
                portfolio_recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      symbol: { type: "string" },
                      action: { type: "string", enum: ["buy", "sell", "hold", "rebalance"] },
                      confidence: { type: "number", description: "0-1 confidence score" },
                      expected_return: { type: "number", description: "Expected return percentage" },
                      reasoning: { type: "string", description: "Why this recommendation" }
                    },
                    required: ["symbol", "action", "confidence", "expected_return", "reasoning"]
                  }
                },
                new_opportunities: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      symbol: { type: "string" },
                      confidence: { type: "number", description: "0-1 confidence score" },
                      expected_return: { type: "number", description: "Expected return percentage" },
                      reasoning: { type: "string", description: "Why buy this stock" }
                    },
                    required: ["symbol", "confidence", "expected_return", "reasoning"]
                  }
                }
              },
              required: ["portfolio_recommendations", "new_opportunities"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "generate_rl_recommendations" } }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI API error:', response.status, error);
      throw new Error(`AI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    console.log('AI response received:', JSON.stringify(data));
    
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      console.error('No tool call in AI response');
      throw new Error('AI did not return recommendations in expected format');
    }
    
    const analysis = JSON.parse(toolCall.function.arguments);
    console.log('Parsed analysis:', JSON.stringify(analysis));

    // Store portfolio recommendations in database
    const portfolioRecommendations = analysis.portfolio_recommendations || [];
    if (portfolioRecommendations.length > 0) {
      console.log(`Storing ${portfolioRecommendations.length} recommendations in database`);
      
      const { error: insertError } = await supabase
        .from('rl_recommendations')
        .insert(
          portfolioRecommendations.map((rec: any) => ({
            portfolio_id,
            symbol: rec.symbol,
            action: rec.action,
            confidence: rec.confidence,
            expected_return: rec.expected_return,
            reasoning: rec.reasoning
          }))
        );

      if (insertError) {
        console.error('Error storing RL recommendations:', insertError);
      } else {
        console.log('Successfully stored recommendations in database');
      }
    }

    console.log('Returning recommendations and new opportunities to client');
    return new Response(
      JSON.stringify({ 
        success: true, 
        portfolio_recommendations: portfolioRecommendations,
        new_opportunities: analysis.new_opportunities || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in rl-recommendations:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
