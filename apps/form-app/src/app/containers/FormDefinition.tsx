import { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import {
  AppDispatch,
  busySelector,
  createForm,
  definitionSelector,
  findUserForm,
  selectedDefinition,
  Form as FormObject,
  userFormSelector,
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
  const { form, initialized } = useSelector(userFormSelector);

  return (
    <>
      <LoadingIndicator isLoading={!initialized} />
      {initialized && definition && (
        <AuthorizeUser roles={[...definition.applicantRoles, ...definition.clerkRoles]}>
          {!form ? (
            <StartApplication
              definition={definition}
              canStart={!busy.creating}
              onStart={async () => {
                const { payload } = await dispatch(createForm(definitionId));
                const form = payload as FormObject;
                if (form?.id) {
                  navigate(`${form.id}`);
                }
              }}
            />
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
