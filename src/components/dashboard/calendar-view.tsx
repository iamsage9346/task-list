'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, Calendar } from 'lucide-react';
import type { TaskWithCategory } from '@/lib/types/database';
import { STATUS_CONFIG } from '@/lib/types/database';
import { formatDate } from '@/lib/utils';
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
  '#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899',
  '#06b6d4', '#f97316', '#6366f1', '#14b8a6', '#e11d48', '#84cc16',
];

function getTaskColor(taskId: string): string {
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
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [popupPos, setPopupPos] = useState<{ top: number; left: number } | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

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
      if (start && end) return isWithinInterval(day, { start, end });
      if (start) return isSameDay(day, start);
      if (end) return isSameDay(day, end);
      return false;
    });
  };

  const today = new Date();
  const selectedDayTasks = selectedDay ? getTasksForDay(selectedDay) : [];

  const handleDayClick = (day: Date, e: React.MouseEvent<HTMLDivElement>) => {
    const dayTasks = getTasksForDay(day);
    if (dayTasks.length === 0) return;

    if (selectedDay && isSameDay(selectedDay, day)) {
      setSelectedDay(null);
      setPopupPos(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const calendarRect = calendarRef.current?.getBoundingClientRect();
    if (!calendarRect) return;

    const top = rect.bottom - calendarRect.top + 4;
    let left = rect.left - calendarRect.left;
    // Keep popup within calendar bounds
    const popupWidth = 320;
    if (left + popupWidth > calendarRect.width) {
      left = calendarRect.width - popupWidth;
    }
    if (left < 0) left = 0;

    setSelectedDay(day);
    setPopupPos({ top, left });
  };

  // Close popup on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setSelectedDay(null);
        setPopupPos(null);
      }
    };
    if (selectedDay) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [selectedDay]);

  // Close popup on month change
  useEffect(() => {
    setSelectedDay(null);
    setPopupPos(null);
  }, [currentMonth]);

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
        <div ref={calendarRef} className="relative">
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
              const isSelected = selectedDay && isSameDay(day, selectedDay);

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[48px] p-1 rounded-md border text-xs cursor-pointer transition-colors ${
                    !isCurrentMonth ? 'opacity-30' : ''
                  } ${isSelected ? 'border-primary bg-primary/10' : isToday ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted/50'}`}
                  onClick={(e) => handleDayClick(day, e)}
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
                        <div
                          key={task.id}
                          className="h-[3px] rounded-full"
                          style={{ backgroundColor: color }}
                        />
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

          {/* Day popup */}
          {selectedDay && popupPos && selectedDayTasks.length > 0 && (
            <div
              ref={popupRef}
              className="absolute z-50 w-80 bg-popover border rounded-lg shadow-lg animate-in fade-in-0 zoom-in-95"
              style={{ top: popupPos.top, left: popupPos.left }}
            >
              <div className="flex items-center justify-between p-3 border-b">
                <h3 className="font-semibold text-sm">
                  {format(selectedDay, 'M월 d일 (EEEE)', { locale: ko })}
                </h3>
                <button
                  onClick={() => { setSelectedDay(null); setPopupPos(null); }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-2 max-h-60 overflow-y-auto space-y-1">
                {selectedDayTasks.map((task) => {
                  const color = getTaskColor(task.id);
                  const statusConfig = STATUS_CONFIG[task.status];
                  return (
                    <Link key={task.id} href={`/tasks/${task.id}`}>
                      <div className="flex items-start gap-2.5 p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer">
                        <div
                          className="w-1 self-stretch rounded-full shrink-0 mt-0.5"
                          style={{ backgroundColor: color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{task.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusConfig.color}`}>
                              {statusConfig.label}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground font-medium">
                              {task.progress}%
                            </span>
                            {task.start_date && task.deployment_date && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <Calendar className="h-2.5 w-2.5" />
                                {formatDate(task.start_date, 'M/d')} → {formatDate(task.deployment_date, 'M/d')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
