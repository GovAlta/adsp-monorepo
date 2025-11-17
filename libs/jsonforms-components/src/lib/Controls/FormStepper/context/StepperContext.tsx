import React, { createContext, ReactNode, useMemo, useReducer, Dispatch, useEffect, useCallback } from 'react';
import { useJsonForms } from '@jsonforms/react';
import { Categorization, deriveLabelForUISchemaElement, isEnabled, isVisible } from '@jsonforms/core';

import { CategorizationStepperLayoutRendererProps } from '../types';
import { pickPropertyValues } from '../util/helpers';
import { stepperReducer, JsonFormStepperDispatch } from './reducer';
import { StepperContextDataType, CategoryState } from './types';
import { hasDataInScopes, getIncompletePaths, getIsVisitFromLocalStorage, saveIsVisitFromLocalStorage } from './util';

export interface JsonFormsStepperContextProviderProps {
  children: ReactNode;
  StepperProps: CategorizationStepperLayoutRendererProps & {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    customDispatch?: Dispatch<any> & { activeId?: number } & { withBackReviewBtn?: boolean };
  };
}

export interface JsonFormsStepperContextProps {
  stepperDispatch: JsonFormStepperDispatch;
  selectStepperState: () => StepperContextDataType;
  selectIsDisabled: () => boolean;
  selectIsActive: (id: number) => boolean;
  selectPath: () => string;
  selectCategory: (id: number) => CategoryState;
  goToPage: (id: number, updateCategoryId?: number) => void;
  goToTableOfContext: () => void;
  toggleShowReviewLink: (id: number) => void;
  validatePage: (id: number) => void;
  selectNumberOfCompletedCategories: () => number;
  isProvided?: boolean;
}

/* ---------- helpers for slug + URL parsing ---------- */

const slugify = (s?: string) =>
  (s ?? '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');

function parseIndexFromLocation(
  slugs: string[],
  { basePath = '', strategy = 'path' }: { basePath?: string; strategy?: 'path' | 'query' | 'hash' }
): number {
  try {
    if (strategy === 'hash') {
      const parts = (window.location.hash || '').replace(/^#/, '').split('/').filter(Boolean);
      const slug = parts[0] ?? '';
      const idx = slugs.indexOf(slug);
      return idx >= 0 ? idx : 0;
    }

    if (strategy === 'query') {
      const url = new URL(window.location.href);
      const slug = url.searchParams.get('step') ?? '';
      const idx = slugs.indexOf(slug);
      return idx >= 0 ? idx : 0;
    }

    // path
    const pathname = window.location.pathname;
    const prefix = basePath ? (basePath.endsWith('/') ? basePath.slice(0, -1) : basePath) : '';
    const remainder = prefix && pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname;
    const parts = remainder.split('/').filter(Boolean);
    const slug = parts[0] ?? '';
    const idx = slugs.indexOf(slug);
    return idx >= 0 ? idx : 0;
  } catch {
    return 0;
  }
}

/* ---------- initial state from props (with URL awareness) ---------- */

const createStepperContextInitData = (
  props: CategorizationStepperLayoutRendererProps & { activeId?: number } & { withBackReviewBtn?: boolean }
): StepperContextDataType => {
  const { uischema, data, schema, ajv, t, path } = props;
  const categorization = uischema as Categorization;
  const valid = ajv.validate(schema, data || {});
  const isPage = uischema?.options?.variant === 'pages';
  const isCacheStatus = uischema.options?.cacheStatus;
  const historySync = (uischema?.options as any)?.historySync || undefined;

  const cachedStatus = (isCacheStatus && getIsVisitFromLocalStorage()) || [];
  ajv.validate(schema, data);

  const categories =
    categorization.elements?.map((c, id) => {
      const scopes = pickPropertyValues(c, 'scope', 'ListWithDetail');
      const incompletePaths = getIncompletePaths(ajv, schema, data, scopes);
      const hasAnyData = hasDataInScopes(data, scopes);
      const isVisited = isCacheStatus ? cachedStatus.at(id) : hasAnyData;
      const isCompleted = isVisited && incompletePaths.length === 0;
      const isValid = isCompleted;

      return {
        id,
        label: deriveLabelForUISchemaElement(c, t) as string,
        scopes,
        isVisited,
        isCompleted,
        isValid,
        uischema: c,
        showReviewPageLink: props.withBackReviewBtn || false,
        isEnabled: isEnabled(c, data, '', ajv),
        visible: isVisible(c, data, '', ajv),
      };
    }) ?? [];

  // Start with 0 or explicitly provided activeId
  let initialActiveId = props?.activeId ?? 0;

  // If historySync is enabled, try to derive from URL
  if (historySync?.enabled && typeof window !== 'undefined') {
    const includeReview = historySync?.includeReview ?? true;
    const catSlugs = categories.map((c) => slugify(c.label ?? `step-${c.id}`));
    const slugs = includeReview ? [...catSlugs, 'review'] : catSlugs;

    const idx = parseIndexFromLocation(slugs, {
      basePath: historySync?.basePath ?? '',
      strategy: historySync?.strategy ?? 'path',
    });

    initialActiveId = Math.min(Math.max(idx, 0), includeReview ? categories.length : categories.length - 1);

    console.log('[CTX:init]', {
      historySync,
      idxFromUrl: idx,
      activeId: initialActiveId,
      maxReachedStep: initialActiveId,
      slugs,
      pathname: window.location.pathname,
    });
  } else {
    console.log('[CTX:init]', {
      historySync,
      activeId: initialActiveId,
      maxReachedStep: initialActiveId,
      slugs: categories.map((c) => slugify(c.label ?? `step-${c.id}`)),
      pathname: typeof window !== 'undefined' ? window.location.pathname : '(no window)',
    });
  }

  const activeId = isPage ? categories.length + 1 : initialActiveId;

  return {
    categories,
    activeId,
    hasNextButton: activeId !== categories.length,
    hasPrevButton: activeId > 0 && activeId !== categories.length,
    path,
    isOnReview: activeId === categories.length,
    isValid: valid === true,
    maxReachedStep: activeId,
  };
};

export const JsonFormsStepperContext = createContext<JsonFormsStepperContextProps | undefined>(undefined);

/* ---------- provider ---------- */

export const JsonFormsStepperContextProvider = ({
  children,
  StepperProps,
}: JsonFormsStepperContextProviderProps): JSX.Element => {
  const ctx = useJsonForms();
  const { schema, ajv, data, uischema } = StepperProps;

  const [stepperState, dispatch] = useReducer(stepperReducer, createStepperContextInitData(StepperProps));
  const stepperDispatch = StepperProps?.customDispatch || dispatch;

  const isCacheStatus = uischema?.options?.cacheStatus;
  // const historySync = (uischema?.options as any)?.historySync;

  const doValidatePage = useCallback(
    (id: number) => {
      stepperDispatch({
        type: 'update/category',
        payload: { errors: ctx?.core?.errors, id, ajv, schema, data },
      });
    },
    [stepperDispatch, ctx?.core?.errors, ajv, schema, data]
  );

  const context = useMemo<JsonFormsStepperContextProps>(() => {
    return {
      isProvided: true,
      stepperDispatch,
      selectStepperState: () => ({
        ...stepperState,
        categories: stepperState.categories?.map((c) => ({
          ...c,
          visible: c?.uischema && isVisible(c.uischema, data, '', ajv),
          isEnabled: c?.uischema && isEnabled(c.uischema, data, '', ajv),
        })),
      }),
      selectIsDisabled: () => {
        const category = stepperState.categories?.[stepperState.activeId];
        return category === undefined ? false : !category?.isEnabled;
      },
      selectNumberOfCompletedCategories: (): number =>
        stepperState?.categories.reduce(
          (acc, cat) =>
            acc +
            (cat.isValid &&
            cat.isCompleted &&
            cat.isVisited &&
            cat?.uischema &&
            (cat?.uischema?.options?.showInTaskList || cat?.uischema?.options?.showInTaskList === undefined) &&
            isVisible(cat.uischema as any, data, '', ajv)
              ? 1
              : 0),
          0
        ),
      selectIsActive: (id: number) => id === stepperState.activeId,
      selectPath: () => stepperState.path,
      selectCategory: (id: number) => stepperState.categories[id],
      goToTableOfContext: () => {
        stepperDispatch({ type: 'page/to/index', payload: { id: stepperState.categories.length + 1 } });
      },
      validatePage: doValidatePage,
      goToPage: (id: number) => {
        const from = stepperState.activeId;
        console.log('[CTX] goToPage', {
          fromActive: from,
          to: id,
          stack: new Error().stack,
        });

        // If it’s already on that page, do nothing.
        if (id === from) {
          return;
        }

        ajv.validate(schema, ctx.core?.data || {});
        if (!stepperState.isOnReview && id < stepperState.categories.length) {
          stepperDispatch({
            type: 'update/category',
            payload: { errors: ctx?.core?.errors, id, ajv, schema, data },
          });
        }

        stepperDispatch({
          type: 'validate/form',
          payload: { errors: ctx?.core?.errors },
        });
        stepperDispatch({ type: 'page/to/index', payload: { id } });
      },

      toggleShowReviewLink: (id: number) => {
        stepperDispatch({ type: 'toggle/category/review-link', payload: { id } });
      },
    };
  }, [stepperDispatch, stepperState, ctx.core?.errors, ajv, schema, data]);

  /* cache visit flags on unload, if enabled */
  // useEffect(() => {
  //   const handleBeforeUnload = () => {
  //     if (isCacheStatus) {
  //       saveIsVisitFromLocalStorage(stepperState?.categories?.map((c) => c?.isVisited as boolean) || []);
  //     }
  //   };
  //   window.addEventListener('beforeunload', handleBeforeUnload);
  //   return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  // }, [isCacheStatus, stepperState]);

  /**
   * IMPORTANT:
   * If historySync.enabled is true, DO NOT rebuild/override the activeId on uiSchema/schema changes.
   * That rebuild is what was forcing activeId back to 0 and “jumping” you to the first page.
   */
  useEffect(() => {
    const historySync = (StepperProps?.uischema?.options as any)?.historySync;
    if (historySync?.enabled) {
      console.log('[CTX] historySync enabled -> skip reinit on ui/schema change');
      return;
    }

    if (!context?.isProvided) return;

    stepperDispatch({
      type: 'update/uischema',
      payload: {
        state: createStepperContextInitData({
          ...StepperProps,
          // keep current activeId instead of resetting it to 0
          activeId: Math.min(stepperState?.activeId, stepperState.maxReachedStep),
        }),
      },
    });

    if (stepperState.activeId !== stepperState.categories.length + 1) {
      context.goToPage(stepperState.maxReachedStep);
      context.goToPage(stepperState.activeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(StepperProps.uischema), JSON.stringify(StepperProps.schema)]);

  return <JsonFormsStepperContext.Provider value={context}>{children}</JsonFormsStepperContext.Provider>;
};
