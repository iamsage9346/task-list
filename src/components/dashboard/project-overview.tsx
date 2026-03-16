'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import type { TaskWithCategory } from '@/lib/types/database';
import { getDDay, formatDate } from '@/lib/utils';
import Link from 'next/link';

interface ProjectOverviewProps {
  upcomingDeployments: TaskWithCategory[];
}

export function ProjectOverview({ upcomingDeployments }: ProjectOverviewProps) {
  if (upcomingDeployments.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          다가오는 배포 일정
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingDeployments.map((task) => (
            <Link
              key={task.id}
              href={`/tasks/${task.id}`}
              className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                {task.categories && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: task.categories.color }}
                  />
                )}
                <span className="text-sm truncate">{task.title}</span>
              </div>
              <Badge variant="outline" className="shrink-0 ml-2">
                {formatDate(task.deployment_date!, 'M/d')} ({getDDay(task.deployment_date!)})
              </Badge>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
