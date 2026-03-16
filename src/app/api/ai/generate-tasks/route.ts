import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface GeneratedTask {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'not_started' | 'in_progress';
  progress: number;
  category_name: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, categories } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: '프롬프트를 입력해주세요.' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
    }

    const categoryNames = (categories as { name: string }[])?.map((c) => c.name) ?? [];

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `당신은 프로젝트 매니저입니다. 사용자의 요청을 분석하여 실행 가능한 태스크 목록을 JSON으로 생성해주세요.

사용 가능한 카테고리: ${categoryNames.length > 0 ? categoryNames.join(', ') : '프론트엔드, 백엔드, 인프라, 디자인, 기타'}

규칙:
- 각 태스크는 구체적이고 실행 가능해야 합니다
- priority: "low" | "medium" | "high" | "urgent"
- status: "not_started"
- progress: 0
- category_name: 위 카테고리 중 가장 적합한 것 (없으면 null)
- 3~8개 정도의 태스크를 생성하세요
- 반드시 JSON 배열만 응답하세요. 다른 텍스트 없이 순수 JSON만 반환하세요.

형식:
[{"title":"..","description":"..","priority":"..","status":"not_started","progress":0,"category_name":".."}]

사용자 요청: ${prompt}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'AI 응답을 처리할 수 없습니다.' }, { status: 500 });
    }

    // Extract JSON from the response (handle potential markdown code blocks)
    let jsonText = content.text.trim();
    const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
    }

    const tasks: GeneratedTask[] = JSON.parse(jsonText);

    if (!Array.isArray(tasks)) {
      return NextResponse.json({ error: 'AI가 올바른 형식으로 응답하지 않았습니다.' }, { status: 500 });
    }

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('AI task generation error:', error);
    return NextResponse.json(
      { error: 'AI 태스크 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
