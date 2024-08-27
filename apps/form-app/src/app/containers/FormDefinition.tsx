import { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AppDispatch,
  busySelector,
  createForm,
  definitionSelector,
  findUserForm,
  selectedDefinition,
  Form as FormObject,
  userFormSelector,
  tenantSelector,
} from '../state';
import { AnonymousForm } from './AnonymousForm';
import { AuthorizeUser } from './AuthorizeUser';
import { Form } from './Form';
import { AutoCreateApplication } from '../components/AutoCreateApplication';
import { ContinueApplication } from '../components/ContinueApplication';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { StartApplication } from '../components/StartApplication';

interface FormDefinitionStartProps {
  definitionId: string;
}

const FormDefinitionStart: FunctionComponent<FormDefinitionStartProps> = ({ definitionId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const definition = useSelector(definitionSelector);
  const busy = useSelector(busySelector);
  const { form, initialized } = useSelector(userFormSelector);
  const urlParams = new URLSearchParams(location.search);
  const AUTO_CREATE_PARAM = 'autoCreate';

  useEffect(() => {
    dispatch(findUserForm(definitionId));
  }, [dispatch, definitionId]);

  useEffect(() => {
    if (definition?.anonymousApply) {
      navigate('draft');
    }
  }, [navigate, definition]);

  return (
    <>
      <LoadingIndicator isLoading={!initialized} />
      {initialized && definition && (
        <AuthorizeUser roles={[...definition.applicantRoles, ...definition.clerkRoles]}>
          {!form && !urlParams.has(AUTO_CREATE_PARAM) ? (
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
          ) : urlParams.has(AUTO_CREATE_PARAM) && !form?.id ? (
            <AutoCreateApplication form={form} />
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
  const tenant = useSelector(tenantSelector);

  useEffect(() => {
    if (tenant) {
      dispatch(selectedDefinition(definitionId));
    }
  }, [dispatch, definitionId, tenant]);

  return (
    <Routes>
      <Route path="/draft" element={<AnonymousForm />} />
      <Route path="/:formId" element={<Form />} />
      <Route path="/" element={<FormDefinitionStart definitionId={definitionId} />} />
      <Route path="*" element={<Navigate to={`/${definitionId}`} replace />} />
    </Routes>
  );
};
