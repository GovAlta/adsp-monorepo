// clean-code-ignore: RULE-19 — covered by ./externalNavigationDefinition.spec.ts.
//
// The demo form is the template a tenant admin gets from "Add form" with the multi-page option
// checked. It is imported rather than copied so the demo cannot drift from the real default, and
// only two things are changed here:
//
//   variant: 'pages'   — the default template ships as a stepper; external navigation targets pages.
//   options.id         — authored page ids, on two of the three categories (see below).
import {
  defaultMultiPageFormSchema as schema,
  defaultMultiPageFormUiSchema as uischema,
} from '@core-services/app-common';
import { JsonSchema, UISchemaElement } from '@jsonforms/core';

/** form-service derives the definition id from the name via kebab-case, so these two agree by construction. */
export const EXTERNAL_NAVIGATION_DEFINITION_NAME = 'Sandbox external navigation';
export const EXTERNAL_NAVIGATION_DEFINITION_ID = 'sandbox-external-navigation';

export const EXTERNAL_NAVIGATION_DEFINITION_DESCRIPTION =
  'Multi-page demo form for external navigation from the sandbox app. Safe to delete.';

export const EXTERNAL_NAVIGATION_APPLICANT_ROLES = ['urn:ads:platform:form-service:form-applicant'];

// Category label -> authored page id. 'Upload Information' is deliberately left out: with no
// authored id it falls back to the positional `page-3`, which is the contrast the demo exists to
// show — a durable link beside one that moves when the pages are reordered.
export const AUTHORED_PAGE_IDS: Record<string, string> = {
  'Personal Information': 'personal-information',
  'Address Information': 'address-information',
};

// Control scope -> authored field id. As with the pages, only some controls get one, so the demo
// shows an id-addressed field next to a scope-addressed one. An id survives the underlying property
// being renamed in the data schema; a scope pointer does not.
export const AUTHORED_FIELD_IDS: Record<string, string> = {
  '#/properties/fullName': 'applicant-full-name',
  '#/properties/birthDate': 'applicant-birth-date',
  '#/properties/mailingAddress': 'applicant-mailing-address',
};

interface CategoryElement {
  label?: string;
  options?: Record<string, unknown>;
}

// Controls sit at arbitrary depth under a category, so the id has to be grafted on by walking the
// tree rather than by indexing into it. Everything is copied on the way down: the shared template
// must not be mutated.
const withFieldIds = (node: unknown): unknown => {
  if (Array.isArray(node)) {
    return node.map(withFieldIds);
  }

  if (!node || typeof node !== 'object') {
    return node;
  }

  const element = node as Record<string, unknown>;
  const copied = Object.entries(element).reduce<Record<string, unknown>>(
    (result, [key, value]) => ({ ...result, [key]: key === 'options' ? value : withFieldIds(value) }),
    {},
  );

  const fieldId = typeof element.scope === 'string' ? AUTHORED_FIELD_IDS[element.scope] : undefined;
  return fieldId ? { ...copied, options: { ...(element.options as object), id: fieldId } } : copied;
};

export const externalNavigationDataSchema = schema as JsonSchema;

export const externalNavigationUiSchema = {
  ...uischema,
  elements: uischema.elements.map((element: CategoryElement) => {
    const withIds = withFieldIds(element) as CategoryElement;
    const pageId = AUTHORED_PAGE_IDS[element.label];
    return pageId ? { ...withIds, options: { ...withIds.options, id: pageId } } : withIds;
  }),
  options: { ...uischema.options, variant: 'pages', showNavButtons: true },
} as unknown as UISchemaElement;
