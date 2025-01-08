import { FunctionComponent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { AppDispatch, definitionSelector, busySelector, selectDefinition } from '../state';
import { Forms } from './Forms';
import { FormSubmissions } from './FormSubmissions';
import { FormSubmission } from './FormSubmission';
import { Form } from './Form';
import { FormDefinitionOverview } from './FormDefinitionOverview';

export const FormDefinition: FunctionComponent = () => {
  const dispatch = useDispatch<AppDispatch>();

  const definition = useSelector(definitionSelector);
  const busy = useSelector(busySelector);

  const { definitionId } = useParams();

  useEffect(() => {
    dispatch(selectDefinition(definitionId));
  }, [dispatch, definitionId]);

  return definition ? (
    <Routes>
      {definition.submissionRecords && (
        <>
          <Route path="/submissions/:submissionId" element={<FormSubmission />} />
          <Route path="/submissions" element={<FormSubmissions definitionId={definitionId} />} />
        </>
      )}
      <Route path="/forms/:formId" element={<Form />} />
      <Route path="/forms" element={<Forms definitionId={definitionId} />} />
      <Route path="/overview" element={<FormDefinitionOverview definitionId={definitionId} />} />
      <Route path="*" element={<Navigate to={definition.submissionRecords ? 'submissions' : 'forms'} />} />
    </Routes>
  ) : (
    <LoadingIndicator isLoading={busy.initializing} />
  );
};
