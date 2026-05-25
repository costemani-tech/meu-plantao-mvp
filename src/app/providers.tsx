'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';

if (typeof window !== 'undefined') {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
  
  if (token) {
    posthog.init(token, {
      api_host: host,
      person_profiles: 'identified_only',
      capture_pageview: false // We can disable auto pageviews or let it capture if needed, standard is false for manual SPA tracking, but let's keep it safe.
    });
  }
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return <PHProvider client={posthog}>{children}</PHProvider>;
}
