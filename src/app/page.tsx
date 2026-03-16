import { getTasks, getDashboardStats } from '@/lib/actions/task-actions';
import { getCategories } from '@/lib/actions/category-actions';
import { StatsHeader } from '@/components/dashboard/stats-header';
import { TaskList } from '@/components/dashboard/task-list';
import { ProjectOverview } from '@/components/dashboard/project-overview';
import { CalendarView } from '@/components/dashboard/calendar-view';
import { PromptInput } from '@/components/dashboard/prompt-input';
import { Separator } from '@/components/ui/separator';
import { SlackTestButton } from '@/components/dashboard/slack-test-button';
import { UserMenu } from '@/components/dashboard/user-menu';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [tasks, stats, categories, supabase] = await Promise.all([
    getTasks(),
    getDashboardStats(),
    getCategories(),
    createClient(),
  ]);

  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">업무 현황 대시보드</h1>
            <p className="text-muted-foreground text-sm mt-1">
              태스크별 진행 상황을 한눈에 확인하세요
            </p>
          </div>
          <div className="flex gap-2">
            <SlackTestButton />
            <Link href="/share">
              <Button variant="outline" size="sm">
                <Share2 className="mr-2 h-4 w-4" />
                공유 페이지
              </Button>
            </Link>
            {user && <UserMenu email={user.email ?? ''} />}
          </div>
        </div>

        <CalendarView tasks={tasks} />

        <div className="mt-6">
          <PromptInput categories={categories} />
        </div>

        <div className="mt-6">
          <StatsHeader stats={stats} />
        </div>

        <Separator className="my-6" />

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <TaskList initialTasks={tasks} categories={categories} />
          <div className="space-y-4">
            <ProjectOverview upcomingDeployments={stats.upcomingDeployments} />
          </div>
        </div>
      </div>
    </main>
  );
}
