'use client';

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sparkles, Loader2, Bot, Type, Check, X } from 'lucide-react';
import { createTask, createTasks } from '@/lib/actions/task-actions';
import type { Category, CreateTaskInput, TaskPriority, TaskStatus } from '@/lib/types/database';
import { PRIORITY_CONFIG } from '@/lib/types/database';
import { toast } from 'sonner';

interface PromptInputProps {
  categories: Category[];
}

interface GeneratedTask {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  progress: number;
  category_name: string | null;
  selected: boolean;
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

  const progressMatch = remaining.match(/(현재\s*)?(\d{1,3})\s*(프로|%|퍼센트|퍼)/);
  if (progressMatch) {
    progress = Math.min(100, Math.max(0, parseInt(progressMatch[2])));
    remaining = remaining.replace(progressMatch[0], ' ');
  }

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
  if (progress > 0 && status === 'not_started') {
    status = 'in_progress';
  }

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

  for (const cat of categories) {
    const regex = new RegExp(cat.name, 'i');
    if (regex.test(remaining)) {
      categoryId = cat.id;
      remaining = remaining.replace(regex, ' ');
      break;
    }
  }

  const startMatch = remaining.match(/(시작일?)[:\s]*(\d{1,2})[\/\.\-월]\s*(\d{1,2})일?/);
  if (startMatch) {
    const m = startMatch[2].padStart(2, '0');
    const d = startMatch[3].padStart(2, '0');
    startDate = `${year}-${m}-${d}`;
    remaining = remaining.replace(startMatch[0], ' ');
  }

  const endMatch = remaining.match(/(배포\s*예정|마감|완료일?|끝|종료|배포일?)[:\s]*(\d{1,2})[\/\.\-월]\s*(\d{1,2})일?/);
  if (endMatch) {
    const m = endMatch[2].padStart(2, '0');
    const d = endMatch[3].padStart(2, '0');
    deploymentDate = `${year}-${m}-${d}`;
    remaining = remaining.replace(endMatch[0], ' ');
  } else {
    const dateMatch = remaining.match(/[~\s]*(\d{1,2})[\/\.\-월]\s*(\d{1,2})일?\s*(배포|마감|까지)?\s*(예정)?\s*$/);
    if (dateMatch) {
      const m = dateMatch[1].padStart(2, '0');
      const d = dateMatch[2].padStart(2, '0');
      deploymentDate = `${year}-${m}-${d}`;
      remaining = remaining.replace(dateMatch[0], '');
    }
  }

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
      descParts.push(part);
    }
  }

  if (descParts.length > 0) {
    description = descParts.join(', ');
  }

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
  const [aiMode, setAiMode] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleManualSubmit = () => {
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

  const handleAIGenerate = async () => {
    if (!value.trim()) return;
    setAiLoading(true);

    try {
      const res = await fetch('/api/ai/generate-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: value, categories }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'AI 생성에 실패했습니다.');
        return;
      }

      setGeneratedTasks(
        data.tasks.map((t: Omit<GeneratedTask, 'selected'>) => ({ ...t, selected: true }))
      );
      setShowPreview(true);
    } catch {
      toast.error('AI 서버에 연결할 수 없습니다.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    if (aiMode) {
      handleAIGenerate();
    } else {
      handleManualSubmit();
    }
  };

  const toggleTask = (index: number) => {
    setGeneratedTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, selected: !t.selected } : t))
    );
  };

  const selectedCount = generatedTasks.filter((t) => t.selected).length;

  const handleCreateAll = () => {
    const selected = generatedTasks.filter((t) => t.selected);
    if (selected.length === 0) return;

    const inputs: CreateTaskInput[] = selected.map((t) => {
      const matchedCategory = categories.find(
        (c) => c.name.toLowerCase() === t.category_name?.toLowerCase()
      );
      return {
        title: t.title,
        description: t.description,
        priority: t.priority,
        status: t.status,
        progress: t.progress,
        category_id: matchedCategory?.id ?? null,
      };
    });

    startTransition(async () => {
      try {
        await createTasks(inputs);
        toast.success(`${selected.length}개의 태스크가 생성되었습니다.`);
        setShowPreview(false);
        setGeneratedTasks([]);
        setValue('');
      } catch {
        toast.error('태스크 생성에 실패했습니다.');
      }
    });
  };

  const loading = isPending || aiLoading;

  return (
    <>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Button
          type="button"
          variant={aiMode ? 'default' : 'outline'}
          size="icon"
          className="shrink-0"
          title={aiMode ? 'AI 모드 (클릭하면 수동 모드)' : '수동 모드 (클릭하면 AI 모드)'}
          onClick={() => setAiMode(!aiMode)}
        >
          {aiMode ? <Bot className="h-4 w-4" /> : <Type className="h-4 w-4" />}
        </Button>
        <div className="relative flex-1">
          <Sparkles className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${aiMode ? 'text-purple-500' : 'text-muted-foreground'}`} />
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={
              aiMode
                ? '예: 쇼핑몰 결제 시스템 리뉴얼, React 대시보드 만들기'
                : '예: 네이버 광고 자동화, 백엔드, 긴급, 50프로 진행 중, 3/23 배포'
            }
            className="pl-10"
            disabled={loading}
          />
        </div>
        <Button type="submit" disabled={loading || !value.trim()} className="gap-2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : aiMode ? (
            <>
              <Sparkles className="h-4 w-4" />
              AI 생성
            </>
          ) : (
            '추가'
          )}
        </Button>
      </form>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              AI가 생성한 태스크
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {generatedTasks.length}개 생성됨 · {selectedCount}개 선택됨
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setGeneratedTasks((prev) => {
                    const allSelected = prev.every((t) => t.selected);
                    return prev.map((t) => ({ ...t, selected: !allSelected }));
                  })
                }
              >
                {generatedTasks.every((t) => t.selected) ? '전체 해제' : '전체 선택'}
              </Button>
            </div>

            <div className="space-y-2">
              {generatedTasks.map((task, index) => (
                <Card
                  key={index}
                  className={`cursor-pointer transition-all ${
                    task.selected ? 'ring-2 ring-primary' : 'opacity-50'
                  }`}
                  onClick={() => toggleTask(index)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                          task.selected
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-muted-foreground/30'
                        }`}
                      >
                        {task.selected && <Check className="h-3 w-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {task.description}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={PRIORITY_CONFIG[task.priority]?.color}
                          >
                            {PRIORITY_CONFIG[task.priority]?.label}
                          </Badge>
                          {task.category_name && (
                            <Badge variant="outline">{task.category_name}</Badge>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setGeneratedTasks((prev) => prev.filter((_, i) => i !== index));
                        }}
                        className="text-muted-foreground hover:text-foreground shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button
              onClick={handleCreateAll}
              disabled={isPending || selectedCount === 0}
              className="w-full gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {selectedCount}개 태스크 추가하기
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
