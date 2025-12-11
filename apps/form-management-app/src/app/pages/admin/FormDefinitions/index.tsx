import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  GoACircularProgress,
  GoATable,
  GoAIconButton,
  GoAPagination,
  GoASpacer,
  GoAButton,
  GoAModal,
  GoAButtonGroup,
} from '@abgov/react-components';
import {
  AppDispatch,
  getFormDefinitions,
  selectFormDefinitions,
  selectFormLoading,
  configInitializedSelector,
  userSelector,
  selectIsAuthenticated,
} from '../../../state';
import type { FormDefinition } from '../../../state/types';
import { deleteDefinition } from '../../../state/form/form.slice';
import { selectIsDeletingDefinition } from '../../../state/form/selectors';
import styles from './index.module.scss';

const FormDefinitions = (): JSX.Element => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const definitions = useSelector(selectFormDefinitions);
  const loading = useSelector(selectFormLoading);
  const isDeleting = useSelector(selectIsDeletingDefinition);
  const configInitialized = useSelector(configInitializedSelector);
  const { initialized: userInitialized } = useSelector(userSelector);
  const authenticated = useSelector(selectIsAuthenticated);

  const [page, setPage] = useState(1);
  const [next, setNext] = useState<string | null>(null);
  const [cursors, setCursors] = useState<Record<number, string | null>>({ 1: null });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [definitionToDelete, setDefinitionToDelete] = useState<FormDefinition | null>(null);

  useEffect(() => {
    const currentCursor = cursors[page];
    if (configInitialized && userInitialized && authenticated) {
      dispatch(getFormDefinitions({ top: 40, after: currentCursor || undefined }))
        .unwrap()
        .then((result) => {
          setNext(result.page.next);
          if (result.page.next) {
            setCursors((prev) => {
              if (prev[page + 1] === result.page.next) return prev;
              return { ...prev, [page + 1]: result.page.next };
            });
          }
        });
    }
  }, [dispatch, configInitialized, userInitialized, authenticated, page, cursors]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Form Definitions</h1>
        <GoAButton
          type="primary"
          onClick={() => {
            navigate('new');
          }}
        >
          Create Definition
        </GoAButton>
      </div>
      <div>
        <GoATable width="100%">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th className={styles.actions}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3}>
                  <div className={styles.loadingContainer}>
                    <GoACircularProgress visible={true} size="large" />
                  </div>
                </td>
              </tr>
            ) : definitions && definitions.length > 0 ? (
              definitions.map((definition) => (
                <tr key={definition.id}>
                  <td>{definition.name}</td>
                  <td>{definition.description}</td>
                  <td className={styles.actions}>
                    <GoAIconButton
                      icon="pencil"
                      size="medium"
                      ariaLabel="Edit"
                      onClick={() => {
                        navigate(definition.id);
                      }}
                    />
                    <GoAIconButton
                      icon="trash"
                      size="medium"
                      ariaLabel="Delete"
                      onClick={() => {
                        setDefinitionToDelete(definition);
                        setShowDeleteModal(true);
                      }}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3}>No form definitions found.</td>
              </tr>
            )}
          </tbody>
        </GoATable>
        <GoASpacer vSpacing="xl" />
        <GoAPagination
          itemCount={next ? (page + 1) * 40 : page * 40}
          perPageCount={40}
          pageNumber={page}
          onChange={(newPage) => setPage(newPage)}
        />
      </div>

      <GoAModal
        open={showDeleteModal}
        heading="Delete Form Definition"
        actions={
          <GoAButtonGroup alignment="end">
            <GoAButton
              type="secondary"
              onClick={() => {
                setShowDeleteModal(false);
                setDefinitionToDelete(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </GoAButton>
            <GoAButton
              type="primary"
              variant="destructive"
              onClick={async () => {
                if (definitionToDelete) {
                  try {
                    await dispatch(deleteDefinition(definitionToDelete.id)).unwrap();
                    setShowDeleteModal(false);
                    setDefinitionToDelete(null);
                  } catch (error) {
                    console.error('Failed to delete definition:', error);
                  }
                }
              }}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </GoAButton>
          </GoAButtonGroup>
        }
      >
        <p>
          Are you sure you want to delete the form definition "{definitionToDelete?.name}"? This action cannot be
          undone.
        </p>
      </GoAModal>
    </div>
  );
};
export default FormDefinitions;
