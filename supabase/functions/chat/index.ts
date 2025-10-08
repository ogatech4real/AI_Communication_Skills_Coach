import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ChatRequest {
  session_id: string;
  user_message: string;
  is_initial?: boolean;
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
    const { session_id, user_message, is_initial }: ChatRequest = await req.json();

    const { data: session, error: sessionError } = await supabase
      .from('session')
      .select('scenario_id, scenario(title, objective, ai_persona)')
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

    const conversationHistory = messages || [];

    let systemPrompt = `You are a professional communication coach simulating a real-world ${scenario.title} scenario.
Your role: ${scenario.ai_persona}

Objective: ${scenario.objective}

Your goal is to help the user practice effective conversation and improve their communication skills.
Keep responses concise (2-3 sentences), natural, and human-like.
Stay in character and create a realistic, challenging but supportive practice environment.
${is_initial ? 'Start the conversation by introducing yourself and the scenario context.' : 'Respond as your character would in this situation.'}`;

    const openaiMessages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      })),
    ];

    if (!is_initial && user_message) {
      openaiMessages.push({ role: 'user', content: user_message });
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openaiMessages,
        temperature: 0.8,
        max_tokens: 200,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    const aiMessage = openaiData.choices[0].message.content;

    return new Response(
      JSON.stringify({ message: aiMessage }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Chat error:', error);
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