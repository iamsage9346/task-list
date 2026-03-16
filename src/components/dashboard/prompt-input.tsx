'use client';

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { createTask } from '@/lib/actions/task-actions';
import type { Category, CreateTaskInput, TaskPriority, TaskStatus } from '@/lib/types/database';
import { toast } from 'sonner';

interface PromptInputProps {
  categories: Category[];
}

function parsePrompt(text: string, categories: Category[]): CreateTaskInput {
  let remaining = text.trim();
  let priority: TaskPriority = 'medium';
  let status: TaskStatus = 'not_started';
  let categoryId: string | null = null;
  let startDate: string | null = null;
  let deploymentDate: string | null = null;
  let progress = 0;
  let description: string | undefined;

  const today = new Date();
  const year = today.getFullYear();

  // 1) Extract progress: "25프로", "25%", "25퍼센트", "진행률 25"
  const progressMatch = remaining.match(/(현재\s*)?(\d{1,3})\s*(프로|%|퍼센트|퍼)/);
  if (progressMatch) {
    progress = Math.min(100, Math.max(0, parseInt(progressMatch[2])));
    remaining = remaining.replace(progressMatch[0], ' ');
  }

  // 2) Extract status keywords
  const statusMap: [RegExp, TaskStatus][] = [
    [/진행\s*중/, 'in_progress'],
    [/시작\s*전/, 'not_started'],
    [/차단|블로커/, 'blocked'],
    [/리뷰\s*중/, 'review'],
    [/완료/, 'completed'],
    [/배포\s*됨/, 'deployed'],
  ];
  for (const [regex, value] of statusMap) {
    if (regex.test(remaining)) {
      status = value;
      remaining = remaining.replace(regex, ' ');
      break;
    }
  }
  // If progress > 0 and status is still not_started, auto-set to in_progress
  if (progress > 0 && status === 'not_started') {
    status = 'in_progress';
  }

  // 3) Extract priority
  const priorityMap: [RegExp, TaskPriority][] = [
    [/긴급/, 'urgent'],
    [/높음/, 'high'],
    [/보통/, 'medium'],
    [/낮음/, 'low'],
  ];
  for (const [regex, value] of priorityMap) {
    if (regex.test(remaining)) {
      priority = value;
      remaining = remaining.replace(regex, ' ');
      break;
    }
  }

  // 4) Extract category
  for (const cat of categories) {
    const regex = new RegExp(cat.name, 'i');
    if (regex.test(remaining)) {
      categoryId = cat.id;
      remaining = remaining.replace(regex, ' ');
      break;
    }
  }

  // 5) Extract dates
  // "시작 M/D" or "시작일 M/D"
  const startMatch = remaining.match(/(시작일?)[:\s]*(\d{1,2})[\/\.\-월]\s*(\d{1,2})일?/);
  if (startMatch) {
    const m = startMatch[2].padStart(2, '0');
    const d = startMatch[3].padStart(2, '0');
    startDate = `${year}-${m}-${d}`;
    remaining = remaining.replace(startMatch[0], ' ');
  }

  // "배포 예정 M/D", "마감 M/D", "완료일 M/D", "끝 M/D", "배포 M/D"
  const endMatch = remaining.match(/(배포\s*예정|마감|완료일?|끝|종료|배포일?)[:\s]*(\d{1,2})[\/\.\-월]\s*(\d{1,2})일?/);
  if (endMatch) {
    const m = endMatch[2].padStart(2, '0');
    const d = endMatch[3].padStart(2, '0');
    deploymentDate = `${year}-${m}-${d}`;
    remaining = remaining.replace(endMatch[0], ' ');
  } else {
    // Standalone date at end or with ~
    const dateMatch = remaining.match(/[~\s]*(\d{1,2})[\/\.\-월]\s*(\d{1,2})일?\s*(배포|마감|까지)?\s*(예정)?\s*$/);
    if (dateMatch) {
      const m = dateMatch[1].padStart(2, '0');
      const d = dateMatch[2].padStart(2, '0');
      deploymentDate = `${year}-${m}-${d}`;
      remaining = remaining.replace(dateMatch[0], '');
    }
  }

  // 6) Split remaining into title and description
  // Strategy: first meaningful clause = title, rest = description
  // Split on comma, period, or explanatory connectors
  remaining = remaining.replace(/[,，]\s*/g, ', ').replace(/\s+/g, ' ').trim();
  remaining = remaining.replace(/^[,\s]+|[,\s]+$/g, '');

  const parts = remaining.split(/[,，]/).map((s) => s.trim()).filter(Boolean);

  let title = '';
  const descParts: string[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (i === 0) {
      title = part;
    } else {
      // Check if this is descriptive content (longer phrase, contains explanatory words)
      descParts.push(part);
    }
  }

  if (descParts.length > 0) {
    description = descParts.join(', ');
  }

  // Final cleanup
  title = title.replace(/^[,\s]+|[,\s]+$/g, '').trim();
  if (!title) title = text.trim().slice(0, 50);

  return {
    title,
    description,
    priority,
    status,
    progress,
    category_id: categoryId,
    start_date: startDate,
    deployment_date: deploymentDate,
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
          placeholder="예: 네이버 광고 자동화, 파이썬으로 개발, 백엔드, 긴급, 50프로 진행 중, 3/23 배포"
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
