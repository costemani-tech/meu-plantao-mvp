'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import ConsentBanner from '../components/ConsentBanner';

if (typeof window !== 'undefined') {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
  
  if (token) {
    posthog.init(token, {
      api_host: host,
      person_profiles: 'identified_only',
      capture_pageview: false,
      opt_out_capturing_by_default: true // Opt-out por padrão (LGPD)
    });
  }
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      {children}
      <ConsentBanner />
    </PHProvider>
  );
}
