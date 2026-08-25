import { Categorization, Category } from '@jsonforms/core';
import { StepStatus } from '../../../common/Constants';
import { CategoryState } from '../context/types';
import {
  getExternalFormPath,
  getNavigationTargetFromParams,
  getNavigationTargets,
  resolveNavigationTarget,
} from './navigationTarget';

const buildCategory = (
  id: number,
  pageId: string | undefined,
  scope: string,
  overrides: Partial<CategoryState> = {},
  fieldId?: string,
): CategoryState => ({
  id,
  label: `Page ${id + 1}`,
  scopes: [scope],
  status: StepStatus.NOT_STARTED,
  visible: true,
  isEnabled: true,
  uischema: {
    type: 'Category',
    label: `Page ${id + 1}`,
    options: pageId ? { id: pageId } : undefined,
    // Nested a layout deep so the field walk is exercised, not just a flat elements array.
    elements: [
      { type: 'VerticalLayout', elements: [{ type: 'Control', scope, options: fieldId ? { id: fieldId } : undefined }] },
    ],
  } as Category,
  ...overrides,
});

const categories = [
  buildCategory(0, 'personal-details', '#/properties/firstName'),
  buildCategory(1, 'contact-details', '#/properties/email'),
];

describe('resolveNavigationTarget', () => {
  test('finds an authored page id after pages are reordered', () => {
    // Arrange
    const reordered = [categories[1], categories[0]];

    // Act
    const resolution = resolveNavigationTarget(reordered, { pageId: 'personal-details' });

    // Assert
    expect(resolution).toEqual({ outcome: { status: 'navigated', pageId: 'personal-details' }, index: 1 });
  });

  test('prefers an authored id that looks like a positional fallback', () => {
    // Arrange
    const authoredPage = buildCategory(0, 'page-2', '#/properties/firstName');
    const secondPage = buildCategory(1, undefined, '#/properties/email');

    // Act
    const resolution = resolveNavigationTarget([authoredPage, secondPage], { pageId: 'page-2' });

    // Assert
    expect(resolution).toEqual({ outcome: { status: 'navigated', pageId: 'page-2' }, index: 0 });
  });

  test('supports a positional fallback for definitions without authored ids', () => {
    // Arrange
    const legacyCategories = [
      buildCategory(0, undefined, '#/properties/firstName'),
      buildCategory(1, undefined, '#/properties/email'),
    ];

    // Act
    const resolution = resolveNavigationTarget(legacyCategories, { pageId: 'page-2' });

    // Assert
    expect(resolution).toEqual({ outcome: { status: 'navigated', pageId: 'page-2' }, index: 1 });
  });

  test('rejects a positional fallback outside the definition', () => {
    // Arrange
    const target = { pageId: 'page-9' };

    // Act
    const resolution = resolveNavigationTarget(categories, target);

    // Assert
    expect(resolution).toEqual({ outcome: { status: 'unknown', requested: target } });
  });

  test('finds the page that owns a field scope', () => {
    // Arrange
    const target = { scope: '#/properties/email' };

    // Act
    const resolution = resolveNavigationTarget(categories, target);

    // Assert
    expect(resolution).toEqual({
      outcome: { status: 'navigated', pageId: 'contact-details' },
      index: 1,
      scope: '#/properties/email',
    });
  });

  test('uses the field scope when a requested page no longer exists', () => {
    // Arrange
    const target = { pageId: 'old-contact-page', scope: '#/properties/email' };

    // Act
    const resolution = resolveNavigationTarget(categories, target);

    // Assert
    expect(resolution).toEqual({
      outcome: { status: 'navigated', pageId: 'contact-details' },
      index: 1,
      scope: '#/properties/email',
    });
  });

  test('reports a hidden page as unavailable', () => {
    // Arrange
    const hiddenCategories = [categories[0], { ...categories[1], visible: false }];

    // Act
    const resolution = resolveNavigationTarget(hiddenCategories, { pageId: 'contact-details' });

    // Assert
    expect(resolution).toEqual({
      outcome: { status: 'unavailable', pageId: 'contact-details', reason: 'hidden' },
      index: 1,
    });
  });

  test('reports a disabled page as unavailable', () => {
    // Arrange
    const disabledCategories = [categories[0], { ...categories[1], isEnabled: false }];

    // Act
    const resolution = resolveNavigationTarget(disabledCategories, { pageId: 'contact-details' });

    // Assert
    expect(resolution).toEqual({
      outcome: { status: 'unavailable', pageId: 'contact-details', reason: 'disabled' },
      index: 1,
    });
  });
});

describe('getNavigationTargets', () => {
  test('discovers authored page ids and their field scopes', () => {
    // Arrange
    const uischema = {
      type: 'Categorization',
      elements: categories.map((category) => category.uischema),
    } as Categorization;

    // Act
    const targets = getNavigationTargets(uischema);

    // Assert
    expect(targets).toEqual([
      {
        pageId: 'personal-details',
        label: 'Page 1',
        authored: true,
        index: 0,
        fields: [{ scope: '#/properties/firstName', id: undefined }],
      },
      {
        pageId: 'contact-details',
        label: 'Page 2',
        authored: true,
        index: 1,
        fields: [{ scope: '#/properties/email', id: undefined }],
      },
    ]);
  });

  test('labels pages without authored ids as positional targets', () => {
    // Arrange
    const uischema = {
      type: 'Categorization',
      elements: [buildCategory(0, undefined, '#/properties/firstName').uischema],
    } as Categorization;

    // Act
    const targets = getNavigationTargets(uischema);

    // Assert
    expect(targets[0]).toEqual({
      pageId: 'page-1',
      label: 'Page 1',
      authored: false,
      index: 0,
      fields: [{ scope: '#/properties/firstName', id: undefined }],
    });
  });

  test('returns no targets for a schema without pages', () => {
    // Arrange
    const uischema = { type: 'Control', scope: '#/properties/firstName' };

    // Act
    const targets = getNavigationTargets(uischema);

    // Assert
    expect(targets).toEqual([]);
  });
});

describe('authored field ids', () => {
  const withFieldIds = [
    buildCategory(0, 'personal-details', '#/properties/firstName', {}, 'applicant-first-name'),
    buildCategory(1, 'contact-details', '#/properties/email', {}, 'applicant-email'),
  ];

  test('navigates to the page owning the field and focuses it by scope', () => {
    // Act
    const resolution = resolveNavigationTarget(withFieldIds, { fieldId: 'applicant-email' });

    // Assert
    expect(resolution).toEqual({
      outcome: { status: 'navigated', pageId: 'contact-details' },
      index: 1,
      scope: '#/properties/email',
    });
  });

  test('finds a field id after its page is reordered', () => {
    // Arrange
    const reordered = [withFieldIds[1], withFieldIds[0]];

    // Act
    const resolution = resolveNavigationTarget(reordered, { fieldId: 'applicant-first-name' });

    // Assert
    expect(resolution).toMatchObject({ index: 1, scope: '#/properties/firstName' });
  });

  test('survives the underlying property being renamed', () => {
    // Arrange — same authored id, different scope than the link was written against.
    const renamed = [buildCategory(0, 'personal-details', '#/properties/legalName', {}, 'applicant-first-name')];

    // Act
    const resolution = resolveNavigationTarget(renamed, { fieldId: 'applicant-first-name' });

    // Assert
    expect(resolution).toMatchObject({ index: 0, scope: '#/properties/legalName' });
  });

  test('reports an unknown field id rather than guessing', () => {
    // Act
    const resolution = resolveNavigationTarget(withFieldIds, { fieldId: 'not-a-field' });

    // Assert
    expect(resolution).toEqual({ outcome: { status: 'unknown', requested: { fieldId: 'not-a-field' } } });
  });

  test('still navigates when the page is known but the field id is not', () => {
    // Act
    const resolution = resolveNavigationTarget(withFieldIds, { pageId: 'contact-details', fieldId: 'not-a-field' });

    // Assert
    expect(resolution).toMatchObject({ outcome: { status: 'navigated', pageId: 'contact-details' }, index: 1 });
    expect((resolution as { scope?: string }).scope).toBeUndefined();
  });

  test('prefers an explicit scope over a field id when both are given', () => {
    // Act
    const resolution = resolveNavigationTarget(withFieldIds, {
      scope: '#/properties/firstName',
      fieldId: 'applicant-email',
    });

    // Assert
    expect(resolution).toMatchObject({ scope: '#/properties/firstName' });
  });

  test('does not resolve a hidden page through its field id', () => {
    // Arrange
    const hidden = [buildCategory(0, 'personal-details', '#/properties/firstName', { visible: false }, 'applicant-first-name')];

    // Act
    const resolution = resolveNavigationTarget(hidden, { fieldId: 'applicant-first-name' });

    // Assert
    expect(resolution).toEqual({
      outcome: { status: 'unavailable', pageId: 'personal-details', reason: 'hidden' },
      index: 0,
    });
  });

  test('reports field ids alongside scopes for host discovery', () => {
    // Arrange
    const uischema = {
      type: 'Categorization',
      elements: [
        {
          type: 'Category',
          label: 'Personal details',
          options: { id: 'personal-details' },
          elements: [
            {
              type: 'VerticalLayout',
              elements: [
                { type: 'Control', scope: '#/properties/firstName', options: { id: 'applicant-first-name' } },
                { type: 'Control', scope: '#/properties/lastName' },
              ],
            },
          ],
        },
      ],
    } as unknown as Categorization;

    // Act
    const [target] = getNavigationTargets(uischema);

    // Assert
    expect(target.fields).toEqual([
      { scope: '#/properties/firstName', id: 'applicant-first-name' },
      { scope: '#/properties/lastName', id: undefined },
    ]);
  });
});

describe('getExternalFormPath', () => {
  const uischema = {
    type: 'Categorization',
    elements: [
      {
        type: 'Category',
        label: 'Personal details',
        options: { id: 'personal-details' },
        elements: [
          {
            type: 'VerticalLayout',
            elements: [
              { type: 'Control', scope: '#/properties/firstName', options: { id: 'applicant-first-name' } },
              { type: 'Control', scope: '#/properties/lastName' },
            ],
          },
        ],
      },
      { type: 'Category', label: 'Contact details', elements: [{ type: 'Control', scope: '#/properties/email' }] },
    ],
  } as unknown as Categorization;

  const url = 'https://form.test/autotest/demo/form-1';

  test('writes a field with an authored id as that id', () => {
    // Act
    const path = getExternalFormPath(uischema, url, 0, '#/properties/firstName');

    // Assert
    expect(path).toBe(`${url}?page=personal-details&fieldId=applicant-first-name`);
  });

  test('falls back to the scope pointer for a control without an id', () => {
    // Act
    const path = getExternalFormPath(uischema, url, 0, '#/properties/lastName');

    // Assert
    expect(path).toBe(`${url}?page=personal-details&field=%23%2Fproperties%2FlastName`);
    expect(new URL(path).searchParams.get('field')).toBe('#/properties/lastName');
  });

  test('addresses a page on its own when no scope is given', () => {
    // Act & Assert
    expect(getExternalFormPath(uischema, url, 1)).toBe(`${url}?page=page-2`);
  });

  test('addresses a field on its own when no step is given', () => {
    // Act & Assert
    expect(getExternalFormPath(uischema, url, undefined, '#/properties/email')).toBe(
      `${url}?field=%23%2Fproperties%2Femail`,
    );
  });

  test('returns undefined when there is nothing to address', () => {
    // Act & Assert
    expect(getExternalFormPath(uischema, url)).toBeUndefined();
    expect(getExternalFormPath(uischema, '', 0)).toBeUndefined();
  });

  test('round trips through getNavigationTargetFromParams', () => {
    // Arrange
    const path = getExternalFormPath(uischema, url, 0, '#/properties/firstName');

    // Act
    const target = getNavigationTargetFromParams(new URL(path).searchParams);

    // Assert
    expect(target).toEqual({ pageId: 'personal-details', scope: undefined, fieldId: 'applicant-first-name' });
    expect(resolveNavigationTarget(categories, { pageId: 'personal-details' })).toMatchObject({ index: 0 });
  });

  test('reads nothing out of an unrelated query string', () => {
    // Act & Assert
    expect(getNavigationTargetFromParams(new URLSearchParams('?other=1'))).toBeUndefined();
  });
});
