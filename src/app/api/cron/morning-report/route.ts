import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { buildMorningReport } from '@/lib/slack';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app';

    // Fetch all users who have a Slack webhook configured
    const { data: userSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('user_id, slack_webhook_url')
      .not('slack_webhook_url', 'is', null);

    if (settingsError) throw settingsError;

    const results: { userId: string; sent: boolean }[] = [];

    for (const settings of userSettings ?? []) {
      if (!settings.slack_webhook_url) continue;

      // Fetch only this user's tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*, categories(*)')
        .eq('user_id', settings.user_id)
        .order('sort_order', { ascending: true });

      if (tasksError) {
        console.error(`Failed to fetch tasks for user ${settings.user_id}:`, tasksError);
        results.push({ userId: settings.user_id, sent: false });
        continue;
      }

      const payload = buildMorningReport({ tasks: tasks ?? [], appUrl });

      const response = await fetch(settings.slack_webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      results.push({ userId: settings.user_id, sent: response.ok });
    }

    return NextResponse.json({
      success: true,
      sent: results.filter((r) => r.sent).length,
      failed: results.filter((r) => !r.sent).length,
    });
  } catch (error) {
    console.error('Morning report error:', error);
    return NextResponse.json(
      { error: 'Failed to send morning report' },
      { status: 500 }
    );
  }
}
