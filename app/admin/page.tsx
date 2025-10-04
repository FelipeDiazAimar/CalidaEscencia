'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Hide announcement bar immediately
    document.body.setAttribute('data-admin', 'true');
    // Redirect to adminpanel
    router.replace('/adminpanel');
  }, [router]);

  return null;
}