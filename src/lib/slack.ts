import { formatDateKorean, getDDay, getProgressBar, formatDate } from './utils';
import type { TaskWithCategory } from './types/database';
import { STATUS_CONFIG } from './types/database';

interface SlackReportData {
  tasks: TaskWithCategory[];
  appUrl: string;
}

export function buildMorningReport({ tasks, appUrl }: SlackReportData): object {
  const today = formatDateKorean(new Date());

  const allTasks = tasks;
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(
    (t) => t.status === 'completed' || t.status === 'deployed'
  ).length;
  const inProgressTasks = allTasks.filter(
    (t) => t.status === 'in_progress' || t.status === 'review'
  );
  const notStartedTasks = allTasks.filter((t) => t.status === 'not_started');
  const overallProgress =
    totalTasks > 0
      ? Math.round(allTasks.reduce((sum, t) => sum + t.progress, 0) / totalTasks)
      : 0;

  const upcomingDeployments = allTasks
    .filter((t) => t.deployment_date && t.status !== 'deployed' && t.status !== 'completed')
    .sort(
      (a, b) =>
        new Date(a.deployment_date!).getTime() - new Date(b.deployment_date!).getTime()
    )
    .slice(0, 7);

  // Build Slack message
  let text = `📋 *일일 업무 보고* — ${today}\n\n`;

  // Overall stats
  text += `📊 *전체 현황*\n`;
  text += `• 전체: ${totalTasks}개 | 완료: ${completedTasks}개 | 진행 중: ${inProgressTasks.length}개 | 시작 전: ${notStartedTasks.length}개\n`;
  text += `• 전체 진행률: ${getProgressBar(overallProgress)} ${overallProgress}%\n\n`;

  // In-progress tasks with progress bars
  if (inProgressTasks.length > 0) {
    text += `🔧 *진행 중인 업무*\n`;
    inProgressTasks.forEach((t) => {
      const bar = getProgressBar(t.progress);
      const category = t.categories ? `[${t.categories.name}]` : '';
      const dateInfo = t.deployment_date ? ` (마감: ${formatDate(t.deployment_date, 'M/d')} ${getDDay(t.deployment_date)})` : '';
      text += `${bar} ${t.progress}% — ${category} ${t.title}${dateInfo}\n`;
    });
    text += '\n';
  }

  // Not started tasks
  if (notStartedTasks.length > 0) {
    text += `⏳ *시작 전 업무*\n`;
    notStartedTasks.forEach((t) => {
      const category = t.categories ? `[${t.categories.name}]` : '';
      const dateInfo = t.start_date ? ` (시작: ${formatDate(t.start_date, 'M/d')})` : '';
      text += `• ${category} ${t.title}${dateInfo}\n`;
    });
    text += '\n';
  }

  // Upcoming deadlines
  if (upcomingDeployments.length > 0) {
    text += `📅 *이번 주 마감 일정*\n`;
    upcomingDeployments.forEach((t) => {
      const dDay = getDDay(t.deployment_date!);
      const dateStr = formatDate(t.deployment_date!, 'M/d (EEE)');
      const statusLabel = STATUS_CONFIG[t.status].label;
      text += `• ${dateStr} ${dDay} — ${t.title} (${statusLabel}, ${t.progress}%)\n`;
    });
    text += '\n';
  }

  text += `🔗 <${appUrl}/share|전체 현황 보기>`;

  return {
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
