import { getTask } from '@/lib/actions/task-actions';
import { getCategories } from '@/lib/actions/category-actions';
import { TaskDetail } from '@/components/task-detail/task-detail';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TaskDetailPage({ params }: Props) {
  const { id } = await params;

  try {
    const [task, categories] = await Promise.all([
      getTask(id),
      getCategories(),
    ]);

    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <TaskDetail task={task} categories={categories} />
        </div>
      </main>
    );
  } catch {
    notFound();
  }
}
