// clean-code-ignore: RULE-19 — covered by ./JsonformsReviewResponsive.spec.tsx.
//
// Reproduction page for the review layout on narrow screens (CS-5478).
//
// The review is rendered on its own with values chosen to break it: long unbroken strings (a URL,
// an email, a reference number), a long label, an empty required field, an Alberta address with
// long lines, and object-array / list-with-detail rows. Open it with device emulation at 320–768px;
// the review should never be wider than the screen, and every Change link should stay visible.
import { useEffect, useMemo, useState } from 'react';
import { GoabContainer, GoabText } from '@abgov/react-components';
import {
  ContextProviderFactory,
  createDefaultAjv,
  GoACells,
  GoAReviewRenderers,
  tryResolveRefs,
} from '@abgov/jsonforms-components';
import { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { JsonForms } from '@jsonforms/react';
import { standardV1JsonSchema, commonV1JsonSchema } from '@abgov/data-exchange-standard';
import { ServiceContainer } from '../../styled-components';

const ContextProvider = ContextProviderFactory();

const LONG_URL =
  'https://www.alberta.ca/some-very-long-path/with-many-segments/that-never-breaks/applicant-supporting-documents?id=1234567890';
const LONG_EMAIL = 'firstname.middlename.lastname.department.branch@verylongsubdomain.alberta.gov.ab.ca';

const dataSchema = {
  type: 'object',
  properties: {
    fullName: { type: 'string' },
    website: { type: 'string' },
    emailAddress: { type: 'string', format: 'email' },
    referenceNumber: { type: 'string' },
    accommodationReason: {
      type: 'string',
      title:
        'Please describe the reason for the accommodations requested, including all supporting details and circumstances',
    },
    requiredMissing: { type: 'string', title: 'Required field left empty' },
    mailingAddress: { $ref: 'https://adsp.alberta.ca/common.v1.schema.json#/definitions/postalAddressAlberta' },
    dependents: {
      type: 'array',
      title: 'Dependents',
      items: {
        type: 'object',
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string' },
          notes: { type: 'string' },
        },
        required: ['firstName', 'lastName'],
      },
    },
    employmentHistory: {
      type: 'array',
      title: 'Employment history',
      items: {
        type: 'object',
        properties: { employer: { type: 'string' }, website: { type: 'string' } },
        required: ['employer'],
      },
    },
  },
  required: ['fullName', 'emailAddress', 'requiredMissing', 'mailingAddress', 'dependents'],
};

const control = (name: string) => ({ type: 'Control', scope: `#/properties/${name}` });

const uiSchema = {
  type: 'Categorization',
  elements: [
    {
      type: 'Category',
      label: 'Applicant details',
      elements: [
        'fullName',
        'website',
        'emailAddress',
        'referenceNumber',
        'accommodationReason',
        'requiredMissing',
      ].map(control),
    },
    { type: 'Category', label: 'Mailing address', elements: [control('mailingAddress')] },
    { type: 'Category', label: 'Dependents', elements: [control('dependents')] },
    {
      type: 'Category',
      label: 'Employment history',
      elements: [
        {
          ...control('employmentHistory'),
          options: {
            detail: { type: 'VerticalLayout', elements: [control('employer'), control('website')] },
          },
        },
      ],
    },
  ],
};

export const SAMPLE_DATA: Record<string, unknown> = {
  fullName: 'Alexandra-Catherine Montgomery-Fitzgerald-Worthington',
  website: LONG_URL,
  emailAddress: LONG_EMAIL,
  referenceNumber: 'REF-0000000000000000000000000000000000000000000000000001',
  accommodationReason: 'Supercalifragilisticexpialidocious-and-another-very-long-unbroken-token-to-force-overflow',
  mailingAddress: {
    addressLine1: 'Suite 1200, The Very Long Named Professional Building Tower North, 10180-101StreetNorthwestCorridor',
    addressLine2: 'Attention: Accounts-Receivable-and-Customer-Service-Department',
    municipality: 'Municipal District of Opportunity No. 17',
    subdivisionCode: 'AB',
    postalCode: 'T5J 3S4',
    country: 'CA',
  },
  dependents: [
    {
      firstName: 'Maximilian-Alexander',
      lastName: 'Montgomery-Fitzgerald-Worthington',
      email: LONG_EMAIL,
      notes: LONG_URL,
    },
    { firstName: 'Bo', lastName: 'Li', email: 'bo@example.com', notes: 'Short' },
    { firstName: '', lastName: '', email: '', notes: '' },
  ],
  employmentHistory: [
    { employer: 'The Very Long Named Corporation Of Northern Alberta Holdings Incorporated', website: LONG_URL },
    { employer: '', website: '' },
  ],
};

export const JsonformsReviewResponsive = (): JSX.Element => {
  const ajv = useMemo(() => createDefaultAjv(standardV1JsonSchema, commonV1JsonSchema), []);
  // The address lookup only renders once its $ref is resolved, the same as in form-app.
  const [schema, setSchema] = useState<JsonSchema>();

  useEffect(() => {
    tryResolveRefs(dataSchema as JsonSchema, standardV1JsonSchema, commonV1JsonSchema).then(([resolved]) =>
      setSchema(resolved),
    );
  }, []);

  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        width="full"
        testId="JsonformsReviewResponsiveContainer"
        heading="Review layout with long values"
      >
        <GoabText size="body-m" mb="m">
          Open this page at 320, 375, 390 and 768px. The review below should never be wider than the screen, long values
          should wrap, and every Change link should stay visible.
        </GoabText>
        {schema && (
          <ContextProvider showChangeButtons={true}>
            <JsonForms
              readonly={true}
              ajv={ajv}
              schema={schema}
              uischema={uiSchema as UISchemaElement}
              data={SAMPLE_DATA}
              validationMode="ValidateAndShow"
              renderers={GoAReviewRenderers}
              cells={GoACells}
            />
          </ContextProvider>
        )}
      </GoabContainer>
    </ServiceContainer>
  );
};
