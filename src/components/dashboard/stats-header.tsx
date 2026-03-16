'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { DashboardStats } from '@/lib/types/database';
import { ListTodo, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';

interface StatsHeaderProps {
  stats: DashboardStats;
}

export function StatsHeader({ stats }: StatsHeaderProps) {
  const statItems = [
    {
      label: '전체 태스크',
      value: stats.totalTasks,
      icon: ListTodo,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: '진행 중',
      value: stats.inProgressTasks,
      icon: Loader2,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
    {
      label: '완료',
      value: stats.completedTasks,
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: '차단됨',
      value: stats.blockedTasks,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statItems.map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 ${item.bg}`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="text-2xl font-bold">{item.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">전체 진행률</span>
            <span className="text-sm font-bold">{stats.overallProgress}%</span>
          </div>
          <Progress value={stats.overallProgress} className="h-3" />
        </CardContent>
      </Card>
    </div>
  );
}
