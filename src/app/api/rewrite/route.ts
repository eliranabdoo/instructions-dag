import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  try {
    const { instructions, code, apiKey, baseUrl, model } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 400 });
    }

    const client = new OpenAI({
      apiKey,
      baseURL: baseUrl || undefined,
    });

    const response = await client.chat.completions.create({
      model: model || 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a JavaScript code assistant. Generate or rewrite JavaScript code based on user instructions.

Rules:
- Return ONLY the JavaScript code, no markdown fences, no explanation
- Code runs inside an async function with two arguments available:
  - \`inputs\` — object keyed by parent node title containing their outputs
  - \`console\` — standard console (log/warn/error)
- Use \`return value\` to set this node's output, or use console.log()
- Keep code concise and readable`,
        },
        {
          role: 'user',
          content: `Instructions: ${instructions}${code?.trim() ? `\n\nExisting code:\n${code}` : ''}`,
        },
      ],
    });

    const newCode = response.choices[0]?.message?.content?.trim() ?? '';
    return NextResponse.json({ code: newCode });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
