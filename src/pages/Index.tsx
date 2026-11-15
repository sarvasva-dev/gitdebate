import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Sun, Moon, Send, Sparkles } from "lucide-react";

// The Gemini API key is read from the environment (Vite exposes only
// VITE_* variables to the browser). Never hardcode a key here — set
// VITE_GEMINI_API_KEY in a local .env file (gitignored) or in your hosting
// provider's environment variables (e.g. Vercel → Settings → Environment
// Variables). Note: a browser-side key is still visible to anyone who opens
// DevTools; for production, move API calls behind a backend service.
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const topics = [
  "AI will replace human jobs",
  "Social media does more harm than good",
  "Climate change is humanity's biggest threat",
  "Technology makes us less social",
  "Online education is better than traditional",
  "Privacy is more important than security"
];

const difficulties = ["Beginner", "Intermediate", "Advanced"];

export default function Index() {
  const [showSplash, setShowSplash] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const [stage, setStage] = useState<'setup' | 'debate' | 'results'>('setup');
  
  // Setup state
  const [selectedTopic, setSelectedTopic] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [position, setPosition] = useState<'for' | 'against' | ''>('');
  
  // Debate state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(600); // 10 minutes
  const [score, setScore] = useState({ user: 0, ai: 0 });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Splash screen timer
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Dark mode effect
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Debate timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (stage === 'debate' && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            endDebate();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [stage, timer]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendToGemini = async (message: string): Promise<string> => {
    if (!GEMINI_API_KEY) {
      return 'Missing Gemini API key. Set VITE_GEMINI_API_KEY in your environment to enable the AI opponent.';
    }
    try {
      const debateTopic = selectedTopic || customTopic;
      const systemPrompt = `You are participating in a debate about: "${debateTopic}". 
You are arguing ${position === 'for' ? 'AGAINST' : 'FOR'} this topic.
Difficulty level: ${difficulty}.
Provide ${difficulty === 'Beginner' ? 'simple' : difficulty === 'Advanced' ? 'sophisticated' : 'moderate'} arguments.
Keep responses concise (2-3 sentences). Be respectful but firm in your position.`;

      const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ 
              text: `${systemPrompt}\n\nUser argument: ${message}\n\nProvide your counter-argument:` 
            }]
          }]
        })
      });

      const data = await response.json();
      
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }
      throw new Error('Invalid response from API');
    } catch (error) {
      console.error('Error:', error);
      return 'I apologize, but I encountered an error. Please try again.';
    }
  };

  const startDebate = () => {
    const topic = selectedTopic || customTopic;
    if (!topic || !position) {
      toast({
        title: "Setup incomplete",
        description: "Please select a topic and position",
        variant: "destructive"
      });
      return;
    }
    
    const welcomeMsg: Message = {
      role: 'assistant',
      content: `Let's debate: "${topic}". You're arguing ${position === 'for' ? 'FOR' : 'AGAINST'}. I'll take the opposite side. Make your opening statement!`
    };
    
    setMessages([welcomeMsg]);
    setStage('debate');
    setTimer(600);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const aiResponse = await sendToGemini(input);
    const aiMessage: Message = { role: 'assistant', content: aiResponse };
    setMessages(prev => [...prev, aiMessage]);
    setScore(prev => ({ ...prev, user: prev.user + 1 }));
    setIsLoading(false);
  };

  const endDebate = () => {
    setStage('results');
  };

  const resetDebate = () => {
    setStage('setup');
    setMessages([]);
    setSelectedTopic('');
    setCustomTopic('');
    setPosition('');
    setTimer(600);
    setScore({ user: 0, ai: 0 });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (showSplash) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background">
        <div className="text-6xl md:text-7xl font-bold text-primary animate-in fade-in-0 zoom-in-95 duration-1000">
          DEBATE ARENA
        </div>
        <div className="text-xl md:text-2xl text-muted-foreground mt-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-1000 delay-300">
          Challenge AI. Sharpen Your Mind.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b border-primary/30 bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-primary">Debate Arena</h1>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsDark(!isDark)}
            className="border-warning text-warning hover:bg-warning hover:text-warning-foreground"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Setup Stage */}
        {stage === 'setup' && (
          <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {/* Topic Selection */}
            <Card className="p-6 border-primary/50 bg-card/80 backdrop-blur">
              <h2 className="text-2xl font-bold text-primary mb-4">Choose Your Topic</h2>
              <div className="grid grid-cols-1 gap-3 mb-4">
                {topics.map((topic) => (
                  <Button
                    key={topic}
                    variant={selectedTopic === topic ? "default" : "outline"}
                    className="justify-start text-left h-auto py-3 px-4"
                    onClick={() => {
                      setSelectedTopic(topic);
                      setCustomTopic('');
                    }}
                  >
                    {topic}
                  </Button>
                ))}
              </div>
              <Textarea
                placeholder="Or enter your own topic..."
                value={customTopic}
                onChange={(e) => {
                  setCustomTopic(e.target.value);
                  setSelectedTopic('');
                }}
                className="mt-4 bg-background/50"
              />
            </Card>

            {/* Settings */}
            <Card className="p-6 border-primary/50 bg-card/80 backdrop-blur">
              <h2 className="text-2xl font-bold text-primary mb-4">Debate Settings</h2>
              
              {/* Difficulty */}
              <div className="mb-6">
                <label className="text-sm font-medium mb-2 block">Difficulty Level</label>
                <div className="flex gap-2">
                  {difficulties.map((level) => (
                    <Button
                      key={level}
                      variant={difficulty === level ? "default" : "outline"}
                      onClick={() => setDifficulty(level)}
                      className="flex-1"
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Position */}
              <div className="mb-6">
                <label className="text-sm font-medium mb-2 block">Your Position</label>
                <div className="flex gap-4">
                  <Button
                    variant={position === 'for' ? "default" : "outline"}
                    onClick={() => setPosition('for')}
                    className="flex-1 h-16"
                  >
                    <div className="text-center">
                      <div className="font-bold">FOR</div>
                      <div className="text-xs opacity-80">Support the topic</div>
                    </div>
                  </Button>
                  <Button
                    variant={position === 'against' ? "default" : "outline"}
                    onClick={() => setPosition('against')}
                    className="flex-1 h-16"
                  >
                    <div className="text-center">
                      <div className="font-bold">AGAINST</div>
                      <div className="text-xs opacity-80">Oppose the topic</div>
                    </div>
                  </Button>
                </div>
              </div>

              <Button
                onClick={startDebate}
                disabled={!(selectedTopic || customTopic) || !position}
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary via-accent to-primary hover:opacity-90"
              >
                <Sparkles className="mr-2" />
                Start Debate
              </Button>
            </Card>
          </div>
        )}

        {/* Debate Stage */}
        {stage === 'debate' && (
          <div className="grid md:grid-cols-[1fr_300px] gap-6 max-w-6xl mx-auto">
            {/* Chat Area */}
            <Card className="p-6 border-primary/50 bg-card/80 backdrop-blur flex flex-col h-[600px]">
              <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                <h2 className="text-xl font-bold text-primary">
                  {selectedTopic || customTopic}
                </h2>
                <div className="text-sm text-muted-foreground">
                  Position: <span className="text-primary font-bold">{position?.toUpperCase()}</span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground border border-border'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted text-muted-foreground border border-border rounded-2xl px-4 py-3">
                      Thinking<span className="animate-pulse">...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={sendMessage} className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Make your argument..."
                  disabled={isLoading}
                  className="resize-none bg-background/50"
                  rows={2}
                />
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  size="icon"
                  className="h-auto"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </Card>

            {/* Sidebar */}
            <Card className="p-6 border-primary/50 bg-card/80 backdrop-blur flex flex-col gap-6">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-2">Time Remaining</div>
                <div className="text-4xl font-bold text-primary">{formatTime(timer)}</div>
              </div>

              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-3">Arguments Made</div>
                <div className="text-3xl font-bold text-foreground">{score.user}</div>
              </div>

              <Button
                variant="destructive"
                onClick={endDebate}
                className="w-full"
              >
                End Debate
              </Button>
            </Card>
          </div>
        )}

        {/* Results Stage */}
        {stage === 'results' && (
          <Card className="max-w-2xl mx-auto p-8 border-primary/50 bg-card/80 backdrop-blur text-center">
            <h2 className="text-4xl font-bold text-primary mb-6">Debate Complete!</h2>
            
            <div className="grid grid-cols-3 gap-6 my-8">
              <div>
                <div className="text-3xl font-bold text-primary">{score.user}</div>
                <div className="text-sm text-muted-foreground">Arguments</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">{formatTime(600 - timer)}</div>
                <div className="text-sm text-muted-foreground">Duration</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">{difficulty}</div>
                <div className="text-sm text-muted-foreground">Level</div>
              </div>
            </div>

            <div className="mb-8">
              <div className="inline-block bg-gradient-to-r from-primary to-accent text-primary-foreground px-6 py-3 rounded-full font-bold">
                🏆 Great Debate!
              </div>
            </div>

            <Button
              onClick={resetDebate}
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary via-accent to-primary"
            >
              Start New Debate
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
}
