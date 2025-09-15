'use client';
import { Button } from '@/components/ui/button';
export function V0Button() {
  return <Button onClick={() => window.open('https://v0.dev/chat?project=ai-chatbot', '_blank')} variant="outline">Edit in v0.dev</Button>;
}
