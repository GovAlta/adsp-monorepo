import { FormDefinition } from './types';
import { mapFormDefinition } from './mapper';

describe('mapFormDefinition', () => {
  const definition = {
    id: 'test',
    name: 'Test form',
    description: 'desc',
    anonymousApply: false,
    oneFormPerApplicant: true,
    applicantRoles: [],
    assessorRoles: [],
    clerkRoles: [],
    formDraftUrlTemplate: 'https://example.com/{{id}}',
    dataSchema: {},
    uiSchema: {},
    dispositionStates: [],
    submissionPdfTemplate: null,
    submissionRecords: false,
    scheduledIntakes: false,
    supportTopic: false,
    registeredId: null,
  } as FormDefinition;

  it('maps an empty review configuration when none is set', () => {
    const mapped = mapFormDefinition(definition, 1);

    expect(mapped.reviewConfiguration).toEqual({ columns: [] });
  });

  it('maps the review configuration from the definition', () => {
    const reviewConfiguration = { columns: [{ path: 'firstName' }, { path: 'lastName' }] };
    const mapped = mapFormDefinition({ ...definition, reviewConfiguration }, 2);

    expect(mapped.reviewConfiguration).toEqual(reviewConfiguration);
    expect(mapped.revision).toBe(2);
  });
});
