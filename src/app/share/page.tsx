import { getTasks, getDashboardStats } from '@/lib/actions/task-actions';
import { getCategories } from '@/lib/actions/category-actions';
import { ShareView } from '@/components/share/share-view';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '업무 현황 공유 - Task Progress Tracker',
  description: '팀 업무 진행 상황을 확인하세요',
  openGraph: {
    title: '업무 현황 공유',
    description: '팀 업무 진행 상황을 확인하세요',
    type: 'website',
  },
};

export default async function SharePage() {
  const [tasks, stats, categories] = await Promise.all([
    getTasks(),
    getDashboardStats(),
    getCategories(),
  ]);

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ShareView tasks={tasks} stats={stats} categories={categories} />
      </div>
    </main>
  );
}
