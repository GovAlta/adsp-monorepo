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
  FormStatus,
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
  user: ReturnType<typeof userSelector>['user'];
}

export const FormDefinitionStart: FunctionComponent<FormDefinitionStart> = ({ definition, user }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const AUTO_CREATE_PARAM = 'autoCreate';

  const { initialized, form, ambiguous } = useSelector(defaultUserFormSelector);
  const busy = useSelector(busySelector);

  useEffect(() => {
    if (definition && user) {
      dispatch(findUserForms({ definitionId: definition.id }));
    }
  }, [dispatch, definition, user]);

  if (initialized && definition && definition.oneFormPerApplicant === false) {
    return <Navigate to="forms" />;
  }

  if (initialized && form?.id && form.status === FormStatus.submitted) {
    return <Navigate to={`${form.id}`} />;
  }

  return definition.anonymousApply ? (
    <Navigate to="draft" />
  ) : (
    initialized &&
      (form?.id ? (
        <ContinueApplication definition={definition} form={form} onContinue={() => navigate(`${form.id}`)} />
      ) : ambiguous ? (
        <Navigate to="forms" />
      ) : (
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
              <Route path="/forms" element={<Forms definition={definition} />} />
              <Route path="/:formId" element={<Form />} />
              <Route path="/" element={<FormDefinitionStart definition={definition} user={user} />} />
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
