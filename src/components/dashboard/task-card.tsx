'use client';

import { useState, useRef, useCallback, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2, ExternalLink, Calendar } from 'lucide-react';
import type { TaskWithCategory } from '@/lib/types/database';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '@/lib/types/database';
import { getDDay, formatDate } from '@/lib/utils';
import { updateTask } from '@/lib/actions/task-actions';
import Link from 'next/link';

interface TaskCardProps {
  task: TaskWithCategory;
  onEdit: (task: TaskWithCategory) => void;
  onDelete: (id: string) => void;
}

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const statusConfig = STATUS_CONFIG[task.status];
  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const [progress, setProgress] = useState(task.progress);
  const [, startTransition] = useTransition();
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleProgressChange = useCallback((value: number | readonly number[]) => {
    const newProgress = Array.isArray(value) ? value[0] : value;
    setProgress(newProgress);

    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      if (newProgress !== task.progress) {
        startTransition(async () => {
          await updateTask({ id: task.id, progress: newProgress });
        });
      }
    }, 500);
  }, [task.id, task.progress, startTransition]);

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="outline" className={priorityConfig.color}>
                {priorityConfig.label}
              </Badge>
              <Badge variant="outline" className={statusConfig.color}>
                {statusConfig.label}
              </Badge>
              {task.categories && (
                <Badge
                  variant="outline"
                  style={{ borderColor: task.categories.color, color: task.categories.color }}
                >
                  {task.categories.name}
                </Badge>
              )}
            </div>
            <Link href={`/tasks/${task.id}`} className="hover:underline">
              <h3 className="font-semibold text-base truncate">{task.title}</h3>
            </Link>
            {task.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(task)}>
                <Pencil className="mr-2 h-4 w-4" />
                수정
              </DropdownMenuItem>
              <Link href={`/tasks/${task.id}`}>
                <DropdownMenuItem>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  상세보기
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(task.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">진행률</span>
            <span className="text-sm font-bold">{progress}%</span>
          </div>
          <Slider
            value={[progress]}
            onValueChange={handleProgressChange}
            max={100}
            step={5}
          />
        </div>
        {(task.start_date || task.deployment_date) && (
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              {task.start_date && formatDate(task.start_date, 'M/d')}
              {task.start_date && task.deployment_date && ' → '}
              {task.deployment_date && (
                <>
                  {formatDate(task.deployment_date, 'M/d')} ({getDDay(task.deployment_date)})
                </>
              )}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
