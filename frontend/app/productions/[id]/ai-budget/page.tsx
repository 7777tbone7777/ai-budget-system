'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: any;
}

interface ParsedParams {
  location: string | null;
  production_type: string | null;
  budget: number | null;
  shoot_days: number | null;
  raw_prompt: string;
}

interface GenerationResult {
  success: boolean;
  parsed_params: ParsedParams;
  template_used: {
    id: number;
    name: string;
    location: string;
    production_type: string;
    original_budget: number;
  };
  scale_factor: number;
  groups_created: number;
  items_created: number;
  execution_time_ms: number;
}

export default function AIBudgetPage() {
  const params = useParams();
  const router = useRouter();
  const productionId = params.id as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showParsedPreview, setShowParsedPreview] = useState(false);
  const [parsedParams, setParsedParams] = useState<ParsedParams | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Add welcome message
    addMessage('assistant', `Hi! I'm your AI budget assistant. Tell me about your production and I'll generate a complete budget in seconds.

Try something like:
• "Atlanta one-hour pilot, 15 shoot days, $8M"
• "Los Angeles multi-cam series, $5 million budget"
• "New York cable series, 20 shoot days"`);
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (type: Message['type'], content: string, metadata?: any) => {
    const newMessage: Message = {
      id: Date.now().toString() + Math.random(),
      type,
      content,
      timestamp: new Date(),
      metadata
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleParsePreview = async () => {
    if (!inputValue.trim()) return;

    try {
      setShowParsedPreview(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/ai/parse`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: inputValue })
        }
      );

      if (!res.ok) throw new Error('Failed to parse input');

      const data = await res.json();
      setParsedParams({
        location: data.location,
        production_type: data.production_type,
        budget: data.budget,
        shoot_days: data.shoot_days,
        raw_prompt: data.raw_prompt
      });
    } catch (error: any) {
      console.error('Parse error:', error);
      setShowParsedPreview(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const userPrompt = inputValue.trim();
    if (!userPrompt) return;

    // Add user message
    addMessage('user', userPrompt);
    setInputValue('');
    setShowParsedPreview(false);
    setParsedParams(null);
    setIsGenerating(true);

    try {
      // Add system message
      addMessage('system', 'Analyzing your requirements...');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/ai/generate-budget`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            production_id: parseInt(productionId),
            prompt: userPrompt
          })
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to generate budget');
      }

      const result: GenerationResult = await res.json();

      // Show what was parsed
      const parsedSummary = buildParsedSummary(result.parsed_params);
      addMessage('assistant', `I understood:\n${parsedSummary}`, {
        type: 'parsed',
        data: result.parsed_params
      });

      // Show template match
      const templateSummary = buildTemplateSummary(result.template_used, result.scale_factor);
      addMessage('assistant', templateSummary, {
        type: 'template',
        data: result.template_used
      });

      // Show generation success
      const successMessage = `Budget generated successfully! 🎉

Created ${result.groups_created} departments with ${result.items_created} line items.
Generation time: ${(result.execution_time_ms / 1000).toFixed(2)}s

Redirecting to your budget...`;

      addMessage('assistant', successMessage, {
        type: 'success',
        data: result
      });

      // Redirect after a delay
      setTimeout(() => {
        router.push(`/productions/${productionId}/budget`);
      }, 2000);

    } catch (error: any) {
      addMessage('assistant', `Sorry, I encountered an error: ${error.message}

Please try rephrasing your request or check that your production ID is valid.`, {
        type: 'error',
        error: error.message
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const buildParsedSummary = (parsed: ParsedParams): string => {
    const parts: string[] = [];

    if (parsed.location) parts.push(`📍 Location: ${parsed.location}`);
    if (parsed.production_type) {
      const typeLabel = getProductionTypeLabel(parsed.production_type);
      parts.push(`🎬 Type: ${typeLabel}`);
    }
    if (parsed.budget) {
      parts.push(`💰 Budget: ${formatCurrency(parsed.budget)}`);
    }
    if (parsed.shoot_days) {
      parts.push(`📅 Shoot Days: ${parsed.shoot_days}`);
    }

    if (parts.length === 0) {
      return "I didn't find specific parameters, so I'll find the best available template.";
    }

    return parts.join('\n');
  };

  const buildTemplateSummary = (template: any, scaleFactor: number): string => {
    let summary = `Found a great match: "${template.name}"

📊 Original Budget: ${formatCurrency(template.original_budget)}`;

    if (scaleFactor !== 1.0) {
      summary += `\n🔄 Scaling Factor: ${scaleFactor.toFixed(2)}x (adjusting all amounts proportionally)`;
    }

    summary += `\n📍 Location: ${template.location}
🎬 Type: ${getProductionTypeLabel(template.production_type)}`;

    return summary;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getProductionTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'one_hour_pilot': 'One Hour Pilot',
      'multi_cam': 'Multi-Cam',
      'cable_series': 'Cable Series',
      'pattern_budget': 'Pattern Budget',
      'amortization': 'Amortization',
      'unknown': 'Unknown'
    };
    return labels[type] || type;
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    // Show parsed preview as user types
    const debounce = setTimeout(() => {
      if (inputValue.trim().length > 10) {
        handleParsePreview();
      } else {
        setShowParsedPreview(false);
        setParsedParams(null);
      }
    }, 500);

    return () => clearTimeout(debounce);
  }, [inputValue]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <button
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-700 text-sm mb-2"
            >
              ← Back to Production
            </button>
            <h1 className="text-2xl font-bold text-gray-900">AI Budget Generator</h1>
            <p className="text-sm text-gray-600 mt-1">
              Describe your production in natural language
            </p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.type === 'system'
                    ? 'bg-gray-200 text-gray-700 italic'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </div>
                <div
                  className={`text-xs mt-2 ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}

          {isGenerating && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-gray-600">Generating budget...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          {/* Parsed Preview */}
          {showParsedPreview && parsedParams && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-xs font-semibold text-blue-900 mb-2">
                I'm detecting:
              </div>
              <div className="text-sm text-blue-800 space-y-1">
                {parsedParams.location && (
                  <div>📍 Location: {parsedParams.location}</div>
                )}
                {parsedParams.production_type && (
                  <div>🎬 Type: {getProductionTypeLabel(parsedParams.production_type)}</div>
                )}
                {parsedParams.budget && (
                  <div>💰 Budget: {formatCurrency(parsedParams.budget)}</div>
                )}
                {parsedParams.shoot_days && (
                  <div>📅 Shoot Days: {parsedParams.shoot_days}</div>
                )}
                {!parsedParams.location &&
                  !parsedParams.production_type &&
                  !parsedParams.budget &&
                  !parsedParams.shoot_days && (
                    <div className="text-blue-600 italic">
                      Keep typing to help me understand your production...
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isGenerating}
              placeholder="e.g., Atlanta one-hour pilot, 15 shoot days, $8M budget"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={isGenerating || !inputValue.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>
          </form>

          {/* Example Prompts */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-gray-500">Try:</span>
            {[
              'Atlanta pilot, $8M',
              'LA multi-cam, 20 days',
              'NYC cable series, $5M'
            ].map((example) => (
              <button
                key={example}
                onClick={() => setInputValue(example)}
                disabled={isGenerating}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
