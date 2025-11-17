// libs/jsonforms-components/src/lib/Controls/FormStepper/util/HistoryBridge.tsx

import React, { useEffect, useMemo } from 'react';
import { JsonFormsStepperContext, JsonFormsStepperContextProps } from '../context';

export type HistoryBridgeProps = {
  enabled?: boolean;
  basePath?: string; // e.g. `/tenant/defId/formId`
  strategy?: 'path' | 'query' | 'hash';
  includeReview?: boolean;
  mode?: 'push' | 'replace';
};

const slugify = (s?: string) =>
  (s ?? '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Shared helper: URL -> step index
 */
function parseIndexFromLocation(
  slugs: string[],
  opts: { basePath?: string; strategy?: 'path' | 'query' | 'hash' }
): number {
  const { basePath = '', strategy = 'path' } = opts;
  try {
    if (strategy === 'hash') {
      const hash = (window.location.hash || '').replace(/^#/, '');
      const parts = hash.split('/').filter(Boolean);
      const slug = parts[0] ?? '';
      const idx = slugs.indexOf(slug);
      console.log('[HB:parseIndex]', { strategy, hash, slug, idx, slugs });
      return idx >= 0 ? idx : 0;
    }

    if (strategy === 'query') {
      const url = new URL(window.location.href);
      const slug = url.searchParams.get('step') ?? '';
      const idx = slugs.indexOf(slug);
      console.log('[HB:parseIndex]', { strategy, search: url.search, slug, idx, slugs });
      return idx >= 0 ? idx : 0;
    }

    // strategy === 'path'
    const pathname = window.location.pathname;
    const prefix = basePath ? (basePath.endsWith('/') ? basePath.slice(0, -1) : basePath) : '';
    const remainder = prefix && pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname;
    const parts = remainder.split('/').filter(Boolean);
    const slug = parts[0] ?? '';
    const idx = slugs.indexOf(slug);

    console.log('[HB:parseIndex]', {
      strategy,
      pathname,
      basePath,
      prefix,
      remainder,
      slug,
      idx,
      slugs,
    });

    return idx >= 0 ? idx : 0;
  } catch (e) {
    console.warn('[HB:parseIndex] failed, defaulting to 0', e);
    return 0;
  }
}

export function HistoryBridge({
  enabled = true,
  basePath = '',
  strategy = 'path',
  includeReview = true,
  mode = 'replace',
}: HistoryBridgeProps) {
  const ctx = React.useContext(JsonFormsStepperContext) as JsonFormsStepperContextProps | undefined;

  // If we render outside the Stepper provider, do nothing safely.
  if (!ctx || !enabled) return null;

  const { selectStepperState, goToPage } = ctx;
  const { activeId, categories, isOnReview } = selectStepperState();

  const slugs = useMemo(() => {
    const catSlugs = (categories ?? []).map((c) => slugify(c.label ?? `step-${c.id}`));
    const result = includeReview ? [...catSlugs, 'review'] : catSlugs;
    console.log('[HB] slugs computed', { labels: categories?.map((c) => c.label), slugs: result });
    return result;
  }, [categories, includeReview]);

  const applyHistory = mode === 'replace' ? history.replaceState.bind(history) : history.pushState.bind(history);

  /**
   * URL -> UI on mount and back/forward
   */
  useEffect(() => {
    if (!slugs.length) return;

    const idx = parseIndexFromLocation(slugs, { basePath, strategy });
    console.log('[HB] URL->UI initial', {
      idx,
      path: window.location.pathname,
      slugs,
      basePath,
      strategy,
    });

    if (idx !== activeId) {
      console.log('[HB] URL->UI goToPage(initial)', { from: activeId, to: idx });
      goToPage(idx);
    }

    const onPop = () => {
      const i = parseIndexFromLocation(slugs, { basePath, strategy });
      const { activeId: currentActive } = selectStepperState();
      console.log('[HB] URL->UI popstate', {
        i,
        currentActive,
        path: window.location.pathname,
        slugs,
      });
      if (i !== currentActive) {
        console.log('[HB] URL->UI goToPage(popstate)', { from: currentActive, to: i });
        goToPage(i);
      }
    };

    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugs.join('|'), basePath, strategy]);

  /**
   * UI -> URL when step changes
   */
  useEffect(() => {
    if (!slugs.length) return;

    const idx = isOnReview ? slugs.indexOf('review') : activeId;
    const stepSlug = slugs[idx] ?? slugs[0] ?? '';
    if (!stepSlug) return;

    if (strategy === 'hash') {
      const next = `${window.location.pathname}${window.location.search}#/${stepSlug}`;
      console.log('[HB] UI->URL write(hash)', { activeId, isOnReview, idx, stepSlug, next });
      applyHistory({}, '', next);
      return;
    }

    if (strategy === 'query') {
      const url = new URL(window.location.href);
      url.searchParams.set('step', stepSlug);
      const next = url.toString();
      console.log('[HB] UI->URL write(query)', { activeId, isOnReview, idx, stepSlug, next });
      applyHistory({}, '', next);
      return;
    }

    // strategy === 'path'
    const prefix = basePath ? (basePath.endsWith('/') ? basePath.slice(0, -1) : basePath) : '';
    const nextPath = prefix ? `${prefix}/${stepSlug}` : window.location.pathname.replace(/\/[^/]*$/, `/${stepSlug}`);
    const next = `${nextPath}${window.location.search}${window.location.hash}`;

    console.log('[HB] UI->URL write(path)', {
      activeId,
      isOnReview,
      idx,
      stepSlug,
      prefix,
      nextPath,
      next,
    });

    if (window.location.pathname !== nextPath) {
      applyHistory({}, '', next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, isOnReview, slugs.join('|'), basePath, strategy, mode]);

  return null;
}
