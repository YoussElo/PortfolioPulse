import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Brain, Shield, BarChart3, ArrowRight } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBg})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
        </div>
        
        <div className="relative z-10 container mx-auto px-6 text-center">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-1000">
            PortfolioPulse
          </h1>
          <p className="text-2xl md:text-3xl text-muted-foreground mb-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
            AI-Powered Portfolio Management
          </p>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
            Make smarter investment decisions with real-time sentiment analysis and advanced risk metrics
          </p>
          <Button 
            size="lg" 
            className="text-lg px-8 py-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500"
            onClick={() => navigate("/dashboard")}
          >
            View Demo Dashboard <ArrowRight className="ml-2" />
          </Button>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-4xl font-bold text-center mb-6">The Problem</h2>
          <Card className="bg-destructive/10 border-destructive/20">
            <CardContent className="p-8">
              <p className="text-xl text-center leading-relaxed">
                Investors lose money because they make <span className="font-bold text-destructive">emotional decisions</span> without data-driven insights. Traditional portfolio trackers only show you the numbers, but they don't tell you <span className="font-bold">why</span> your investments are moving.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-4xl font-bold text-center mb-6">The Solution</h2>
          <Card className="bg-success/10 border-success/20">
            <CardContent className="p-8">
              <p className="text-xl text-center leading-relaxed mb-6">
                <span className="font-bold text-success">PortfolioPulse</span> combines traditional financial metrics with <span className="font-bold">AI-powered sentiment analysis</span> to give you the complete picture. Know not just what's happening to your portfolio, but <span className="font-bold">why it's happening</span>.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Key Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Brain className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">AI Sentiment Analysis</h3>
                <p className="text-muted-foreground">
                  Real-time sentiment analysis using FinBERT and NLP on news/social media
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-2">RL Recommendations</h3>
                <p className="text-muted-foreground">
                  Reinforcement learning agent provides buy/sell/hold insights with confidence scores
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-warning/10 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-warning" />
                </div>
                <h3 className="text-xl font-bold mb-2">CSV Import/Export</h3>
                <p className="text-muted-foreground">
                  Easily import portfolios via CSV and export analysis reports for presentations
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-chart-4/10 flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-chart-4" />
                </div>
                <h3 className="text-xl font-bold mb-2">Interactive Dashboard</h3>
                <p className="text-muted-foreground">
                  Real-time data visualization and insights
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to see it in action?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Explore the interactive demo dashboard
          </p>
          <Button 
            size="lg" 
            className="text-lg px-8 py-6"
            onClick={() => navigate("/dashboard")}
          >
            Launch Dashboard <ArrowRight className="ml-2" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Landing;
