import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AppDispatch, busySelector, definitionSelector, selectedDefinition, tenantSelector } from '../../../state';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { LoadingIndicator } from '../../LoadingIndicator';
import { ServiceContainer } from '../../styled-components';
import { GoabContainer } from '@abgov/react-components';
import { JsonForms } from '@jsonforms/react';
import { ContextProviderFactory, createDefaultAjv, GoACells, GoARenderers } from '@abgov/jsonforms-components';
import { ErrorObject } from 'ajv';
import { JsonSchema, UISchemaElement } from '@jsonforms/core';

export const ContextProvider = ContextProviderFactory();

const CONTROL_EXAMPLES_DEFINITION_ID = 'control-examples';

const controlExamplesDefinition: {
  id: string;
  name: string;
  dataSchema: JsonSchema;
  uiSchema: UISchemaElement;
} = {
  id: CONTROL_EXAMPLES_DEFINITION_ID,
  name: 'JSONForms control examples',
  dataSchema: {
    type: 'object',
    properties: {
      fullName: {
        type: 'string',
        title: 'Full name',
      },
      email: {
        type: 'string',
        format: 'email',
        title: 'Email',
      },
      startDate: {
        type: 'string',
        format: 'date',
        title: 'Start date',
      },
      appointmentTime: {
        type: 'string',
        format: 'time',
        title: 'Appointment time',
      },
      serviceType: {
        type: 'string',
        title: 'Service type',
        enum: ['Information request', 'Application support', 'Technical help'],
      },
      contactMethod: {
        type: 'string',
        title: 'Preferred contact method',
        enum: ['Email', 'Phone'],
      },
      consent: {
        type: 'boolean',
        title: 'Consent',
      },
      comments: {
        type: 'string',
        title: 'Comments',
      },
    },
    required: ['fullName', 'email', 'startDate', 'serviceType', 'consent'],
  },
  uiSchema: {
    type: 'VerticalLayout',
    elements: [
      {
        type: 'Control',
        scope: '#/properties/fullName',
      },
      {
        type: 'Control',
        scope: '#/properties/email',
      },
      {
        type: 'Control',
        scope: '#/properties/startDate',
      },
      {
        type: 'Control',
        scope: '#/properties/appointmentTime',
      },
      {
        type: 'Control',
        scope: '#/properties/serviceType',
      },
      {
        type: 'Control',
        scope: '#/properties/contactMethod',
        options: {
          format: 'radio',
        },
      },
      {
        type: 'Control',
        scope: '#/properties/consent',
        options: {
          text: 'I agree to be contacted about this request.',
        },
      },
      {
        type: 'Control',
        scope: '#/properties/comments',
        options: {
          multi: true,
        },
      },
    ],
  },
};

export const JsonformsExampleOne = () => {
  const dispatch = useDispatch<AppDispatch>();

  const { definitionId } = useParams();
  const isControlExamples = definitionId === CONTROL_EXAMPLES_DEFINITION_ID;

  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const tenant = useSelector(tenantSelector);
  const { definition, initialized: definitionInitialized } = useSelector(definitionSelector);
  const busy = useSelector(busySelector);
  const currentDefinition = isControlExamples ? controlExamplesDefinition : definition;
  const currentDefinitionInitialized = isControlExamples || definitionInitialized;

  useEffect(() => {
    if (tenant && !isControlExamples) {
      dispatch(selectedDefinition(definitionId));
    }
  }, [dispatch, definitionId, isControlExamples, tenant]);

  // Memoize the ajv instance to prevent recreation on every render
  const ajvInstance = useMemo(() => createDefaultAjv(), []);

  // Memoize renderers and cells to prevent recreation
  const memoizedRenderers = useMemo(() => GoARenderers, []);
  const memoizedCells = useMemo(() => GoACells, []);

  const handleFormChange = useCallback(({ data }: { data: Record<string, unknown>; errors?: ErrorObject[] }) => {
    setFormData(data);
  }, []);

  return (
    <ServiceContainer>
      <LoadingIndicator isLoading={!currentDefinitionInitialized || busy.loading} />
      <GoabContainer
        accent="thick"
        type="non-interactive"
        width={'full'}
        testId={'JsonformsExampleOneContainer'}
        heading={currentDefinition?.name || 'Jsonforms example one'}
      >
        {currentDefinition && (
          <ContextProvider>
            <JsonForms
              key="example-form"
              ajv={ajvInstance}
              schema={currentDefinition.dataSchema}
              uischema={currentDefinition.uiSchema}
              readonly={false}
              data={formData}
              renderers={memoizedRenderers}
              cells={memoizedCells}
              validationMode="ValidateAndShow"
              onChange={handleFormChange}
            />
          </ContextProvider>
        )}
      </GoabContainer>
    </ServiceContainer>
  );
};
