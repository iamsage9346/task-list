'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface UserSettings {
  slack_webhook_url: string | null;
  anthropic_api_key: string | null;
}

export async function getUserSettings(): Promise<UserSettings> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data } = await supabase
    .from('user_settings')
    .select('slack_webhook_url, anthropic_api_key')
    .eq('user_id', user.id)
    .single();

  return {
    slack_webhook_url: data?.slack_webhook_url ?? null,
    anthropic_api_key: data?.anthropic_api_key ?? null,
  };
}

export async function updateUserSettings(settings: Partial<UserSettings>): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: user.id,
      ...settings,
    }, { onConflict: 'user_id' });

  if (error) throw new Error(error.message);
  revalidatePath('/settings');
}
