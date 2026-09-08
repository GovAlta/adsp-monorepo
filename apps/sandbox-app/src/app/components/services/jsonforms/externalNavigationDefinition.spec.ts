import { getNavigationTargets } from '@abgov/jsonforms-components';
import { defaultMultiPageFormUiSchema as templateUiSchema } from '@core-services/app-common';
import {
  AUTHORED_FIELD_IDS,
  AUTHORED_PAGE_IDS,
  EXTERNAL_NAVIGATION_DEFINITION_ID,
  EXTERNAL_NAVIGATION_DEFINITION_NAME,
  externalNavigationDataSchema,
  externalNavigationUiSchema,
} from './externalNavigationDefinition';

describe('externalNavigationDefinition', () => {
  it('renders as pages rather than the template default stepper', () => {
    expect(templateUiSchema.options.variant).toBe('stepper');
    expect((externalNavigationUiSchema as { options: { variant: string } }).options.variant).toBe('pages');
  });

  it('keeps the definition id in step with the name form-service kebab-cases', () => {
    expect(EXTERNAL_NAVIGATION_DEFINITION_NAME.toLowerCase().replace(/\s+/g, '-')).toBe(
      EXTERNAL_NAVIGATION_DEFINITION_ID,
    );
  });

  it('carries over every page of the template', () => {
    const targets = getNavigationTargets(externalNavigationUiSchema);
    expect(targets).toHaveLength(templateUiSchema.elements.length);
  });

  it('names the pages listed in AUTHORED_PAGE_IDS and leaves the rest positional', () => {
    const targets = getNavigationTargets(externalNavigationUiSchema);

    for (const target of targets) {
      const expectedId = AUTHORED_PAGE_IDS[target.label];
      if (expectedId) {
        expect(target.authored).toBe(true);
        expect(target.pageId).toBe(expectedId);
      } else {
        expect(target.authored).toBe(false);
        expect(target.pageId).toMatch(/^page-\d+$/);
      }
    }
  });

  it('has both a named and a positional page so the contrast is demonstrable', () => {
    const targets = getNavigationTargets(externalNavigationUiSchema);
    expect(targets.some((target) => target.authored)).toBe(true);
    expect(targets.some((target) => !target.authored)).toBe(true);
  });

  it('exposes field scopes to link to', () => {
    const targets = getNavigationTargets(externalNavigationUiSchema);
    expect(targets.flatMap((target) => target.fields).length).toBeGreaterThan(0);
  });

  it('authors an id on the fields listed in AUTHORED_FIELD_IDS and leaves the rest scope-only', () => {
    const fields = getNavigationTargets(externalNavigationUiSchema).flatMap((target) => target.fields);

    for (const [scope, id] of Object.entries(AUTHORED_FIELD_IDS)) {
      expect(fields).toContainEqual({ scope, id });
    }
    expect(fields.some((field) => field.id === undefined)).toBe(true);
  });

  it('does not add field ids to the shared template', () => {
    const templateScopes = JSON.stringify(templateUiSchema);
    for (const id of Object.values(AUTHORED_FIELD_IDS)) {
      expect(templateScopes).not.toContain(id);
    }
  });

  it('leaves the template data schema untouched', () => {
    expect(externalNavigationDataSchema).toEqual(
      expect.objectContaining({ type: 'object', properties: expect.any(Object) }),
    );
  });

  it('does not mutate the shared template', () => {
    expect(templateUiSchema.elements.every((element) => element.options?.['id'] === undefined)).toBe(true);
  });
});
