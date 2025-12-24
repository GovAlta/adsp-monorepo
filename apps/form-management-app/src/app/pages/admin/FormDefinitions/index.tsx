import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { debounce } from 'lodash';
import {
  GoabCircularProgress,
  GoabTable,
  GoabIconButton,
  GoabPagination,
  GoabSpacer,
  GoabButton,
  GoabModal,
  GoabButtonGroup,
  GoabInput,
  GoabDropdown,
  GoabDropdownItem,
} from '@abgov/react-components';
import {
  GoabInputOnChangeDetail,
  GoabDropdownOnChangeDetail,
  GoabPaginationOnChangeDetail,
} from '@abgov/ui-components-common';

import {
  AppDispatch,
  getFormDefinitions,
  getPrograms,
  getMinistries,
  getActsOfLegislation,
  selectFormDefinitions,
  selectFormLoading,
  configInitializedSelector,
  userSelector,
  selectIsAuthenticated,
  selectPrograms,
  selectMinistries,
  selectActsOfLegislation,
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
  const acts = useSelector(selectActsOfLegislation);

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

  const debounceUpdateQuery = useCallback(
    debounce((nextQuery) => {
      dispatch(formActions.setCriteria(nextQuery));
      dispatch(formActions.setPage(1));
    }, 1000),
    [dispatch]
  );

  const onNameChange = (_name: string, value: string) => {
    if (name === value) return;
    setName(value);
    debounceUpdateQuery({ name: value, actsOfLegislation, registeredId, program, ministry });
  };

  const onActsChange = (_name: string, value: string | string[]) => {
    const val = Array.isArray(value) ? value[0] : value;
    if (actsOfLegislation === val) return;
    setActsOfLegislation(val);
    debounceUpdateQuery({ name, actsOfLegislation: val, registeredId, program, ministry });
  };

  const onRegisteredIdChange = (_name: string, value: string) => {
    if (registeredId === value) return;
    setRegisteredId(value);
    debounceUpdateQuery({ name, actsOfLegislation, registeredId: value, program, ministry });
  };

  const onProgramChange = (_name: string, value: string | string[]) => {
    const val = Array.isArray(value) ? value[0] : value;
    if (program === val) return;
    setProgram(val);
    debounceUpdateQuery({ name, actsOfLegislation, registeredId, program: val, ministry });
  };

  const onMinistryChange = (_name: string, value: string | string[]) => {
    const val = Array.isArray(value) ? value[0] : value;
    if (ministry === val) return;
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
    if (configInitialized && userInitialized && authenticated) {
      dispatch(getPrograms());
      dispatch(getMinistries());
      dispatch(getActsOfLegislation());
    }
  }, [dispatch, configInitialized, userInitialized, authenticated]);

  useEffect(() => {
    if (configInitialized && userInitialized && authenticated) {
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
      );
    }
  }, [dispatch, configInitialized, userInitialized, authenticated, page, currentCursor, criteria]);

  return (
    <div>
      <div className={styles.header}>
        <h1>Form Definitions</h1>
        <GoabButton
          type="primary"
          onClick={() => {
            navigate('new');
          }}
        >
          Create Definition
        </GoabButton>
      </div>
      <br />
      <div className={styles.container}>
        <div className={styles.filters}>
          <GoabInput
            name="name"
            type="search"
            placeholder="Search by name"
            value={name}
            onChange={(detail: GoabInputOnChangeDetail) => onNameChange(detail.name, detail.value)}
            width="100%"
          />
          <GoabSpacer vSpacing="m" />
          <GoabDropdown
            name="actsOfLegislation"
            value={actsOfLegislation}
            onChange={(detail: GoabInputOnChangeDetail) => onActsChange(detail.name, detail.value)}
            width="100%"
            placeholder="Select acts of legislation"
          >
            <GoabDropdownItem value={actsOfLegislation} label="Select acts of legislation" />
            {acts.map((act) => (
              <GoabDropdownItem key={act} value={act} label={act} />
            ))}
          </GoabDropdown>
          <GoabSpacer vSpacing="m" />
          <GoabInput
            name="registeredId"
            type="search"
            placeholder="Search by registered ID"
            value={registeredId}
            onChange={(detail: GoabInputOnChangeDetail) => onRegisteredIdChange(detail.name, detail.value)}
            width="100%"
          />
          <GoabSpacer vSpacing="m" />
          <GoabDropdown
            name="program"
            value={program}
            onChange={(detail: GoabDropdownOnChangeDetail) => onProgramChange(detail.name ?? '', detail.values ?? '')}
            width="100%"
            placeholder="Select a program"
          >
            <GoabDropdownItem value="" label="Select a program" />
            {programs.map((program) => (
              <GoabDropdownItem key={program} value={program} label={program} />
            ))}
          </GoabDropdown>
          <GoabSpacer vSpacing="m" />
          <GoabDropdown
            name="ministry"
            value={ministry}
            onChange={(detail: GoabDropdownOnChangeDetail) => onMinistryChange(detail.name ?? '', detail.values ?? '')}
            width="100%"
            placeholder="Select a ministry"
          >
            <GoabDropdownItem value="" label="Select a ministry" />
            {ministries.map((ministry) => (
              <GoabDropdownItem key={ministry} value={ministry} label={ministry} />
            ))}
          </GoabDropdown>
          <GoabSpacer vSpacing="m" />
          <GoabButton type="tertiary" onClick={resetFilters} width="100%">
            Clear all
          </GoabButton>
        </div>
        <div className={styles.tableContainer}>
          <GoabTable width="100%">
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
                      <GoabCircularProgress visible={true} size="large" />
                    </div>
                  </td>
                </tr>
              ) : definitions && definitions.length > 0 ? (
                definitions.map((definition) => (
                  <tr key={definition.id}>
                    <td>{definition.name}</td>
                    <td>{definition.description}</td>
                    <td className={styles.actions}>
                      <GoabIconButton
                        icon="pencil"
                        size="medium"
                        ariaLabel="Edit"
                        onClick={() => {
                          navigate(`/${tenant}/editor/${definition.id}`);
                        }}
                      />
                      <GoabIconButton
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
          </GoabTable>
          <GoabSpacer vSpacing="xl" />
          <GoabPagination
            itemCount={next ? (page + 1) * 40 : page * 40}
            perPageCount={40}
            pageNumber={page}
            onChange={(detail: GoabPaginationOnChangeDetail) => dispatch(formActions.setPage(detail.page))}
          />
        </div>
      </div>

      <GoabModal
        open={showDeleteModal}
        heading="Delete Form Definition"
        actions={
          <GoabButtonGroup alignment="end">
            <GoabButton
              type="secondary"
              onClick={() => {
                setShowDeleteModal(false);
                setDefinitionToDelete(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </GoabButton>
            <GoabButton
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
            </GoabButton>
          </GoabButtonGroup>
        }
      >
        <p>
          Are you sure you want to delete the form definition "{definitionToDelete?.name}"? This action cannot be
          undone.
        </p>
      </GoabModal>
    </div>
  );
};
export default FormDefinitions;
