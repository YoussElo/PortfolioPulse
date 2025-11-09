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

    // Get sentiment data for holdings
    const symbols = holdings.map((h: any) => h.symbol);
    console.log('Fetching sentiment for symbols:', symbols);
    
    const { data: sentimentData, error: sentimentError } = await supabase
      .from('sentiment_analysis')
      .select('*')
      .in('symbol', symbols)
      .order('analyzed_at', { ascending: false });

    if (sentimentError) {
      console.error('Error fetching sentiment data:', sentimentError);
    }

    const sentimentMap = new Map();
    sentimentData?.forEach(s => {
      if (!sentimentMap.has(s.symbol)) {
        sentimentMap.set(s.symbol, s);
      }
    });

    // Generate RL recommendations using AI
    const portfolioContext = holdings.map((h: any) => {
      const sentiment = sentimentMap.get(h.symbol);
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
            content: 'You are an advanced Reinforcement Learning agent trained for portfolio optimization. Analyze portfolio holdings considering technical indicators, sentiment scores, and risk metrics. Provide actionable recommendations (buy/sell/hold/rebalance) with confidence scores and reasoning.'
          },
          {
            role: 'user',
            content: `Portfolio Analysis:\n${portfolioContext}\n\nProvide RL-based trading recommendations for each stock. Consider:\n1. Sentiment scores and market mood\n2. Current gains/losses\n3. Diversification needs\n4. Risk-adjusted returns\n\nReturn recommendations in JSON format.`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_rl_recommendations",
            description: "Generate RL agent recommendations for portfolio optimization",
            parameters: {
              type: "object",
              properties: {
                recommendations: {
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
                }
              },
              required: ["recommendations"],
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

    // Store recommendations in database
    const recommendations = analysis.recommendations;
    if (recommendations && recommendations.length > 0) {
      console.log(`Storing ${recommendations.length} recommendations in database`);
      
      const { error: insertError } = await supabase
        .from('rl_recommendations')
        .insert(
          recommendations.map((rec: any) => ({
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

    console.log('Returning recommendations to client');
    return new Response(
      JSON.stringify({ success: true, recommendations }),
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