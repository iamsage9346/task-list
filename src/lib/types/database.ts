export type TaskStatus = 'not_started' | 'in_progress' | 'blocked' | 'review' | 'completed' | 'deployed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type NoteType = 'blocker' | 'note' | 'update';

export interface Category {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  progress: number;
  status: TaskStatus;
  priority: TaskPriority;
  category_id: string | null;
  start_date: string | null;
  deployment_date: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TaskWithCategory extends Task {
  categories: Category | null;
}

export interface TaskNote {
  id: string;
  task_id: string;
  content: string;
  type: NoteType;
  created_at: string;
}

export interface TaskWithDetails extends TaskWithCategory {
  task_notes: TaskNote[];
}

// Form types
export interface CreateTaskInput {
  title: string;
  description?: string;
  progress?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  category_id?: string | null;
  start_date?: string | null;
  deployment_date?: string | null;
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  id: string;
}

export interface CreateNoteInput {
  task_id: string;
  content: string;
  type?: NoteType;
}

export interface CreateCategoryInput {
  name: string;
  color?: string;
}

// Dashboard stats
export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  upcomingDeployments: TaskWithCategory[];
}

// Status/Priority display config
export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  not_started: { label: '시작 전', color: 'bg-gray-100 text-gray-800' },
  in_progress: { label: '진행 중', color: 'bg-blue-100 text-blue-800' },
  blocked: { label: '차단됨', color: 'bg-red-100 text-red-800' },
  review: { label: '리뷰 중', color: 'bg-yellow-100 text-yellow-800' },
  completed: { label: '완료', color: 'bg-green-100 text-green-800' },
  deployed: { label: '배포됨', color: 'bg-purple-100 text-purple-800' },
};

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string }> = {
  low: { label: '낮음', color: 'bg-gray-100 text-gray-700' },
  medium: { label: '보통', color: 'bg-blue-100 text-blue-700' },
  high: { label: '높음', color: 'bg-orange-100 text-orange-700' },
  urgent: { label: '긴급', color: 'bg-red-100 text-red-700' },
};
