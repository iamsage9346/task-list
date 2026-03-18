import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { buildMorningReport } from '@/lib/slack';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // Get user's slack webhook
    const { data: settings } = await supabase
      .from('user_settings')
      .select('slack_webhook_url')
      .eq('user_id', user.id)
      .single();

    const webhookUrl = settings?.slack_webhook_url || process.env.SLACK_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json({ error: 'Slack Webhook URL이 설정되지 않았습니다. 설정 페이지에서 입력해주세요.' }, { status: 400 });
    }

    // Fetch only the current user's tasks
    const adminSupabase = createAdminClient();
    const { data: tasks, error } = await adminSupabase
      .from('tasks')
      .select('*, categories(*)')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app';
    const payload = buildMorningReport({ tasks: tasks ?? [], appUrl });

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Slack 전송 실패. Webhook URL을 확인해주세요.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Test slack error:', error);
    return NextResponse.json({ error: 'Slack 테스트 실패' }, { status: 500 });
  }
}
