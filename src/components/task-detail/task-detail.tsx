'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Calendar,
  Pencil,
  Trash2,
  Plus,
  AlertTriangle,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import { updateTask, deleteTask } from '@/lib/actions/task-actions';
import { createNote, deleteNote } from '@/lib/actions/note-actions';
import { TaskForm } from '@/components/dashboard/task-form';
import type {
  TaskWithDetails,
  Category,
  NoteType,
  CreateTaskInput,
  UpdateTaskInput,
} from '@/lib/types/database';
import { STATUS_CONFIG } from '@/lib/types/database';
import { formatDateKorean, getDDay } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';

const NOTE_TYPE_CONFIG: Record<NoteType, { label: string; icon: React.ElementType; color: string }> = {
  blocker: { label: '차단 요소', icon: AlertTriangle, color: 'text-red-600' },
  note: { label: '메모', icon: MessageSquare, color: 'text-blue-600' },
  update: { label: '업데이트', icon: RefreshCw, color: 'text-green-600' },
};

interface TaskDetailProps {
  task: TaskWithDetails;
  categories: Category[];
}

export function TaskDetail({ task, categories }: TaskDetailProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState<NoteType>('note');
  const [, startTransition] = useTransition();

  const statusConfig = STATUS_CONFIG[task.status];

  const handleDelete = () => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    startTransition(async () => {
      try {
        await deleteTask(task.id);
        toast.success('태스크가 삭제되었습니다.');
        router.push('/');
      } catch {
        toast.error('삭제에 실패했습니다.');
      }
    });
  };

  const handleFormSubmit = async (data: CreateTaskInput | UpdateTaskInput) => {
    await updateTask(data as UpdateTaskInput);
    toast.success('태스크가 수정되었습니다.');
  };

  const handleAddNote = () => {
    if (!noteContent.trim()) return;
    startTransition(async () => {
      try {
        await createNote({
          task_id: task.id,
          content: noteContent.trim(),
          type: noteType,
        });
        setNoteContent('');
        toast.success('노트가 추가되었습니다.');
      } catch {
        toast.error('노트 추가에 실패했습니다.');
      }
    });
  };

  const handleDeleteNote = (noteId: string) => {
    startTransition(async () => {
      try {
        await deleteNote(noteId, task.id);
        toast.success('노트가 삭제되었습니다.');
      } catch {
        toast.error('삭제에 실패했습니다.');
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold flex-1">{task.title}</h1>
        <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          수정
        </Button>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          삭제
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        {/* Main content */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                {task.categories && (
                  <Badge
                    variant="outline"
                    style={{ borderColor: task.categories.color, color: task.categories.color }}
                  >
                    {task.categories.name}
                  </Badge>
                )}
              </div>

              {task.description && (
                <p className="text-muted-foreground whitespace-pre-wrap">{task.description}</p>
              )}

              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">진행률</span>
                  <span className="text-lg font-bold">{task.progress}%</span>
                </div>
                <Progress value={task.progress} className="h-4" />
              </div>

              {task.deployment_date && (
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    배포 예정: {formatDateKorean(task.deployment_date)} ({getDDay(task.deployment_date)})
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">노트 & 차단 요소</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Select value={noteType} onValueChange={(v: string | null) => { if (v) setNoteType(v as NoteType); }}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(NOTE_TYPE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="내용을 입력하세요..."
                  className="min-h-[40px]"
                  rows={1}
                />
                <Button onClick={handleAddNote} disabled={!noteContent.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <Separator className="mb-4" />

              {task.task_notes.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">
                  아직 노트가 없습니다
                </p>
              ) : (
                <div className="space-y-3">
                  {task.task_notes.map((note) => {
                    const noteConfig = NOTE_TYPE_CONFIG[note.type];
                    const NoteIcon = noteConfig.icon;
                    return (
                      <div
                        key={note.id}
                        className="flex items-start gap-3 p-3 rounded-md bg-muted/50 group"
                      >
                        <NoteIcon className={`h-4 w-4 mt-0.5 shrink-0 ${noteConfig.color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{note.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDateKorean(note.created_at)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">생성일</span>
                <span>{formatDateKorean(task.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">수정일</span>
                <span>{formatDateKorean(task.updated_at)}</span>
              </div>
              {task.deployment_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">배포일</span>
                  <span>{formatDateKorean(task.deployment_date)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <TaskForm
        open={formOpen}
        onOpenChange={setFormOpen}
        task={task}
        categories={categories}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
