import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  GoabButton,
  GoabDropdown,
  GoabDropdownItem,
  GoabCircularProgress,
  GoabTable,
  GoabBadge,
} from '@abgov/react-components';
import { GoabDropdownOnChangeDetail } from '@abgov/ui-components-common';
import {
  AppDispatch,
  getFormDefinitions,
  getFormDefinitionVersions,
  selectFormDefinitions,
  selectFormLoading,
  selectFormVersions,
  selectFormVersionsLoading,
  selectFormVersionsNext,
  configInitializedSelector,
  userSelector,
  selectIsAuthenticated,
} from '../../../state';
import styles from './index.module.scss';

const FormVersions = (): JSX.Element => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { tenant } = useParams<{ tenant: string }>();

  const definitions = useSelector(selectFormDefinitions);
  const loading = useSelector(selectFormLoading);
  const configInitialized = useSelector(configInitializedSelector);
  const { initialized: userInitialized } = useSelector(userSelector);
  const authenticated = useSelector(selectIsAuthenticated);

  const [selectedDefinitionId, setSelectedDefinitionId] = useState<string>('');

  const versions = useSelector(selectFormVersions(selectedDefinitionId));
  const versionsLoading = useSelector(selectFormVersionsLoading(selectedDefinitionId));
  const versionsNext = useSelector(selectFormVersionsNext(selectedDefinitionId));

  useEffect(() => {
    if (configInitialized && userInitialized && authenticated) {
      dispatch(getFormDefinitions({ top: 100 }));
    }
  }, [dispatch, configInitialized, userInitialized, authenticated]);

  useEffect(() => {
    if (definitions.length > 0 && !selectedDefinitionId) {
      setSelectedDefinitionId(definitions[0].id);
    }
  }, [definitions, selectedDefinitionId]);

  useEffect(() => {
    if (selectedDefinitionId && configInitialized && userInitialized && authenticated) {
      dispatch(getFormDefinitionVersions({ definitionId: selectedDefinitionId }));
    }
  }, [dispatch, selectedDefinitionId, configInitialized, userInitialized, authenticated]);

  const handleDefinitionChange = (detail: GoabDropdownOnChangeDetail) => {
    const value = detail.value || (Array.isArray(detail.values) ? detail.values[0] : detail.values);
    if (value) {
      setSelectedDefinitionId(value);
    }
  };

  const handleLoadMore = () => {
    if (selectedDefinitionId && versionsNext) {
      dispatch(getFormDefinitionVersions({ definitionId: selectedDefinitionId, after: versionsNext }));
    }
  };

  const selectedDefinition = definitions.find((def) => def.id === selectedDefinitionId);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (index: number) => {
    if (index === 0) {
      return <GoabBadge type="information" content="Latest" />;
    }
    return <GoabBadge type="midtone" content="Archived" />;
  };

  return (
    <div>
      <div className={styles.header}>
        <div>
          <GoabButton type="tertiary" leadingIcon="arrow-back" onClick={() => navigate(`/${tenant}`)}>
            Back to Dashboard
          </GoabButton>
          <h1>Form Versions</h1>
        </div>
      </div>

      <div className={styles.selectorSection}>
        <label htmlFor="formDefinition" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Select Form Definition:
        </label>
        <GoabDropdown
          name="formDefinition"
          value={selectedDefinitionId}
          onChange={handleDefinitionChange}
          width="100%"
          placeholder={definitions.length > 0 ? 'Select a form definition to view versions' : 'Loading definitions...'}
        >
          <GoabDropdownItem value="" label="Select a form definition" />
          {definitions.map((definition) => (
            <GoabDropdownItem key={definition.id} value={definition.id} label={definition.name} />
          ))}
        </GoabDropdown>
        {definitions.length > 0 && (
          <p style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
            {definitions.length} form definition(s) available
          </p>
        )}
      </div>

      {loading && (
        <div className={styles.loadingContainer}>
          <GoabCircularProgress visible={true} size="large" />
        </div>
      )}

      {selectedDefinition && (
        <div className={styles.contentSection}>
          <h2>Versions for: {selectedDefinition.name}</h2>

          {versionsLoading && versions.length === 0 ? (
            <div className={styles.loadingContainer}>
              <GoabCircularProgress visible={true} size="large" />
            </div>
          ) : versions.length > 0 ? (
            <>
              <GoabTable width="100%">
                <thead>
                  <tr>
                    <th>Revision Number</th>
                    <th>Revision Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {versions.map((version, index) => (
                    <tr key={version.revision}>
                      <td>
                        <div className={styles.revisionCell}>
                          {version.revision}
                          <div className={styles.badges}>{getStatusBadge(index)}</div>
                        </div>
                      </td>
                      <td>{formatDate(version.lastUpdated)}</td>
                      <td>{index === 0 ? 'Latest' : 'Archived'}</td>
                      <td>
                        <GoabButton type="tertiary" size="compact" disabled>
                          View
                        </GoabButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </GoabTable>

              {versionsNext && (
                <div className={styles.loadMoreSection}>
                  <GoabButton type="secondary" onClick={handleLoadMore} disabled={versionsLoading}>
                    {versionsLoading ? 'Loading...' : 'Load More'}
                  </GoabButton>
                </div>
              )}
            </>
          ) : (
            <p>No versions found for this form definition.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default FormVersions;
