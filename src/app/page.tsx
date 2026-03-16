import { getTasks, getDashboardStats } from '@/lib/actions/task-actions';
import { getCategories } from '@/lib/actions/category-actions';
import { StatsHeader } from '@/components/dashboard/stats-header';
import { TaskList } from '@/components/dashboard/task-list';
import { ProjectOverview } from '@/components/dashboard/project-overview';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [tasks, stats, categories] = await Promise.all([
    getTasks(),
    getDashboardStats(),
    getCategories(),
  ]);

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
          <Link href="/share">
            <Button variant="outline" size="sm">
              <Share2 className="mr-2 h-4 w-4" />
              공유 페이지
            </Button>
          </Link>
        </div>

        <StatsHeader stats={stats} />

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
