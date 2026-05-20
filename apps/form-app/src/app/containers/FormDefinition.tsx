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
import { Forms } from './Forms';
import { FormDoesNotExist } from '../components/FormDoesNotExist';

interface FormDefinitionStart {
  definition: FormDefinitionObject;
  user: ReturnType<typeof userSelector>['user'];
}

export const getVersionFromSearch = (search: string): number | undefined => {
  const versionParam = new URLSearchParams(search).get('version');
  const version = Number(versionParam);

  return versionParam !== null && !Number.isNaN(version) ? version : undefined;
};

export const FormDefinitionStart: FunctionComponent<FormDefinitionStart> = ({ definition, user }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const AUTO_CREATE_PARAM = 'autoCreate';

  const versionParam = urlParams.get('version');

  const version = getVersionFromSearch(location.search);

  const { initialized, form, ambiguous } = useSelector(defaultUserFormSelector);
  const busy = useSelector(busySelector);
  const hasSubmittedForm = initialized && form?.id && form?.status === FormStatus.submitted;

  useEffect(() => {
    if (definition?.id && user) {
      // clean-code-ignore: 2.5
      dispatch(findUserForms({ definitionId: definition.id, version: version }));
    }
  }, [dispatch, definition?.id, user?.id]);

  if (initialized && definition && definition.oneFormPerApplicant === false) {
    return <Navigate to="forms" />;
  }

  if (hasSubmittedForm) {
    return <Navigate to={`${form.id}`} />;
  }

  const getVersionQuery = () => (version !== undefined ? `?version=${version}` : '');

  const renderContinueApplication = () => (
    <ContinueApplication
      definition={definition}
      form={form}
      onContinue={() => navigate(`${form.id}${getVersionQuery()}`)}
    />
  );

  const renderNavigateToForms = () => <Navigate to="forms" />;

  const renderStartApplication = () => (
    <StartApplication
      definition={definition}
      autoCreate={urlParams.get(AUTO_CREATE_PARAM) === 'true'}
      canCreate={!busy.creating}
      onCreate={async () => {
        const { payload } = await dispatch(createForm({ definitionId: definition.id, version }));
        const form = payload as FormObject;

        if (form?.id) {
          navigate(`${form.id}${getVersionQuery()}`);
        }
      }}
    />
  );

  const renderApplicationStart = () => {
    if (definition.anonymousApply) {
      return <Navigate to="draft" />;
    }
    if (!initialized) return null;
    if (form?.id) return renderContinueApplication();
    if (ambiguous) return renderNavigateToForms();
    return renderStartApplication();
  };

  return renderApplicationStart();
};

// clean-code-ignore: 2.16, 2.18, 2.15, 2.17, 2.3, 2.10
export const SelectedFormDefinitionContainer: FunctionComponent = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { definitionId } = useParams();
  const location = useLocation();
  const tenant = useSelector(tenantSelector);
  const { user } = useSelector(userSelector);
  const { definition, initialized: definitionInitialized } = useSelector(definitionSelector);
  const busy = useSelector(busySelector);

  const version = getVersionFromSearch(location.search);

  useEffect(() => {
    if (tenant) {
      dispatch(selectedDefinition({ definitionId, version }));
    }
  }, [dispatch, definitionId, version, tenant]);

  return (
    <>
      <LoadingIndicator isLoading={!definitionInitialized || busy.loading} />
      {definitionInitialized && definition && <FormDefinitionRouting definition={definition} user={user} />}
      {definitionInitialized && !definition && user && <FormDoesNotExist />}
      {definitionInitialized && !definition && !user && <SignInStartApplication />}
    </>
  );
};

interface FormDefinitionRoutesProps {
  definition: FormDefinitionObject;
  user: ReturnType<typeof userSelector>['user'];
}

const FormDefinitionRoutes: FunctionComponent<FormDefinitionRoutesProps> = ({ definition, user }) => (
  <Routes>
    <Route path="/draft" element={<AnonymousForm />} />
    <Route path="/forms" element={<Forms definition={definition} />} />
    <Route path="/:formId" element={<Form />} />
    <Route path="/" element={<FormDefinitionStart definition={definition} user={user} />} />
    <Route path="*" element={<Navigate to="/" />} />
  </Routes>
);

// clean-code-ignore: 2.16
const FormDefinitionRouting: FunctionComponent<FormDefinitionRoutesProps> = ({ definition, user }) => (
  <ScheduledIntake definition={definition}>
    <FormDefinitionRoutes definition={definition} user={user} />
  </ScheduledIntake>
);
