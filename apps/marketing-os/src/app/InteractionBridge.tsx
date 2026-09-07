'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const FEATURE_SLUGS: Record<string, string> = {
  Audience: 'audience',
  'Message Pillars': 'message-pillars',
  'Brand Guardrails': 'brand-guardrails',
  'Content Calendar': 'content-calendar',
  'Content Items': 'content-items',
  'Create Content': 'create-content',
  'Text to Image': 'text-to-image',
  'Text to Video': 'text-to-video',
  'Image to Video': 'image-to-video',
  'Review & Approve': 'review-approve',
  'Content Library': 'content-library',
  Channels: 'channels',
  Publishing: 'publishing',
  'UTM & Tracking': 'utm-tracking',
  Overview: 'analytics-overview',
  'Content Performance': 'content-performance',
  'Audience Insights': 'audience-insights',
  Attribution: 'attribution',
  'A/B Tests': 'ab-tests',
  'Business Genome': 'business-genome',
  'Next Best Actions': 'next-best-actions',
  Environment: 'environment',
  Migration: 'migration',
  'RLS / Security': 'rls-security',
  'Supabase Staging': 'supabase-staging',
  'Production Readiness': 'production-readiness',
  'System Settings': 'system-settings',
  'ดูทั้งหมด': 'mit-24-steps',
  'ทั้งหมด': 'next-best-actions',
  Website: 'channels',
  Facebook: 'channels',
  YouTube: 'channels',
};

function getWorkspaceSlug(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;
  const first = segments[0];
  if (['login', 'account', 'auth'].includes(first)) return null;
  return first;
}

function normalizeText(element: Element): string {
  return (element.textContent ?? '').replace(/\s+/g, ' ').trim();
}

export default function InteractionBridge() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const workspaceSlug = getWorkspaceSlug(pathname);
    if (!workspaceSlug) return;

    const visualQaToken = workspaceSlug === 'visual-qa'
      ? new URLSearchParams(window.location.search).get('visualQa')
      : null;

    const withVisualQa = (href: string) => {
      if (!visualQaToken) return href;
      const separator = href.includes('?') ? '&' : '?';
      return `${href}${separator}visualQa=${encodeURIComponent(visualQaToken)}`;
    };

    const selectors = [
      '.sidebar-item.muted-item',
      '.sidebar-subitems span',
      '.system-settings-row',
      '.global-search',
      '.notification',
      '.profile-copy',
      '.profile-chevron',
      '.date-filter',
      '.tab-row .tab',
      '.panel-filter',
      '.mit-panel .panel-heading.compact > span',
      '.ai-panel .panel-heading.compact > span',
      '.platform-grid > div',
    ];

    const interactive = Array.from(document.querySelectorAll(selectors.join(',')));

    const cleanup: Array<() => void> = [];

    for (const element of interactive) {
      const el = element as HTMLElement;
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-disabled', 'false');
      el.style.cursor = 'pointer';

      const navigate = () => {
        const text = normalizeText(el);

        if (el.matches('.global-search')) {
          router.push(withVisualQa(`/${workspaceSlug}/feature/search`));
          return;
        }
        if (el.matches('.notification')) {
          router.push(withVisualQa(`/${workspaceSlug}/feature/notifications`));
          return;
        }
        if (el.matches('.profile-copy, .profile-chevron')) {
          router.push('/account');
          return;
        }
        if (el.matches('.date-filter, .panel-filter')) {
          router.push(withVisualQa(`/${workspaceSlug}/home?range=30d`));
          return;
        }
        if (el.matches('.tab-row .tab')) {
          const tab = text.toLowerCase();
          router.push(withVisualQa(`/${workspaceSlug}/home?tab=${encodeURIComponent(tab)}`));
          return;
        }

        const exact = Object.keys(FEATURE_SLUGS).find((label) => text === label || text.includes(label));
        if (exact) {
          router.push(withVisualQa(`/${workspaceSlug}/feature/${FEATURE_SLUGS[exact]}`));
          return;
        }

        router.push(withVisualQa(`/${workspaceSlug}/feature/overview`));
      };

      const onClick = (event: Event) => {
        event.preventDefault();
        navigate();
      };
      const onKeyDown = (event: Event) => {
        const keyboardEvent = event as KeyboardEvent;
        if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
          keyboardEvent.preventDefault();
          navigate();
        }
      };

      el.addEventListener('click', onClick);
      el.addEventListener('keydown', onKeyDown);
      cleanup.push(() => {
        el.removeEventListener('click', onClick);
        el.removeEventListener('keydown', onKeyDown);
      });
    }

    return () => cleanup.forEach((fn) => fn());
  }, [pathname, router]);

  return null;
}
