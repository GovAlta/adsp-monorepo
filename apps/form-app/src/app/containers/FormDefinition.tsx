import { FunctionComponent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AppDispatch,
  definitionSelector,
  findUserForms,
  Form as FormObject,
  FormDefinition as FormDefinitionObject,
  selectedDefinition,
  defaultUserFormSelector,
  tenantSelector,
  busySelector,
  createForm,
  userSelector,
} from '../state';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { ScheduledIntake } from '../components/ScheduledIntake';
import { SignInStartApplication } from '../components/SignInStartApplication';
import { AnonymousForm } from './AnonymousForm';
import { Form } from './Form';
import { ContinueApplication } from '../components/ContinueApplication';
import { StartApplication } from '../components/StartApplication';
import { FormNotAvailable } from '../components/FormNoAvailable';
import { Forms } from './Forms';

interface FormDefinitionStart {
  definition: FormDefinitionObject;
}

export const FormDefinitionStart: FunctionComponent<FormDefinitionStart> = ({ definition }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const AUTO_CREATE_PARAM = 'autoCreate';

  const { initialized, form, empty } = useSelector(defaultUserFormSelector);
  const busy = useSelector(busySelector);

  return definition.anonymousApply ? (
    <Navigate to="draft" />
  ) : (
    initialized &&
      (form?.id ? (
        <ContinueApplication definition={definition} form={form} onContinue={() => navigate(`${form.id}`)} />
      ) : empty ? (
        <StartApplication
          definition={definition}
          autoCreate={urlParams.has(AUTO_CREATE_PARAM, 'true')}
          canCreate={!busy.creating}
          onCreate={async () => {
            const { payload } = await dispatch(createForm(definition.id));
            const form = payload as FormObject;
            if (form?.id) {
              navigate(`${form.id}`);
            }
          }}
        />
      ) : (
        <Navigate to="forms" />
      ))
  );
};

export const FormDefinition: FunctionComponent = () => {
  const dispatch = useDispatch<AppDispatch>();

  const { definitionId } = useParams();

  const tenant = useSelector(tenantSelector);
  const { user } = useSelector(userSelector);
  const { definition, initialized: definitionInitialized } = useSelector(definitionSelector);
  const busy = useSelector(busySelector);

  useEffect(() => {
    if (tenant) {
      dispatch(selectedDefinition(definitionId));
    }
  }, [dispatch, definitionId, tenant]);

  useEffect(() => {
    if (definition && user) {
      dispatch(findUserForms({ definitionId: definition.id }));
    }
  }, [dispatch, definition, user]);

  // Definition can be available even if there is no signed in user.
  // If definition is not available, then show the sign-in option as user might have access if they sign in.
  return (
    <>
      <LoadingIndicator isLoading={!definitionInitialized || busy.loading} />
      {definitionInitialized &&
        (definition ? (
          <ScheduledIntake definition={definition}>
            <Routes>
              <Route path="/draft" element={<AnonymousForm />} />
              <Route path="/forms" element={<Forms definition={definition} />} />{' '}
              <Route path="/:formId" element={<Form />} />
              <Route path="/" element={<FormDefinitionStart definition={definition} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </ScheduledIntake>
        ) : user ? (
          <FormNotAvailable />
        ) : (
          <SignInStartApplication />
        ))}
    </>
  );
};
