'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { TaskNote, CreateNoteInput } from '@/lib/types/database';

export async function getNotes(taskId: string): Promise<TaskNote[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('task_notes')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createNote(input: CreateNoteInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('task_notes').insert({
    task_id: input.task_id,
    content: input.content,
    type: input.type ?? 'note',
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/tasks/${input.task_id}`);
}

export async function deleteNote(id: string, taskId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('task_notes').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath(`/tasks/${taskId}`);
}
