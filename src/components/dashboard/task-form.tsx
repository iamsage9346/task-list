'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  TaskWithCategory,
  Category,
  TaskStatus,
  TaskPriority,
  CreateTaskInput,
  UpdateTaskInput,
} from '@/lib/types/database';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '@/lib/types/database';

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: TaskWithCategory | null;
  categories: Category[];
  onSubmit: (data: CreateTaskInput | UpdateTaskInput) => Promise<void>;
}

export function TaskForm({ open, onOpenChange, task, categories, onSubmit }: TaskFormProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<TaskStatus>('not_started');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [categoryId, setCategoryId] = useState<string>('none');
  const [deploymentDate, setDeploymentDate] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? '');
      setProgress(task.progress);
      setStatus(task.status);
      setPriority(task.priority);
      setCategoryId(task.category_id ?? 'none');
      setDeploymentDate(task.deployment_date ?? '');
    } else {
      setTitle('');
      setDescription('');
      setProgress(0);
      setStatus('not_started');
      setPriority('medium');
      setCategoryId('none');
      setDeploymentDate('');
    }
  }, [task, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...(task ? { id: task.id } : {}),
        title,
        description: description || undefined,
        progress,
        status,
        priority,
        category_id: categoryId === 'none' ? null : categoryId,
        deployment_date: deploymentDate || null,
      };
      await onSubmit(data as CreateTaskInput | UpdateTaskInput);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? '태스크 수정' : '새 태스크'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="태스크 제목"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="태스크에 대한 설명"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>상태</Label>
              <Select value={status} onValueChange={(v: string | null) => { if (v) setStatus(v as TaskStatus); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>우선순위</Label>
              <Select value={priority} onValueChange={(v: string | null) => { if (v) setPriority(v as TaskPriority); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>카테고리</Label>
            <Select value={categoryId} onValueChange={(v: string | null) => { if (v) setCategoryId(v); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">없음</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full inline-block"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>진행률: {progress}%</Label>
            <Slider
              value={[progress]}
              onValueChange={(v) => {
                const val = Array.isArray(v) ? v[0] : v;
                setProgress(val);
              }}
              max={100}
              step={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deployment_date">배포 예정일</Label>
            <Input
              id="deployment_date"
              type="date"
              value={deploymentDate}
              onChange={(e) => setDeploymentDate(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? '저장 중...' : task ? '수정' : '생성'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
