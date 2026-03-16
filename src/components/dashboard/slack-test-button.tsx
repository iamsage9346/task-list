'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export function SlackTestButton() {
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/test-slack', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Slack 전송 실패');
        return;
      }

      toast.success('Slack으로 업무 보고가 전송되었습니다!');
    } catch {
      toast.error('서버 연결 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleTest} disabled={loading}>
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Send className="mr-2 h-4 w-4" />
      )}
      Slack 테스트
    </Button>
  );
}
