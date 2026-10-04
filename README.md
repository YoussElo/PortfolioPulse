# PortfolioPulse

A portfolio tracking dashboard: import your holdings from a CSV, follow the news on each position, get an LLM-assisted sentiment read and a risk view.

Built with React, TypeScript, Vite, Tailwind and shadcn/ui, with Supabase for storage and edge functions. Generated with Lovable.

## What it does

- **Portfolio**: create portfolios and import holdings from a CSV.
- **News**: pulls finance headlines from public RSS feeds (Yahoo Finance, CNBC, Investing.com) through an edge function (`fetch-news`).
- **Sentiment**: scores the news with an LLM (Gemini 2.5 Flash through the Lovable AI gateway, `analyze-sentiment`).
- **Recommendations**: asks the same LLM for buy, sell or rebalance suggestions with a confidence and a rationale (`rl-recommendations`).
- **Risk**: a risk analysis page on the holdings.

## Limits you should know about

- The function and table named `rl-recommendations` are **not reinforcement learning**. They are LLM prompts, and the name is misleading.
- The portfolio page does not use live prices yet: current price is simulated as the average cost times 1.1. P&L figures are therefore illustrative.
- Recommendations are generated text, not a validated model. This is a demo, not investment advice.

## Run it

```sh
npm install
npm run dev
```

Create a `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from your own Supabase project. The edge functions read `LOVABLE_API_KEY`, `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from the project secrets.
