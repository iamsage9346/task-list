'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { TaskWithCategory } from '@/lib/types/database';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  addMonths,
  subMonths,
  parseISO,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';

const TASK_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#f59e0b', // amber
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#e11d48', // rose
  '#84cc16', // lime
];

function getTaskColor(taskId: string): string {
  // Use a simple hash of the task ID to pick a consistent color
  let hash = 0;
  for (let i = 0; i < taskId.length; i++) {
    hash = taskId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TASK_COLORS[Math.abs(hash) % TASK_COLORS.length];
}

interface CalendarViewProps {
  tasks: TaskWithCategory[];
}

export function CalendarView({ tasks }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = useMemo(
    () => eachDayOfInterval({ start: calendarStart, end: calendarEnd }),
    [calendarStart.getTime(), calendarEnd.getTime()]
  );

  const weekDays = ['월', '화', '수', '목', '금', '토', '일'];

  const getTasksForDay = (day: Date) => {
    return tasks.filter((task) => {
      const start = task.start_date ? parseISO(task.start_date) : null;
      const end = task.deployment_date ? parseISO(task.deployment_date) : null;

      if (start && end) {
        return isWithinInterval(day, { start, end });
      }
      if (start) return isSameDay(day, start);
      if (end) return isSameDay(day, end);
      return false;
    });
  };

  const today = new Date();

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {format(currentMonth, 'yyyy년 M월', { locale: ko })}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setCurrentMonth(new Date())}
            >
              오늘
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-2">
        <div className="grid grid-cols-7 gap-px">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-1"
            >
              {day}
            </div>
          ))}
          {days.map((day) => {
            const dayTasks = getTasksForDay(day);
            const isToday = isSameDay(day, today);
            const isCurrentMonth = isSameMonth(day, currentMonth);

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[48px] p-1 rounded-md border text-xs ${
                  !isCurrentMonth ? 'opacity-30' : ''
                } ${isToday ? 'border-primary bg-primary/5' : 'border-transparent'}`}
              >
                <div
                  className={`text-right mb-0.5 ${
                    isToday ? 'font-bold text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {format(day, 'd')}
                </div>
                <div className="flex flex-col gap-[2px]">
                  {dayTasks.slice(0, 4).map((task) => {
                    const color = getTaskColor(task.id);
                    return (
                      <Link key={task.id} href={`/tasks/${task.id}`}>
                        <div
                          className="h-[3px] rounded-full cursor-pointer hover:h-[5px] transition-all"
                          style={{ backgroundColor: color }}
                          title={`${task.title} (${task.progress}%)`}
                        />
                      </Link>
                    );
                  })}
                  {dayTasks.length > 4 && (
                    <div className="text-[9px] text-muted-foreground text-center leading-none">
                      +{dayTasks.length - 4}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
