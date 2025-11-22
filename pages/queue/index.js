import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function QueueIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/queue/current');
  }, [router]);

  return null;
}
