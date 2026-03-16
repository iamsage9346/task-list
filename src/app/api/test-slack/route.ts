import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { buildMorningReport, sendSlackMessage } from '@/lib/slack';

export async function POST() {
  try {
    const supabase = createAdminClient();

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*, categories(*)')
      .order('sort_order', { ascending: true });

    if (error) throw error;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app';

    const payload = buildMorningReport({
      tasks: tasks ?? [],
      appUrl,
    });

    const sent = await sendSlackMessage(payload);

    if (!sent) {
      return NextResponse.json({ error: 'Slack 전송 실패. SLACK_WEBHOOK_URL을 확인해주세요.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, tasksCount: tasks?.length ?? 0 });
  } catch (error) {
    console.error('Test slack error:', error);
    return NextResponse.json({ error: 'Slack 테스트 실패' }, { status: 500 });
  }
}
