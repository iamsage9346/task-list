import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { buildMorningReport, sendSlackMessage } from '@/lib/slack';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    // Fetch all tasks (including completed for stats)
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*, categories(*)')
      .order('sort_order', { ascending: true });

    if (tasksError) throw tasksError;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app';

    const payload = buildMorningReport({
      tasks: tasks ?? [],
      appUrl,
    });

    const sent = await sendSlackMessage(payload);

    return NextResponse.json({
      success: sent,
      tasksCount: tasks?.length ?? 0,
    });
  } catch (error) {
    console.error('Morning report error:', error);
    return NextResponse.json(
      { error: 'Failed to send morning report' },
      { status: 500 }
    );
  }
}
