import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AsyncThunk } from '@reduxjs/toolkit';
import {
  GoabTable,
  GoabCircularProgress,
  GoabIconButton,
  GoabInput,
  GoabModal,
  GoabSpacer,
  GoabButton,
  GoabButtonGroup,
  GoabDropdown,
  GoabDropdownItem,
} from '@abgov/react-components';
import {
  AppDispatch,
  getPrograms,
  selectPrograms,
  selectFiltersLoading,
  selectFormBusy,
  configInitializedSelector,
  updatePrograms,
  getMinistries,
  selectMinistries,
  updateMinistries,
  getActsOfLegislation,
  selectActsOfLegislation,
  updateActsOfLegislation,
} from '../../../state';
import styles from './index.module.scss';
import { GoabInputOnChangeDetail, GoabDropdownOnChangeDetail } from '@abgov/ui-components-common';

type FilterKey = 'program' | 'ministry' | 'acts-of-legislation';

interface FilterDefinition {
  label: string;
  list: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateAction: AsyncThunk<string[], string[], any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchAction: AsyncThunk<string[], void, any>;
}

const FormFilters = (): JSX.Element => {
  const dispatch = useDispatch<AppDispatch>();
  const programs = useSelector(selectPrograms);
  const ministries = useSelector(selectMinistries);
  const actsOfLegislation = useSelector(selectActsOfLegislation);
  const loading = useSelector(selectFiltersLoading);
  const busy = useSelector(selectFormBusy);
  const configInitialized = useSelector(configInitializedSelector);

  const filterConfig: Record<FilterKey, FilterDefinition> = {
    program: {
      label: 'Program',
      list: programs,
      updateAction: updatePrograms,
      fetchAction: getPrograms,
    },
    ministry: {
      label: 'Ministry',
      list: ministries,
      updateAction: updateMinistries,
      fetchAction: getMinistries,
    },
    'acts-of-legislation': {
      label: 'Acts of Legislation',
      list: actsOfLegislation,
      updateAction: updateActsOfLegislation,
      fetchAction: getActsOfLegislation,
    },
  };

  const [selectedFilter, setSelectedFilter] = useState<FilterKey>('program');
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newValue, setNewValue] = useState('');

  const currentConfig = filterConfig[selectedFilter];
  const currentList = currentConfig?.list || [];
  const updateAction = currentConfig?.updateAction;

  const [fetched, setFetched] = useState<Partial<Record<FilterKey, boolean>>>({});

  useEffect(() => {
    if (configInitialized && currentConfig) {
      if (!fetched[selectedFilter] && currentList.length === 0) {
        dispatch(currentConfig.fetchAction());
        setFetched((prev) => ({ ...prev, [selectedFilter]: true }));
      }
    }
  }, [dispatch, configInitialized, selectedFilter, fetched, currentList.length, currentConfig]);

  const onFilterChange = (name: string, value: string | string[]) => {
    const newValue = Array.isArray(value) ? value[0] : value;
    setSelectedFilter(newValue as FilterKey);
    setIsAdding(false);
    setEditIndex(null);
    setDeleteIndex(null);
    setNewValue('');
    setEditValue('');
  };

  const onAdd = () => {
    setIsAdding(true);
    setNewValue('');
  };

  const onSaveNew = async () => {
    if (newValue && updateAction) {
      const newList = [...currentList, newValue];
      await dispatch(updateAction(newList));
      setIsAdding(false);
      setNewValue('');
    }
  };

  const onCancelNew = () => {
    setIsAdding(false);
    setNewValue('');
  };

  const onEdit = (index: number, value: string) => {
    setEditIndex(index);
    setEditValue(value);
  };

  const onSave = async (index: number) => {
    if (editValue !== currentList[index] && updateAction) {
      const newList = [...currentList];
      newList[index] = editValue;
      await dispatch(updateAction(newList));
    }
    setEditIndex(null);
    setEditValue('');
  };

  const onDelete = (index: number) => {
    setDeleteIndex(index);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (deleteIndex !== null && updateAction) {
      const newList = currentList.filter((_, i) => i !== deleteIndex);
      await dispatch(updateAction(newList)).unwrap();
      setShowDeleteModal(false);
      setDeleteIndex(null);
    }
  };

  return (
    <div>
      <h1>Form Filters</h1>
      <GoabSpacer vSpacing="m" />
      <GoabDropdown
        name="filter-type"
        value={selectedFilter}
        onChange={(detail: GoabDropdownOnChangeDetail) => {
          if (detail.name && detail.value) {
            onFilterChange(detail.name, detail.value);
          }
        }}
        width="200px"
      >
        {Object.keys(filterConfig).map((key) => (
          <GoabDropdownItem key={key} value={key} label={filterConfig[key as FilterKey].label} />
        ))}
      </GoabDropdown>
      <GoabSpacer vSpacing="m" />
      <GoabTable width="40%">
        <thead>
          <tr>
            <th>
              <div className={styles.header}>
                {currentConfig?.label}
                <GoabIconButton icon="add" size="medium" disabled={isAdding} onClick={onAdd} />
              </div>
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {isAdding && (
            <tr>
              <td>
                <GoabInput
                  name="filter-new"
                  value={newValue}
                  onChange={(detail: GoabInputOnChangeDetail) => setNewValue(detail.value)}
                  width="100%"
                />
              </td>
              <td>
                <GoabIconButton
                  icon="checkmark"
                  size="medium"
                  disabled={!newValue || busy.saving}
                  onClick={onSaveNew}
                />
                <GoabIconButton icon="trash" size="medium" onClick={onCancelNew} />
              </td>
            </tr>
          )}
          {loading ? (
            <tr>
              <td colSpan={2}>
                <GoabCircularProgress visible={true} size="large" />
              </td>
            </tr>
          ) : currentList && currentList.length > 0 ? (
            currentList.map((item, index) => (
              <tr key={index}>
                <td>
                  {editIndex === index ? (
                    <GoabInput
                      name="filter-edit"
                      value={editValue}
                      onChange={(detail: GoabInputOnChangeDetail) => setEditValue(detail.value)}
                      width="100%"
                    />
                  ) : (
                    item
                  )}
                </td>
                <td>
                  {editIndex === index ? (
                    <GoabIconButton
                      icon="checkmark"
                      size="medium"
                      disabled={busy.saving}
                      onClick={() => onSave(index)}
                    />
                  ) : (
                    <GoabIconButton icon="create" size="medium" onClick={() => onEdit(index, item)} />
                  )}
                  <GoabIconButton icon="trash" size="medium" onClick={() => onDelete(index)} />
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={2}>No {currentConfig?.label.toLowerCase()}s found</td>
            </tr>
          )}
        </tbody>
      </GoabTable>
      <GoabModal
        heading={`Delete ${currentConfig?.label}`}
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        actions={
          <GoabButtonGroup alignment="end">
            <GoabButton type="secondary" onClick={() => setShowDeleteModal(false)} disabled={busy.saving}>
              Cancel
            </GoabButton>
            <GoabButton type="primary" variant="destructive" onClick={confirmDelete} disabled={busy.saving}>
              {busy.saving ? 'Deleting...' : 'Delete'}
            </GoabButton>
          </GoabButtonGroup>
        }
      >
        <p>
          Are you sure you want to delete <b>{deleteIndex !== null ? currentList[deleteIndex] : ''}</b>?
        </p>
      </GoabModal>
    </div>
  );
};

export default FormFilters;
