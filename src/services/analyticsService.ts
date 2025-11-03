interface CallAnalysis {
  isQuoteProvided: boolean;
  quoteAmount: number | null;
  wasConverted: boolean;
  callDuration: number;
  objectionHandlingScore: number;
  keyInsights: string[];
}

interface AgentMetrics {
  closeRate: number;
  avgCallDuration: number;
  totalQuotes: number;
  avgQuoteSize: number;
  conversionEfficiency: number;
  objectionHandlingScore: number;
}

export interface AgentAnalytics {
  callsReviewed: number;
  isBestPerformer: boolean;
  metrics: AgentMetrics;
  performanceTier: 'elite' | 'strong' | 'average' | 'needs_improvement';
  keyInsights: string[];
}

export async function analyzeCallTranscript(transcript: string, apiKey: string): Promise<CallAnalysis> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing sales call transcripts. Extract key metrics from the conversation.',
          },
          {
            role: 'user',
            content: `Analyze this call transcript and provide a JSON response with the following structure:
{
  "isQuoteProvided": boolean,
  "quoteAmount": number or null (extract any dollar amount mentioned as a quote),
  "wasConverted": boolean (did the customer agree to the service or book an appointment),
  "objectionHandlingScore": number from 1-10 (how well objections were handled),
  "keyInsights": array of 2-3 brief insights about the call quality
}

Transcript: ${transcript}`,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);

    return {
      ...analysis,
      callDuration: 0,
    };
  } catch (error) {
    console.error('Error analyzing transcript:', error);
    return {
      isQuoteProvided: false,
      quoteAmount: null,
      wasConverted: false,
      callDuration: 0,
      objectionHandlingScore: 5,
      keyInsights: ['Unable to analyze call'],
    };
  }
}

export function calculateAgentMetrics(analyses: CallAnalysis[]): AgentMetrics {
  if (analyses.length === 0) {
    return {
      closeRate: 0,
      avgCallDuration: 0,
      totalQuotes: 0,
      avgQuoteSize: 0,
      conversionEfficiency: 0,
      objectionHandlingScore: 0,
    };
  }

  const totalConversions = analyses.filter(a => a.wasConverted).length;
  const closeRate = (totalConversions / analyses.length) * 100;

  const quotesProvided = analyses.filter(a => a.isQuoteProvided && a.quoteAmount);
  const totalQuotes = quotesProvided.length;
  const avgQuoteSize = totalQuotes > 0
    ? quotesProvided.reduce((sum, a) => sum + (a.quoteAmount || 0), 0) / totalQuotes
    : 0;

  const avgCallDuration = analyses.reduce((sum, a) => sum + a.callDuration, 0) / analyses.length;
  const avgObjectionHandling = analyses.reduce((sum, a) => sum + a.objectionHandlingScore, 0) / analyses.length;

  const conversionEfficiency = totalQuotes > 0 ? (totalConversions / totalQuotes) * 100 : 0;

  return {
    closeRate,
    avgCallDuration,
    totalQuotes,
    avgQuoteSize,
    conversionEfficiency,
    objectionHandlingScore: avgObjectionHandling,
  };
}

export function determinePerformanceTier(
  metrics: AgentMetrics,
  avgQuoteSize: number
): 'elite' | 'strong' | 'average' | 'needs_improvement' {
  if (metrics.closeRate >= 70 && metrics.avgQuoteSize >= avgQuoteSize) {
    return 'elite';
  } else if (metrics.closeRate >= 50 || metrics.avgQuoteSize >= avgQuoteSize * 1.1) {
    return 'strong';
  } else if (metrics.closeRate >= 30 && metrics.avgQuoteSize >= avgQuoteSize * 0.8) {
    return 'average';
  } else {
    return 'needs_improvement';
  }
}

export function aggregateKeyInsights(analyses: CallAnalysis[]): string[] {
  const allInsights = analyses.flatMap(a => a.keyInsights);
  const insightCounts = new Map<string, number>();

  allInsights.forEach(insight => {
    insightCounts.set(insight, (insightCounts.get(insight) || 0) + 1);
  });

  return Array.from(insightCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([insight]) => insight);
}

export interface CallEvaluation {
  call_quality_score: number;
  sale_outcome: 'closed' | 'pending' | 'lost' | 'other';
  key_metrics: {
    call_duration_score: number;
    conversation_flow_score: number;
    objection_handling_score: number;
    rapport_building_score: number;
  };
  sale_amount: number | null;
  strengths: string[];
  improvements: string[];
  system_prompt_suggestion: string | null;
}

export async function evaluateCall(
  transcript: string,
  systemPrompt: string,
  callDuration: number,
  apiKey: string
): Promise<CallEvaluation> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert sales call evaluator. Analyze the provided call transcript and return a structured evaluation.

INPUT:
Transcript: The full conversation between AI agent and customer
System Prompt: The AI agent's current instructions
Call Duration: Length of the call in seconds

OUTPUT: Return ONLY a valid JSON object with this structure:
{
  "call_quality_score": number, // 0.0-1.0 overall score
  "sale_outcome": "closed" | "pending" | "lost" | "other",
  "key_metrics": {
    "call_duration_score": number, // 0.0-1.0 based on efficiency
    "conversation_flow_score": number, // 0.0-1.0 based on natural dialogue
    "objection_handling_score": number, // 0.0-1.0 based on handling resistance
    "rapport_building_score": number // 0.0-1.0 based on customer connection
  },
  "sale_amount": number | null, // extracted quote amount if mentioned
  "strengths": ["brief point 1", "brief point 2"],
  "improvements": ["brief point 1", "brief point 2"],
  "system_prompt_suggestion": "string or null" // only if score < 0.6, provide improved system prompt
}

SCORING GUIDELINES:
0.8-1.0: Excellent performance
0.6-0.8: Good performance
0.4-0.6: Average performance
0.0-0.4: Poor performance

Only suggest system prompt improvements for calls scoring below 0.6. Keep suggestions concise and actionable.`,
          },
          {
            role: 'user',
            content: `Evaluate this sales call:

Transcript:
${transcript}

System Prompt:
${systemPrompt}

Call Duration: ${callDuration} seconds`,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error('Error evaluating call:', error);
    return {
      call_quality_score: 0,
      sale_outcome: 'other',
      key_metrics: {
        call_duration_score: 0,
        conversation_flow_score: 0,
        objection_handling_score: 0,
        rapport_building_score: 0,
      },
      sale_amount: null,
      strengths: ['Unable to evaluate call'],
      improvements: ['Evaluation failed'],
      system_prompt_suggestion: null,
    };
  }
}
