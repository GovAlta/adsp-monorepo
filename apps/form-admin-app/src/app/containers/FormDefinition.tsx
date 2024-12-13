import { FunctionComponent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Route, Routes, useParams } from 'react-router-dom';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { AppDispatch, definitionSelector, formLoadingSelector, selectDefinition } from '../state';
import { Forms } from './Forms';
import { FormSubmissions } from './FormSubmissions';
import { FormSubmission } from './FormSubmission';
import { Form } from './Form';
import { ContentContainer } from '../components/ContentContainer';

export const FormDefinition: FunctionComponent = () => {
  const dispatch = useDispatch<AppDispatch>();

  const definition = useSelector(definitionSelector);
  const busy = useSelector(formLoadingSelector);

  const { definitionId: definitionIdValue } = useParams();
  const definitionId = definitionIdValue?.toLowerCase();

  useEffect(() => {
    dispatch(selectDefinition(definitionId));
  }, [dispatch, definitionId]);

  return definition ? (
    <Routes>
      <Route path="/submissions/:submissionId" element={<FormSubmission />} />
      <Route path="/forms/:formId" element={<Form />} />
      <Route
        path="/"
        element={
          <ContentContainer>
            {definition.submissionRecords ? (
              <FormSubmissions definitionId={definitionId} />
            ) : (
              <Forms definitionId={definitionId} />
            )}
          </ContentContainer>
        }
      />
    </Routes>
  ) : (
    <LoadingIndicator isLoading={busy} />
  );
};
