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

export const ContextProvider = ContextProviderFactory();
export const JsonformsExampleOne = () => {
  const dispatch = useDispatch<AppDispatch>();

  const { definitionId } = useParams();

  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const tenant = useSelector(tenantSelector);
  const { definition, initialized: definitionInitialized } = useSelector(definitionSelector);
  const busy = useSelector(busySelector);

  useEffect(() => {
    if (tenant) {
      dispatch(selectedDefinition(definitionId));
    }
  }, [dispatch, definitionId, tenant]);

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
      <LoadingIndicator isLoading={!definitionInitialized || busy.loading} />
      <GoabContainer
        accent="thick"
        type="non-interactive"
        width={'full'}
        testId={'JsonformsExampleOneContainer'}
        heading={'Jsonforms example one'}
      >
        {definition && (
          <ContextProvider>
            <JsonForms
              key="example-form"
              ajv={ajvInstance}
              schema={definition.dataSchema}
              uischema={definition.uiSchema}
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
