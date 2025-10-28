import { useContext, useEffect } from 'react';
import { GoAButtonType } from '@abgov/react-components';
import { withJsonFormsLayoutProps, withTranslateProps } from '@jsonforms/react';
import { withAjvProps } from '../../util/layout';
import { CategorizationStepperLayoutRendererProps } from './types';
import { JsonFormsStepperContextProvider, JsonFormsStepperContext, JsonFormsStepperContextProps } from './context';
import { TaskList, TocProps } from './TaskList/TaskList';
import { RenderPages } from './RenderPages';

/* --- helpers: JSON-pointer + "has data" (ignores schema defaults) --- */
type AnyRecord = Record<string, unknown>;
const isRecord = (v: unknown): v is AnyRecord => typeof v === 'object' && v !== null && !Array.isArray(v);

function getByJsonPointer(obj: unknown, pointer: string): unknown {
  if (!isRecord(obj) || !pointer || pointer[0] !== '#') return undefined;
  const parts = pointer.replace(/^#\//, '').split('/').filter(Boolean);
  let cur: unknown = obj;
  for (const part of parts) {
    if (part === 'properties') continue;
    if (!isRecord(cur)) return undefined;
    cur = cur[part];
    if (cur === undefined) return undefined;
  }
  return cur;
}

/** Keys that commonly come from schema defaults and shouldn't count as "user data" */
const IGNORE_DEFAULT_KEYS = new Set(['country', 'countryCode']);

/** Return true only if value is user-provided/meaningful (not just defaults). */
function hasDataValue(v: unknown, key?: string): boolean {
  if (key && IGNORE_DEFAULT_KEYS.has(key)) return false;
  if (v === undefined || v === null) return false;

  const t = typeof v;
  if (t === 'string') return (v as string).trim().length > 0;
  if (t === 'number' || t === 'boolean') return true;

  if (Array.isArray(v)) return v.length > 0;

  if (isRecord(v)) {
    for (const k of Object.keys(v)) {
      if (hasDataValue(v[k], k)) return true;
    }
    return false;
  }
  return false;
}
function getCategoryScopes(cat: unknown): string[] {
  if (!isRecord(cat)) return [];
  const scopes = cat.scopes as unknown;
  return Array.isArray(scopes) && scopes.every((s) => typeof s === 'string') ? (scopes as string[]) : [];
}

function hasDataInScopes(data: unknown, scopes?: string[]): boolean {
  if (!Array.isArray(scopes) || scopes.length === 0) return false;
  return scopes.some((s) => hasDataValue(getByJsonPointer(data, s)));
}

export interface FormPageOptionProps {
  nextButtonLabel?: string;
  nextButtonType?: GoAButtonType;
  previousButtonLabel?: string;
  previousButtonType?: GoAButtonType;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const FormPageStepper = (props: CategorizationStepperLayoutRendererProps) => {
  const formStepperCtx = useContext(JsonFormsStepperContext);
  /**
   * StepperCtx can only be provided once to prevent issues from categorization in categorization
   *  */
  if (formStepperCtx?.isProvided === true) {
    return <FormPagesView {...props} />;
  }
  return (
    <JsonFormsStepperContextProvider StepperProps={{ ...props }}>
      <FormPagesView {...props} />
    </JsonFormsStepperContextProvider>
  );
};

export const FormPagesView = (props: CategorizationStepperLayoutRendererProps): JSX.Element => {
  const data = props.data;

  const formStepperCtx = useContext(JsonFormsStepperContext) as JsonFormsStepperContextProps;
  const { validatePage, goToPage } = formStepperCtx;

  const { categories, activeId } = formStepperCtx.selectStepperState();

  useEffect(() => {
    validatePage(activeId);
  }, [data, activeId, validatePage]);

  const handleGoToPage = (index: number) => {
    goToPage(index);
  };

  if (categories.length + 1 === activeId) {
    const patchedCategories = categories.map((c) => {
      const scopes = getCategoryScopes(c);
      const hasData = hasDataInScopes(data, scopes);
      return hasData ? c : { ...c, isVisited: false, isCompleted: false, isValid: false };
    });

    const visibleCats = patchedCategories.filter((c) => c.visible);
    const completedCount = visibleCats.filter((c) => c.isValid && c.isCompleted).length;

    const tocProps: TocProps = {
      categories: patchedCategories,
      onClick: handleGoToPage,
      title: props.uischema?.options?.title,
      subtitle: props.uischema?.options?.subtitle,
      isValid: completedCount === visibleCats.length,
    };
    return <TaskList {...tocProps} />;
  }
  return <RenderPages categoryProps={props} />;
};

export const FormStepperPagesControl = withAjvProps(withTranslateProps(withJsonFormsLayoutProps(FormPageStepper)));

export default FormPageStepper;
export { getByJsonPointer, hasDataValue, getCategoryScopes, hasDataInScopes };
