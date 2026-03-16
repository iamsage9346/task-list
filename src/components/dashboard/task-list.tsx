'use client';

import { useState, useTransition } from 'react';
import { TaskCard } from './task-card';
import { TaskForm } from './task-form';
import { CategoryFilter } from './category-filter';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { createTask, updateTask, deleteTask, deleteAllTasks } from '@/lib/actions/task-actions';
import type {
  TaskWithCategory,
  Category,
  TaskStatus,
  CreateTaskInput,
  UpdateTaskInput,
} from '@/lib/types/database';
import { STATUS_CONFIG } from '@/lib/types/database';
import { toast } from 'sonner';

interface TaskListProps {
  initialTasks: TaskWithCategory[];
  categories: Category[];
}

const STATUS_ORDER: TaskStatus[] = [
  'in_progress',
  'not_started',
  'review',
  'completed',
  'deployed',
];

export function TaskList({ initialTasks, categories }: TaskListProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithCategory | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set(['completed', 'deployed']));
  const [, startTransition] = useTransition();

  const COLLAPSIBLE_STATUSES = new Set(['completed', 'deployed']);

  const toggleSection = (status: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  const filteredTasks = selectedCategory
    ? initialTasks.filter((t) => t.category_id === selectedCategory)
    : initialTasks;

  const tasksByStatus = STATUS_ORDER.map((status) => ({
    status,
    config: STATUS_CONFIG[status],
    tasks: filteredTasks.filter((t) => t.status === status),
  })).filter((group) => group.tasks.length > 0);

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

  const handleDeleteAll = () => {
    if (!confirm('모든 태스크를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    startTransition(async () => {
      try {
        await deleteAllTasks();
        toast.success('모든 태스크가 삭제되었습니다.');
      } catch {
        toast.error('전체 삭제에 실패했습니다.');
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
        <div className="flex gap-2">
          {initialTasks.length > 0 && (
            <Button variant="outline" size="sm" className="text-destructive" onClick={handleDeleteAll}>
              <Trash2 className="mr-2 h-4 w-4" />
              전체 삭제
            </Button>
          )}
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            새 태스크
          </Button>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">태스크가 없습니다</p>
          <p className="text-sm mt-1">새 태스크를 추가해보세요</p>
        </div>
      ) : (
        <div className="space-y-6">
          {tasksByStatus.map(({ status, config, tasks }) => {
            const isCollapsible = COLLAPSIBLE_STATUSES.has(status);
            const isCollapsed = collapsedSections.has(status);

            return (
              <div key={status}>
                <div
                  className={`flex items-center gap-2 mb-3 ${isCollapsible ? 'cursor-pointer select-none' : ''}`}
                  onClick={() => isCollapsible && toggleSection(status)}
                >
                  {isCollapsible && (
                    isCollapsed
                      ? <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${config.color}`}>
                    {config.label}
                  </span>
                  <span className="text-sm text-muted-foreground">{tasks.length}개</span>
                </div>
                {!isCollapsed && (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {tasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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
