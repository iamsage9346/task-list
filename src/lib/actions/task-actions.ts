'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type {
  TaskWithCategory,
  TaskWithDetails,
  CreateTaskInput,
  UpdateTaskInput,
  DashboardStats,
} from '@/lib/types/database';

export async function getTasks(categoryId?: string, status?: string): Promise<TaskWithCategory[]> {
  const supabase = await createClient();
  let query = supabase
    .from('tasks')
    .select('*, categories(*)')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }
  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getTask(id: string): Promise<TaskWithDetails> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('*, categories(*), task_notes(*)')
    .eq('id', id)
    .order('created_at', { ascending: false, referencedTable: 'task_notes' })
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createTask(input: CreateTaskInput): Promise<void> {
  const supabase = await createClient();

  const insertData: Record<string, unknown> = {
    title: input.title,
    description: input.description ?? null,
    progress: input.progress ?? 0,
    status: input.status ?? 'not_started',
    priority: input.priority ?? 'medium',
    category_id: input.category_id ?? null,
    start_date: input.start_date ?? null,
    deployment_date: input.deployment_date ?? null,
  };

  const { error } = await supabase.from('tasks').insert(insertData);
  if (error) throw new Error(error.message);
  revalidatePath('/');
}

export async function updateTask(input: UpdateTaskInput): Promise<void> {
  const supabase = await createClient();
  const { id, ...updates } = input;

  const { error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/');
  revalidatePath(`/tasks/${id}`);
}

export async function createTasks(inputs: CreateTaskInput[]): Promise<void> {
  const supabase = await createClient();

  const rows = inputs.map((input) => ({
    title: input.title,
    description: input.description ?? null,
    progress: input.progress ?? 0,
    status: input.status ?? 'not_started',
    priority: input.priority ?? 'medium',
    category_id: input.category_id ?? null,
    start_date: input.start_date ?? null,
    deployment_date: input.deployment_date ?? null,
  }));

  const { error } = await supabase.from('tasks').insert(rows);
  if (error) throw new Error(error.message);
  revalidatePath('/');
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/');
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*, categories(*)');

  if (error) throw new Error(error.message);

  const allTasks = tasks ?? [];
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(
    (t) => t.status === 'completed' || t.status === 'deployed'
  ).length;
  const inProgressTasks = allTasks.filter((t) => t.status === 'in_progress').length;
  const blockedTasks = allTasks.filter((t) => t.status === 'blocked').length;

  const upcomingDeployments = allTasks
    .filter((t) => t.deployment_date && t.status !== 'deployed')
    .sort(
      (a, b) =>
        new Date(a.deployment_date!).getTime() - new Date(b.deployment_date!).getTime()
    )
    .slice(0, 5) as TaskWithCategory[];

  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    blockedTasks,
    upcomingDeployments,
  };
}
