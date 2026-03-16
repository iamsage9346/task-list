import { formatDateKorean, getDDay, getProgressBar } from './utils';
import type { TaskWithCategory } from './types/database';

interface SlackReportData {
  tasks: TaskWithCategory[];
  appUrl: string;
}

export function buildMorningReport({ tasks, appUrl }: SlackReportData): object {
  const today = formatDateKorean(new Date());

  const inProgressTasks = tasks.filter(
    (t) => t.status === 'in_progress' || t.status === 'review'
  );
  const upcomingDeployments = tasks
    .filter((t) => t.deployment_date && t.status !== 'deployed')
    .sort(
      (a, b) =>
        new Date(a.deployment_date!).getTime() - new Date(b.deployment_date!).getTime()
    )
    .slice(0, 5);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    (t) => t.status === 'completed' || t.status === 'deployed'
  ).length;
  const overallProgress =
    totalTasks > 0
      ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / totalTasks)
      : 0;

  let text = `📋 일일 업무 보고 - ${today}\n\n`;

  // Overall stats
  text += `*전체 현황: ${completedTasks}/${totalTasks}개 완료 (${overallProgress}%)*\n\n`;

  // Progress bars for in-progress tasks
  if (inProgressTasks.length > 0) {
    text += `*작업별 진행률*\n`;
    inProgressTasks.forEach((t) => {
      const bar = getProgressBar(t.progress);
      text += `${bar} ${t.progress}% - ${t.title}\n`;
    });
    text += '\n';
  }

  // Upcoming deployments
  if (upcomingDeployments.length > 0) {
    text += `*📅 다가오는 배포 일정*\n`;
    upcomingDeployments.forEach((t) => {
      const dDay = getDDay(t.deployment_date!);
      const dateStr = t.deployment_date!.slice(5).replace('-', '/');
      text += `• ${dateStr} (${dDay}): ${t.title}\n`;
    });
    text += '\n';
  }

  text += `전체 현황 보기: ${appUrl}/share`;

  return {
    text,
    blocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text },
      },
    ],
  };
}

export async function sendSlackMessage(payload: object): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('SLACK_WEBHOOK_URL is not configured');
    return false;
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return response.ok;
}
