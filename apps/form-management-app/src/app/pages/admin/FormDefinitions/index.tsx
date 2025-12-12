import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { debounce } from 'lodash';
import {
  GoACircularProgress,
  GoATable,
  GoAIconButton,
  GoAPagination,
  GoASpacer,
  GoAButton,
  GoAModal,
  GoAButtonGroup,
  GoAInput,
  GoADropdown,
  GoADropdownItem,
} from '@abgov/react-components';
import {
  AppDispatch,
  getFormDefinitions,
  getPrograms,
  getMinistries,
  selectFormDefinitions,
  selectFormLoading,
  configInitializedSelector,
  userSelector,
  selectIsAuthenticated,
  selectPrograms,
  selectMinistries,
  selectFormPage,
  selectFormNext,
  selectFormCursors,
  selectFormCriteria,
} from '../../../state';
import type { FormDefinition } from '../../../state/types';
import { deleteDefinition, formActions } from '../../../state/form/form.slice';
import { selectIsDeletingDefinition } from '../../../state/form/selectors';
import styles from './index.module.scss';

const FormDefinitions = (): JSX.Element => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { tenant } = useParams<{ tenant: string }>();
  const definitions = useSelector(selectFormDefinitions);
  const loading = useSelector(selectFormLoading);
  const isDeleting = useSelector(selectIsDeletingDefinition);
  const configInitialized = useSelector(configInitializedSelector);
  const { initialized: userInitialized } = useSelector(userSelector);
  const authenticated = useSelector(selectIsAuthenticated);
  const programs = useSelector(selectPrograms);
  const ministries = useSelector(selectMinistries);

  const page = useSelector(selectFormPage);
  const next = useSelector(selectFormNext);
  const cursors = useSelector(selectFormCursors);
  const criteria = useSelector(selectFormCriteria);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [definitionToDelete, setDefinitionToDelete] = useState<FormDefinition | null>(null);
  const [name, setName] = useState(criteria.name);
  const [actsOfLegislation, setActsOfLegislation] = useState(criteria.actsOfLegislation);
  const [registeredId, setRegisteredId] = useState(criteria.registeredId);
  const [program, setProgram] = useState(criteria.program);
  const [ministry, setMinistry] = useState(criteria.ministry);

  const currentCursor = cursors[page];
  const firstRender = useRef(true);

  const debounceUpdateQuery = useCallback(
    debounce((nextQuery) => {
      dispatch(formActions.setCriteria(nextQuery));
      dispatch(formActions.setPage(1));
    }, 1000),
    [dispatch]
  );

  const onNameChange = (_name: string, value: string) => {
    setName(value);
    debounceUpdateQuery({ name: value, actsOfLegislation, registeredId, program, ministry });
  };

  const onActsChange = (_name: string, value: string) => {
    setActsOfLegislation(value);
    debounceUpdateQuery({ name, actsOfLegislation: value, registeredId, program, ministry });
  };

  const onRegisteredIdChange = (_name: string, value: string) => {
    setRegisteredId(value);
    debounceUpdateQuery({ name, actsOfLegislation, registeredId: value, program, ministry });
  };

  const onProgramChange = (_name: string, value: string | string[]) => {
    const val = Array.isArray(value) ? value[0] : value;
    setProgram(val);
    debounceUpdateQuery({ name, actsOfLegislation, registeredId, program: val, ministry });
  };

  const onMinistryChange = (_name: string, value: string | string[]) => {
    const val = Array.isArray(value) ? value[0] : value;
    setMinistry(val);
    debounceUpdateQuery({ name, actsOfLegislation, registeredId, program, ministry: val });
  };

  const resetFilters = () => {
    setName('');
    setActsOfLegislation('');
    setRegisteredId('');
    setProgram('');
    setMinistry('');
    debounceUpdateQuery({ name: '', actsOfLegislation: '', registeredId: '', program: '', ministry: '' });
  };

  useEffect(() => {
    const currentCursor = cursors[page];
    if (configInitialized && userInitialized && authenticated) {
      dispatch(getPrograms());
      dispatch(getMinistries());
    }
  }, [dispatch, configInitialized, userInitialized, authenticated]);

  useEffect(() => {
    if (configInitialized && userInitialized && authenticated) {
      if (firstRender.current) {
        firstRender.current = false;
        if (definitions && definitions.length > 0) {
          return;
        }
      }

      dispatch(
        getFormDefinitions({
          top: 40,
          after: currentCursor || undefined,
          name: criteria.name,
          actsOfLegislation: criteria.actsOfLegislation,
          registeredId: criteria.registeredId,
          program: criteria.program,
          ministry: criteria.ministry,
        })
      )
        .unwrap()
        .then((result) => {
          // next and cursors are updated in the slice
        });
    }
  }, [dispatch, configInitialized, userInitialized, authenticated, page, currentCursor, criteria]);

  return (
    <div>
      <div className={styles.header}>
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
      <br />
      <div className={styles.container}>
        <div className={styles.filters}>
          <GoAInput
            name="name"
            type="search"
            placeholder="Search by name"
            value={name}
            onChange={onNameChange}
            width="100%"
          />
          <GoASpacer vSpacing="m" />
          <GoAInput
            name="actsOfLegislation"
            type="search"
            placeholder="Search by acts of legislation"
            value={actsOfLegislation}
            onChange={onActsChange}
            width="100%"
          />
          <GoASpacer vSpacing="m" />
          <GoAInput
            name="registeredId"
            type="search"
            placeholder="Search by registered ID"
            value={registeredId}
            onChange={onRegisteredIdChange}
            width="100%"
          />
          <GoASpacer vSpacing="m" />
          <GoADropdown
            name="program"
            value={program}
            onChange={onProgramChange}
            width="100%"
            placeholder="Select a program"
          >
            <GoADropdownItem value="" label="Select a program" />
            {programs.map((p) => (
              <GoADropdownItem key={p} value={p} label={p} />
            ))}
          </GoADropdown>
          <GoASpacer vSpacing="m" />
          <GoADropdown
            name="ministry"
            value={ministry}
            onChange={onMinistryChange}
            width="100%"
            placeholder="Select a ministry"
          >
            <GoADropdownItem value="" label="Select a ministry" />
            {ministries.map((m) => (
              <GoADropdownItem key={m} value={m} label={m} />
            ))}
          </GoADropdown>
          <GoASpacer vSpacing="m" />
          <GoAButton type="tertiary" onClick={resetFilters} width="100%">
            Clear all
          </GoAButton>
        </div>
        <div className={styles.tableContainer}>
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
                          navigate(`/${tenant}/editor/${definition.id}`);
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
            onChange={(newPage) => dispatch(formActions.setPage(newPage))}
          />
        </div>
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
