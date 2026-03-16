'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Bot, Loader2, X, Check, Sparkles } from 'lucide-react';
import { createTasks } from '@/lib/actions/task-actions';
import type { Category, CreateTaskInput } from '@/lib/types/database';
import { PRIORITY_CONFIG } from '@/lib/types/database';
import { toast } from 'sonner';

interface GeneratedTask {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'not_started' | 'in_progress';
  progress: number;
  category_name: string | null;
  selected: boolean;
}

interface AITaskGeneratorProps {
  categories: Category[];
}

export function AITaskGenerator({ categories }: AITaskGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [tasks, setTasks] = useState<GeneratedTask[]>([]);
  const [generating, setGenerating] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setTasks([]);

    try {
      const res = await fetch('/api/ai/generate-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, categories }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'AI 생성에 실패했습니다.');
        return;
      }

      setTasks(
        data.tasks.map((t: Omit<GeneratedTask, 'selected'>) => ({ ...t, selected: true }))
      );
    } catch {
      toast.error('AI 서버에 연결할 수 없습니다.');
    } finally {
      setGenerating(false);
    }
  };

  const toggleTask = (index: number) => {
    setTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, selected: !t.selected } : t))
    );
  };

  const selectedCount = tasks.filter((t) => t.selected).length;

  const handleCreate = () => {
    const selected = tasks.filter((t) => t.selected);
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
        setOpen(false);
        setTasks([]);
        setPrompt('');
      } catch {
        toast.error('태스크 생성에 실패했습니다.');
      }
    });
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Bot className="h-4 w-4" />
        AI 태스크 생성
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              AI 태스크 생성
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="예: 쇼핑몰 결제 시스템 리뉴얼 프로젝트&#10;예: React로 관리자 대시보드 만들기&#10;예: AWS에서 쿠버네티스 클러스터 구축"
                rows={3}
                disabled={generating}
              />
              <Button
                onClick={handleGenerate}
                disabled={generating || !prompt.trim()}
                className="w-full gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    AI가 태스크를 생성하고 있습니다...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    태스크 생성하기
                  </>
                )}
              </Button>
            </div>

            {tasks.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {tasks.length}개 태스크 생성됨 · {selectedCount}개 선택됨
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setTasks((prev) => {
                        const allSelected = prev.every((t) => t.selected);
                        return prev.map((t) => ({ ...t, selected: !allSelected }));
                      })
                    }
                  >
                    {tasks.every((t) => t.selected) ? '전체 해제' : '전체 선택'}
                  </Button>
                </div>

                <div className="space-y-2">
                  {tasks.map((task, index) => (
                    <Card
                      key={index}
                      className={`cursor-pointer transition-all ${
                        task.selected
                          ? 'ring-2 ring-primary'
                          : 'opacity-50'
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
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="font-medium text-sm">{task.title}</h4>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
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
                                <Badge variant="outline">
                                  {task.category_name}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTasks((prev) => prev.filter((_, i) => i !== index));
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
                  onClick={handleCreate}
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
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
