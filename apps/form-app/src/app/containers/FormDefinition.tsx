import { FunctionComponent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom-6';
import {
  AppDispatch,
  busySelector,
  createForm,
  definitionSelector,
  formSelector,
  findUserForm,
  selectedDefinition,
} from '../state';
import { Form } from './Form';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { AuthorizeUser } from './AuthorizeUser';
import { StartApplication } from '../components/StartApplication';
import { ContinueApplication } from '../components/ContinueApplication';

interface FormDefinitionStartProps {
  definitionId: string;
}

const FormDefinitionStart: FunctionComponent<FormDefinitionStartProps> = ({ definitionId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(findUserForm(definitionId));
  }, [dispatch, definitionId]);

  const definition = useSelector(definitionSelector);
  const busy = useSelector(busySelector);
  const { initialized, form } = useSelector(formSelector);

  return (
    <>
      <LoadingIndicator isLoading={busy.loading} />
      {!busy.loading && initialized && definition && (
        <AuthorizeUser roles={[...definition.applicantRoles, ...definition.clerkRoles]}>
          {!form ? (
            <StartApplication definition={definition} onStart={() => dispatch(createForm(definitionId))} />
          ) : (
            <ContinueApplication definition={definition} form={form} onContinue={() => navigate(`${form.id}`)} />
          )}
        </AuthorizeUser>
      )}
    </>
  );
};

export const FormDefinition: FunctionComponent = () => {
  const { definitionId } = useParams();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(selectedDefinition(definitionId));
  }, [dispatch, definitionId]);

  return (
    <Routes>
      <Route path="/:formId" element={<Form />} />
      <Route path="/" element={<FormDefinitionStart definitionId={definitionId} />} />
      <Route path="*" element={<Navigate to={`/${definitionId}`} replace />} />
    </Routes>
  );
};
