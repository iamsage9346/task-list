'use client';

import { useState, useTransition } from 'react';
import { TaskCard } from './task-card';
import { TaskForm } from './task-form';
import { CategoryFilter } from './category-filter';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { createTask, updateTask, deleteTask } from '@/lib/actions/task-actions';
import type {
  TaskWithCategory,
  Category,
  CreateTaskInput,
  UpdateTaskInput,
} from '@/lib/types/database';
import { toast } from 'sonner';

interface TaskListProps {
  initialTasks: TaskWithCategory[];
  categories: Category[];
}

export function TaskList({ initialTasks, categories }: TaskListProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithCategory | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filteredTasks = selectedCategory
    ? initialTasks.filter((t) => t.category_id === selectedCategory)
    : initialTasks;

  const handleCreate = () => {
    setEditingTask(null);
    setFormOpen(true);
  };

  const handleEdit = (task: TaskWithCategory) => {
    setEditingTask(task);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    startTransition(async () => {
      try {
        await deleteTask(id);
        toast.success('태스크가 삭제되었습니다.');
      } catch {
        toast.error('삭제에 실패했습니다.');
      }
    });
  };

  const handleSubmit = async (data: CreateTaskInput | UpdateTaskInput) => {
    try {
      if ('id' in data) {
        await updateTask(data as UpdateTaskInput);
        toast.success('태스크가 수정되었습니다.');
      } else {
        await createTask(data as CreateTaskInput);
        toast.success('태스크가 생성되었습니다.');
      }
    } catch {
      toast.error('저장에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelect={setSelectedCategory}
        />
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          새 태스크
        </Button>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">태스크가 없습니다</p>
          <p className="text-sm mt-1">새 태스크를 추가해보세요</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <TaskForm
        open={formOpen}
        onOpenChange={setFormOpen}
        task={editingTask}
        categories={categories}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
