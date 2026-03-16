'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Calendar, ListTodo } from 'lucide-react';
import type { TaskWithCategory, DashboardStats, Category } from '@/lib/types/database';
import { STATUS_CONFIG } from '@/lib/types/database';
import { formatDateKorean, getDDay, formatDate } from '@/lib/utils';

interface ShareViewProps {
  tasks: TaskWithCategory[];
  stats: DashboardStats;
  categories: Category[];
}

export function ShareView({ tasks, stats, categories }: ShareViewProps) {
  const activeTasks = tasks.filter(
    (t) => t.status !== 'deployed' && t.status !== 'completed'
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">업무 현황</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {formatDateKorean(new Date())} 기준
        </p>
      </div>

      {/* Overall stats */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              전체 현황: {stats.completedTasks}/{stats.totalTasks}개 완료
            </span>
          </div>
          <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
            <span>진행 중: {stats.inProgressTasks}</span>
            <span>차단됨: {stats.blockedTasks}</span>
          </div>
        </CardContent>
      </Card>

      {/* By category */}
      {categories.map((category) => {
        const categoryTasks = activeTasks.filter((t) => t.category_id === category.id);
        if (categoryTasks.length === 0) return null;
        return (
          <Card key={category.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                {category.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categoryTasks.map((task) => {
                  const statusConfig = STATUS_CONFIG[task.status];
                  return (
                    <div key={task.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-medium truncate">{task.title}</span>
                          <Badge variant="outline" className={`${statusConfig.color} text-xs shrink-0`}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <span className="text-sm font-bold shrink-0 ml-2">{task.progress}%</span>
                      </div>
                      <Progress value={task.progress} className="h-2" />
                      {task.deployment_date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            배포: {formatDate(task.deployment_date, 'M/d')} ({getDDay(task.deployment_date)})
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Uncategorized */}
      {(() => {
        const uncategorized = activeTasks.filter((t) => !t.category_id);
        if (uncategorized.length === 0) return null;
        return (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ListTodo className="h-4 w-4" />
                기타
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {uncategorized.map((task) => (
                  <div key={task.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{task.title}</span>
                      <span className="text-sm font-bold">{task.progress}%</span>
                    </div>
                    <Progress value={task.progress} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Upcoming deployments */}
      {stats.upcomingDeployments.length > 0 && (
        <>
          <Separator />
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                다가오는 배포 일정
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.upcomingDeployments.map((task) => (
                  <div key={task.id} className="flex items-center justify-between text-sm">
                    <span>{task.title}</span>
                    <Badge variant="outline">
                      {formatDate(task.deployment_date!, 'M/d')} ({getDDay(task.deployment_date!)})
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <p className="text-center text-xs text-muted-foreground py-4">
        Task Progress Tracker
      </p>
    </div>
  );
}
