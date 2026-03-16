'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Eye, EyeOff } from 'lucide-react';
import { updateUserSettings, type UserSettings } from '@/lib/actions/settings-actions';
import { toast } from 'sonner';

interface SettingsFormProps {
  initialSettings: UserSettings;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [slackUrl, setSlackUrl] = useState(initialSettings.slack_webhook_url ?? '');
  const [anthropicKey, setAnthropicKey] = useState(initialSettings.anthropic_api_key ?? '');
  const [showSlack, setShowSlack] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateUserSettings({
          slack_webhook_url: slackUrl || null,
          anthropic_api_key: anthropicKey || null,
        });
        toast.success('설정이 저장되었습니다.');
      } catch {
        toast.error('설정 저장에 실패했습니다.');
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Slack 연동</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="slack_url">Webhook URL</Label>
            <div className="relative">
              <Input
                id="slack_url"
                type={showSlack ? 'text' : 'password'}
                value={slackUrl}
                onChange={(e) => setSlackUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSlack(!showSlack)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showSlack ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Slack 앱 &gt; Incoming Webhooks에서 생성한 URL을 입력하세요
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI 태스크 생성</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="anthropic_key">Anthropic API Key</Label>
            <div className="relative">
              <Input
                id="anthropic_key"
                type={showAnthropic ? 'text' : 'password'}
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                placeholder="sk-ant-api03-..."
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowAnthropic(!showAnthropic)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showAnthropic ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              AI 태스크 자동 생성에 사용됩니다. console.anthropic.com에서 발급
            </p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={isPending} className="w-full gap-2">
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        설정 저장
      </Button>
    </div>
  );
}
