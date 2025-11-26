import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  GoAButton,
  GoAButtonGroup,
  GoADropdown,
  GoADropdownItem,
  GoAFormItem,
  GoAContainer,
  GoAGrid,
  GoATable,
  GoACallout,
  GoASkeleton,
  GoABadge,
} from '@abgov/react-components';
import { FormSubmissions } from '../../../containers/FormSubmissions';
import {
  getFormDefinitions,
  definitionsSelector,
  selectDefinition,
  formLoadingSelector,
  selectedDefinitionSelector,
} from '../../../state/form/form.slice';
import { AppDispatch } from '../../../state/store';
import { configInitializedSelector, userSelector, selectIsAuthenticated } from '../../../state';
import { BackButton, styles } from '../../../components';

const FormPreview = (): JSX.Element => {
  const location = useLocation();
  const { formId } = useParams<{ formId?: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [loadingVisible, setLoadingVisible] = useState(false);

  const definitions = useSelector(definitionsSelector);
  const selectedDefinition = useSelector(selectedDefinitionSelector);
  const { definitions: loading } = useSelector(formLoadingSelector);
  const configInitialized = useSelector(configInitializedSelector);
  const { initialized: userInitialized } = useSelector(userSelector);
  const authenticated = useSelector(selectIsAuthenticated);
  const nextPage = useSelector((state: { form: { next: { definitions?: string } } }) => state.form.next.definitions);

  useEffect(() => {
    if (configInitialized && userInitialized && authenticated) {
      setLoadingVisible(true);
      dispatch(getFormDefinitions({})).finally(() => setLoadingVisible(false));
    }
  }, [dispatch, configInitialized, userInitialized, authenticated]);

  const handleLoadMore = () => {
    if (nextPage) {
      dispatch(getFormDefinitions({ after: nextPage }));
    }
  };

  // Determine view mode based on URL parameters
  const isViewingSubmissions = !!formId;

  useEffect(() => {
    if (formId) {
      dispatch(selectDefinition(formId));
    }
  }, [formId, dispatch]);

  const handleViewSubmissions = (definitionId: string) => {
    const pathParts = location.pathname.split('/');
    const tenant = pathParts[1];
    navigate(`/${tenant}/preview/${definitionId}`);
  };

  const handleBackToDefinitions = () => {
    const pathParts = location.pathname.split('/');
    const tenant = pathParts[1];
    navigate(`/${tenant}/preview`);
  };

  const handleBackToLanding = () => {
    const pathParts = location.pathname.split('/');
    const tenant = pathParts[1];
    navigate(`/${tenant}`);
  };

  if (loading && definitions.length === 0) {
    return (
      <GoAContainer>
        <div className={styles.navigationWrapper}>
          <BackButton onClick={handleBackToLanding}>Back to Landing</BackButton>
        </div>

        <GoAGrid minChildWidth="100%">
          <div>
            <h1>Form Administration</h1>
            <p>Loading form definitions...</p>
          </div>
        </GoAGrid>

        <div className={styles.skeletonWrapper}>
          <GoASkeleton type="card" lineCount={3} maxWidth="100%" />
          <GoASkeleton type="card" lineCount={3} maxWidth="100%" />
          <GoASkeleton type="card" lineCount={3} maxWidth="100%" />
          <GoASkeleton type="card" lineCount={3} maxWidth="100%" />
          <GoASkeleton type="card" lineCount={3} maxWidth="100%" />
        </div>
      </GoAContainer>
    );
  }

  if (isViewingSubmissions && selectedDefinition) {
    return (
      <GoAContainer>
        <div className={styles.navigationWrapper}>
          <BackButton onClick={handleBackToDefinitions}>Back to Form Definitions</BackButton>
          <h1>Submissions for: {selectedDefinition.name}</h1>
          <p>{selectedDefinition.description}</p>
        </div>
        <FormSubmissions definitionId={selectedDefinition.id} />
      </GoAContainer>
    );
  }

  return (
    <GoAContainer>
      <div className={styles.navigationWrapper}>
        <BackButton onClick={handleBackToLanding}>Back to Landing</BackButton>
      </div>

      <GoAGrid minChildWidth="100%">
        <div>
          <h1>Form Administration</h1>
          <p>Manage and view form definitions and their submissions.</p>
        </div>
      </GoAGrid>

      {definitions && definitions.length > 0 ? (
        <>
          <GoATable width="100%">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Anonymous Apply</th>
                <th>Submission Records</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {definitions.map((definition) => (
                <tr key={definition.id}>
                  <td>
                    <strong>{definition.name}</strong>
                    <br />
                    <small>ID: {definition.id}</small>
                  </td>
                  <td>{definition.description || 'No description available'}</td>
                  <td>
                    <GoABadge
                      type={definition.anonymousApply ? 'success' : 'information'}
                      content={definition.anonymousApply ? 'Yes' : 'No'}
                    />
                  </td>
                  <td>
                    <GoABadge
                      type={definition.submissionRecords ? 'success' : 'information'}
                      content={definition.submissionRecords ? 'Enabled' : 'Disabled'}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <GoAButtonGroup alignment="center">
                      <GoAButton type="secondary" size="compact" onClick={() => handleViewSubmissions(definition.id)}>
                        View Submissions
                      </GoAButton>
                      <GoAButton
                        type="tertiary"
                        size="compact"
                        onClick={() => navigate(`/admin/form-editor/${definition.id}`)}
                      >
                        Edit Form
                      </GoAButton>
                    </GoAButtonGroup>
                  </td>
                </tr>
              ))}
            </tbody>
          </GoATable>

          {nextPage && (
            <div className={styles.loadMoreWrapper}>
              <GoAButton type="secondary" disabled={loading} onClick={handleLoadMore}>
                {loading ? 'Loading...' : 'Load More Definitions'}
              </GoAButton>
            </div>
          )}
        </>
      ) : (
        !loading && (
          <GoACallout type="information" heading="No Form Definitions">
            <p>No form definitions have been found. Please check your configuration or contact your administrator.</p>
          </GoACallout>
        )
      )}
    </GoAContainer>
  );
};

export default FormPreview;
