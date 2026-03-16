'use client';

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { createTask } from '@/lib/actions/task-actions';
import type { Category, CreateTaskInput, TaskPriority } from '@/lib/types/database';
import { toast } from 'sonner';

interface PromptInputProps {
  categories: Category[];
}

function parsePrompt(text: string, categories: Category[]): CreateTaskInput {
  let title = text.trim();
  let priority: TaskPriority = 'medium';
  let categoryId: string | null = null;
  let startDate: string | null = null;
  let deploymentDate: string | null = null;

  // Extract priority
  const priorityMap: Record<string, TaskPriority> = {
    '긴급': 'urgent', 'urgent': 'urgent',
    '높음': 'high', 'high': 'high',
    '보통': 'medium', 'medium': 'medium',
    '낮음': 'low', 'low': 'low',
  };
  for (const [keyword, value] of Object.entries(priorityMap)) {
    const regex = new RegExp(`[,\\s]*${keyword}[,\\s]*`, 'i');
    if (regex.test(title)) {
      priority = value;
      title = title.replace(regex, ' ').trim();
      break;
    }
  }

  // Extract category
  for (const cat of categories) {
    const regex = new RegExp(`[,\\s]*${cat.name}[,\\s]*`, 'i');
    if (regex.test(title)) {
      categoryId = cat.id;
      title = title.replace(regex, ' ').trim();
      break;
    }
  }

  // Extract dates (M/D or M월D일 patterns)
  const today = new Date();
  const year = today.getFullYear();

  // "시작 M/D" or "시작: M/D"
  const startMatch = title.match(/시작[:\s]*(\d{1,2})[\/\.\-월](\d{1,2})일?/);
  if (startMatch) {
    const m = startMatch[1].padStart(2, '0');
    const d = startMatch[2].padStart(2, '0');
    startDate = `${year}-${m}-${d}`;
    title = title.replace(startMatch[0], ' ').trim();
  }

  // "마감 M/D" or "배포 M/D" or "끝 M/D" or just "M/D" at end
  const endMatch = title.match(/(마감|배포|끝|종료)[:\s]*(\d{1,2})[\/\.\-월](\d{1,2})일?/);
  if (endMatch) {
    const m = endMatch[2].padStart(2, '0');
    const d = endMatch[3].padStart(2, '0');
    deploymentDate = `${year}-${m}-${d}`;
    title = title.replace(endMatch[0], ' ').trim();
  } else {
    // Standalone date at end: "~ M/D" or "M/D"
    const dateMatch = title.match(/[~\s]*(\d{1,2})[\/\.\-월](\d{1,2})일?\s*$/);
    if (dateMatch) {
      const m = dateMatch[1].padStart(2, '0');
      const d = dateMatch[2].padStart(2, '0');
      deploymentDate = `${year}-${m}-${d}`;
      title = title.replace(dateMatch[0], '').trim();
    }
  }

  // Clean up remaining commas and extra spaces
  title = title.replace(/^[,\s]+|[,\s]+$/g, '').replace(/\s+/g, ' ');

  return {
    title,
    priority,
    category_id: categoryId,
    start_date: startDate,
    deployment_date: deploymentDate,
    status: 'not_started',
    progress: 0,
  };
}

export function PromptInput({ categories }: PromptInputProps) {
  const [value, setValue] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    const parsed = parsePrompt(value, categories);

    startTransition(async () => {
      try {
        await createTask(parsed);
        setValue('');
        toast.success(`"${parsed.title}" 태스크가 생성되었습니다.`);
      } catch {
        toast.error('태스크 생성에 실패했습니다.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="태스크를 입력하세요 (예: 로그인 UI 구현, 프론트엔드, 긴급, 배포 3/20)"
          className="pl-10"
          disabled={isPending}
        />
      </div>
      <Button type="submit" disabled={isPending || !value.trim()}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : '추가'}
      </Button>
    </form>
  );
}
