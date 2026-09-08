import { UISchemaElement } from '@jsonforms/core';
import { CategoriesState, CategoryState } from '../context/types';

export interface PageTarget {
  pageId: string;
}

export interface FieldTarget {
  pageId?: string;
  /** JSON pointer to the property, e.g. '#/properties/employer'. */
  scope?: string;
  /**
   * Authored `options.id` on the control. Resolved to that control's scope before navigating, so a
   * field id and a scope pointer behave identically from there on — including focus, which controls
   * key off scope.
   */
  fieldId?: string;
  instancePath?: string;
}

export type NavigationTarget = PageTarget | FieldTarget;

export type NavigationOutcome =
  | { status: 'navigated'; pageId: string }
  | { status: 'unavailable'; pageId: string; reason: 'hidden' | 'disabled' | 'not-yet-reachable' }
  | { status: 'unknown'; requested: NavigationTarget };

export type NavigationResolution =
  | { outcome: Extract<NavigationOutcome, { status: 'navigated' }>; index: number; scope?: string }
  | { outcome: Extract<NavigationOutcome, { status: 'unavailable' }>; index: number }
  | { outcome: Extract<NavigationOutcome, { status: 'unknown' }> };

export interface FieldInfo {
  scope: string;
  /** Present when the control carries an authored `options.id`. */
  id?: string;
}

export interface NavigationTargetInfo {
  pageId: string;
  label?: string;
  authored: boolean;
  index: number;
  fields: FieldInfo[];
}

const LEGACY_PAGE_ID = /^page-(\d+)$/;

const authoredIdFrom = (options: unknown): string | undefined => {
  const id = (options as Record<string, unknown> | undefined)?.id;
  return typeof id === 'string' && id.trim() ? id.trim() : undefined;
};

const authoredIdOf = (element: UISchemaElement | undefined): string | undefined => authoredIdFrom(element?.options);

const pageIdFor = (element: UISchemaElement | undefined, index: number): string =>
  authoredIdOf(element) ?? `page-${index + 1}`;

const labelOf = (element: UISchemaElement): string | undefined =>
  'label' in element && typeof element.label === 'string' ? element.label : undefined;

const getPageId = (category: CategoryState): string => pageIdFor(category.uischema, category.id);

// A ListWithDetail owns the layout below it, so its inner controls are not separately addressable;
// take the list's own scope and stop descending.
const LEAF_TYPE = 'ListWithDetail';

const collectFields = (node: unknown, collected: FieldInfo[] = []): FieldInfo[] => {
  if (!node || typeof node !== 'object') {
    return collected;
  }

  if (Array.isArray(node)) {
    node.forEach((child) => collectFields(child, collected));
    return collected;
  }

  const element = node as Record<string, unknown>;
  const scope = typeof element.scope === 'string' ? element.scope : undefined;
  if (scope) {
    collected.push({ scope, id: authoredIdFrom(element.options) });
  }

  if (element.type === LEAF_TYPE) {
    return collected;
  }

  Object.entries(element).forEach(([key, value]) => {
    // options holds configuration, not more of the schema tree; descending into it would pick up
    // anything that happens to be named scope.
    if (key !== 'options' && value && typeof value === 'object') {
      collectFields(value, collected);
    }
  });

  return collected;
};

const fieldsOf = (category: CategoryState): FieldInfo[] => collectFields(category.uischema);

const findByAuthoredId = (categories: CategoriesState, pageId: string): number =>
  categories.findIndex((category) => authoredIdOf(category.uischema) === pageId);

const findByLegacyId = (categories: CategoriesState, pageId: string): number => {
  const match = LEGACY_PAGE_ID.exec(pageId);
  const index = match ? Number(match[1]) - 1 : -1;
  return index >= 0 && index < categories.length ? index : -1;
};

const findByScope = (categories: CategoriesState, scope: string): number =>
  categories.findIndex((category) => category.scopes.includes(scope));

// An authored field id is looked up across the whole form, not just the requested page, so a host
// that knows only the field id does not have to know which page it currently lives on.
const findByFieldId = (categories: CategoriesState, fieldId: string): { index: number; scope: string } | undefined => {
  for (let index = 0; index < categories.length; index++) {
    const match = fieldsOf(categories[index]).find((field) => field.id === fieldId);
    if (match) {
      return { index, scope: match.scope };
    }
  }

  return undefined;
};

const targetScope = (target: NavigationTarget): string | undefined =>
  'scope' in target && typeof target.scope === 'string' ? target.scope : undefined;

const targetFieldId = (target: NavigationTarget): string | undefined =>
  'fieldId' in target && typeof target.fieldId === 'string' ? target.fieldId : undefined;

export const resolveNavigationTarget = (
  categories: CategoriesState,
  target: NavigationTarget,
): NavigationResolution => {
  const scope = targetScope(target);
  const fieldId = targetFieldId(target);
  const pageId = target.pageId;

  const fieldMatch = fieldId ? findByFieldId(categories, fieldId) : undefined;

  let index = pageId ? findByAuthoredId(categories, pageId) : -1;

  if (index < 0 && pageId) {
    index = findByLegacyId(categories, pageId);
  }

  if (index < 0 && fieldMatch) {
    index = fieldMatch.index;
  }

  if (index < 0 && scope) {
    index = findByScope(categories, scope);
  }

  if (index < 0) {
    return { outcome: { status: 'unknown', requested: target } };
  }

  const category = categories[index];
  const resolvedPageId = getPageId(category);

  if (category.visible === false) {
    return { outcome: { status: 'unavailable', pageId: resolvedPageId, reason: 'hidden' }, index };
  }

  if (category.isEnabled === false) {
    return { outcome: { status: 'unavailable', pageId: resolvedPageId, reason: 'disabled' }, index };
  }

  // An explicit scope wins over a field id, so a caller passing both gets what it asked for.
  return { outcome: { status: 'navigated', pageId: resolvedPageId }, index, scope: scope ?? fieldMatch?.scope };
};

export const getNavigationTargets = (uischema: UISchemaElement): NavigationTargetInfo[] => {
  const elements = 'elements' in uischema ? uischema.elements : undefined;

  if (!Array.isArray(elements)) {
    return [];
  }

  return elements.map((element, index) => ({
    pageId: pageIdFor(element, index),
    label: labelOf(element),
    authored: authoredIdOf(element) !== undefined,
    index,
    fields: collectFields(element),
  }));
};

/**
 * Query parameter names carried by an external navigation link. Exported so a host that has to
 * parse or strip them by hand is not guessing at string literals.
 */
export const NAVIGATION_PARAMS = {
  page: 'page',
  field: 'field',
  fieldId: 'fieldId',
} as const;

const fieldFor = (targets: NavigationTargetInfo[], scope: string): FieldInfo | undefined =>
  targets.flatMap((target) => target.fields).find((field) => field.scope === scope);

/**
 * Builds the link that sends a user from somewhere outside a form to a page or field inside it.
 *
 * Hosts get this for free rather than re-deriving the parameter names and the id-versus-scope rule
 * for every summary or task list they build. A scope whose control carries an authored id is
 * written as that id, which survives the underlying property being renamed.
 *
 * @param uischema the form's ui schema, used to resolve the step index and look up authored ids
 * @param url the form's address in the application that hosts it
 * @param stepId index of the page, as reported by the review renderers
 * @param scope JSON pointer of the field being changed
 * @returns the link, or undefined when neither a page nor a field could be addressed
 */
export const getExternalFormPath = (
  uischema: UISchemaElement,
  url: string,
  stepId?: number,
  scope?: string,
): string | undefined => {
  if (!url) {
    return undefined;
  }

  const targets = getNavigationTargets(uischema);
  const pageId = stepId === undefined ? undefined : targets[stepId]?.pageId;
  const field = scope ? fieldFor(targets, scope) : undefined;

  if (!pageId && !scope) {
    return undefined;
  }

  const params = new URLSearchParams();
  if (pageId) {
    params.set(NAVIGATION_PARAMS.page, pageId);
  }
  if (field?.id) {
    params.set(NAVIGATION_PARAMS.fieldId, field.id);
  } else if (scope) {
    params.set(NAVIGATION_PARAMS.field, scope);
  }

  return `${url}?${params.toString()}`;
};

/**
 * The other half of getExternalFormPath: turns the parameters back into a target for the form to
 * consume. The library still never reads the address bar — the host passes in what it found.
 */
export const getNavigationTargetFromParams = (params: URLSearchParams): NavigationTarget | undefined => {
  const pageId = params.get(NAVIGATION_PARAMS.page) ?? undefined;
  const scope = params.get(NAVIGATION_PARAMS.field) ?? undefined;
  const fieldId = params.get(NAVIGATION_PARAMS.fieldId) ?? undefined;

  if (scope || fieldId) {
    return { pageId, scope, fieldId };
  }

  return pageId ? { pageId } : undefined;
};
