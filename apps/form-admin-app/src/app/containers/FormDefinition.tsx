import { FunctionComponent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { AppDispatch, definitionSelector, formBusySelector, selectDefinition } from '../state';
import { Responses } from './Responses';
import { ResponseDetails } from './ResponseDetails';
import { FormDefinitionOverview } from './FormDefinitionOverview';

const DefinitionLayout = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
`;

const DefinitionHeader = styled.header`
  flex: 0 0 auto;
  padding: var(--goa-space-m) var(--goa-space-l);
  border-bottom: 1px solid var(--goa-color-greyscale-200);

  h2 {
    margin: 0;
    font: var(--goa-typography-heading-l);
  }
`;

// The pages of a definition lay themselves out against this element, so it is the positioned
// ancestor that keeps them below the header rather than behind it.
const DefinitionContent = styled.div`
  flex: 1;
  min-height: 0;
  position: relative;
`;

// Redirects the routes of the separate form and submission lists to the combined responses list.
const RedirectToResponse: FunctionComponent = () => {
  const { formId } = useParams();
  return <Navigate to={formId ? `../responses/${formId}` : '../responses'} replace />;
};

export const FormDefinition: FunctionComponent = () => {
  const dispatch = useDispatch<AppDispatch>();

  const definition = useSelector(definitionSelector);
  const busy = useSelector(formBusySelector);

  const { definitionId } = useParams();

  useEffect(() => {
    dispatch(selectDefinition(definitionId));
  }, [dispatch, definitionId]);

  return definition ? (
    <DefinitionLayout>
      <DefinitionHeader>
        <h2 data-testid="definition-heading">Form Definition: {definition.name}</h2>
      </DefinitionHeader>
      <DefinitionContent>
        <Routes>
          <Route path="/responses/:formId" element={<ResponseDetails />} />
          <Route path="/responses" element={<Responses definitionId={definitionId} />} />
          <Route path="/configuration" element={<FormDefinitionOverview definitionId={definitionId} />} />
          <Route path="/forms/:formId" element={<RedirectToResponse />} />
          <Route path="/forms" element={<RedirectToResponse />} />
          <Route path="/submissions/*" element={<RedirectToResponse />} />
          <Route path="/overview" element={<Navigate to="../configuration" replace />} />
          <Route path="*" element={<Navigate to="responses" />} />
        </Routes>
      </DefinitionContent>
    </DefinitionLayout>
  ) : (
    <LoadingIndicator isLoading={busy.initializing} />
  );
};
