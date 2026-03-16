'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Category, CreateCategoryInput } from '@/lib/types/database';

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('categories')
    .insert({
      name: input.name,
      color: input.color ?? '#6366f1',
      user_id: user?.id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/');
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/');
}
