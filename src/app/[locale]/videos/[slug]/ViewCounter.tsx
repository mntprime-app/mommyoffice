'use client';
import { useEffect } from 'react';
import { incrementVideoView } from '@/app/actions/videos';

export default function ViewCounter({ videoId }: { videoId: string }) {
  useEffect(() => {
    // Fire once on mount — non-blocking
    incrementVideoView(videoId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null; // renders nothing
}
