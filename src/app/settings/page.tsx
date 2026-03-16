import { getUserSettings } from '@/lib/actions/settings-actions';
import { SettingsForm } from '@/components/settings/settings-form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const settings = await getUserSettings();

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">설정</h1>
            <p className="text-muted-foreground text-sm mt-1">
              API 키 및 연동 설정을 관리하세요
            </p>
          </div>
        </div>

        <SettingsForm initialSettings={settings} />
      </div>
    </main>
  );
}
