import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface FeedbackRequest {
  session_id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { session_id }: FeedbackRequest = await req.json();

    const { data: session, error: sessionError } = await supabase
      .from('session')
      .select('scenario_id, scenario(title, objective)')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      throw new Error('Session not found');
    }

    const scenario = (session as any).scenario;

    const { data: messages } = await supabase
      .from('message')
      .select('role, content')
      .eq('session_id', session_id)
      .order('created_at');

    if (!messages || messages.length < 2) {
      throw new Error('Not enough conversation for feedback');
    }

    const userMessages = messages.filter((m: any) => m.role === 'user');
    const conversationText = messages
      .map((m: any) => `${m.role === 'user' ? 'User' : 'Coach'}: ${m.content}`)
      .join('\n\n');

    const feedbackPrompt = `You are an expert communication coach evaluating a practice conversation.

Scenario: ${scenario.title}
Objective: ${scenario.objective}

Conversation:
${conversationText}

Evaluate the user's communication during this conversation on these metrics (0-5 scale):
1. Clarity - Was the message structured, concise, and easy to follow?
2. Empathy - Did the user demonstrate understanding and emotional awareness?
3. Assertiveness - Did the user communicate confidently and maintain appropriate boundaries?

Provide your response in the following JSON format:
{
  "summary": "A brief 2-3 sentence overall assessment of the user's performance",
  "clarity": <number 0-5>,
  "empathy": <number 0-5>,
  "assertiveness": <number 0-5>,
  "recommendations": "Three specific, actionable recommendations for improvement, each on a new line starting with a bullet point"
}

Respond ONLY with valid JSON, no additional text.`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert communication coach providing constructive feedback.' },
          { role: 'user', content: feedbackPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    const feedbackText = openaiData.choices[0].message.content;

    const feedbackJson = JSON.parse(feedbackText);

    const scores = {
      clarity: feedbackJson.clarity,
      empathy: feedbackJson.empathy,
      assertiveness: feedbackJson.assertiveness,
    };

    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback')
      .insert({
        session_id,
        summary: feedbackJson.summary,
        scores,
        recommendations: feedbackJson.recommendations,
      })
      .select()
      .single();

    if (feedbackError) {
      throw feedbackError;
    }

    await supabase
      .from('session')
      .update({ status: 'completed', ended_at: new Date().toISOString() })
      .eq('id', session_id);

    return new Response(
      JSON.stringify(feedback),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Feedback error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});