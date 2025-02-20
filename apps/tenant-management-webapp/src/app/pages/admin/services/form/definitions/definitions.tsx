import React, { useEffect, useState } from 'react';

import { GoAButton, GoACircularProgress, GoADropdown, GoADropdownItem, GoAFormItem } from '@abgov/react-components';

import { useDispatch, useSelector } from 'react-redux';
import {
  getFormDefinitions,
  updateFormDefinition,
  deleteFormDefinition,
  openEditorForDefinition,
  fetchFormResourceTags,
  unTagFormResource,
  tagFormResource,
  fetchAllTags,
  fetchResourcesByTag,
  setSelectedTag,
} from '@store/form/action';
import { RootState } from '@store/index';
import { ResourceTagResult, Service } from '@store/directory/models';
import { renderNoItem } from '@components/NoItem';
import { FormDefinitionsTable } from './definitionsList';
import { PageIndicator } from '@components/Indicator';
import { defaultFormDefinition, FormDefinition } from '@store/form/model';
import { DeleteModal } from '@components/DeleteModal';
import { AddEditFormDefinition } from './addEditFormDefinition';
import { LoadMoreWrapper } from './style-components';
import { getConfigurationDefinitions } from '@store/configuration/action';
import { useLocation, useNavigate } from 'react-router-dom';
import { AddRemoveResourceTagModal } from './addRemoveResourceTagModal';
import { ResourceTag } from '@store/directory/models';
import { Tag } from '../../../../../store/form/model';

interface FormDefinitionsProps {
  openAddDefinition: boolean;
  isNavigatedFromEdit?: boolean;
  showFormDefinitions: boolean;
  setOpenAddDefinition: (val: boolean) => void;
}

export const FormDefinitions = ({
  openAddDefinition,
  setOpenAddDefinition,
  showFormDefinitions,
}: FormDefinitionsProps) => {
  const CONFIGURATION_SERVICE = 'configuration-service';

  const navigate = useNavigate();
  const location = useLocation();
  const isNavigatedFromEdit = location.state?.isNavigatedFromEdit;

  const [showDefsFromState, setShowDefsFromState] = useState(isNavigatedFromEdit);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showAddRemoveResourceTagModal, setShowAddRemoveResourceTagModal] = useState(false);
  const [currentDefinition, setCurrentDefinition] = useState(defaultFormDefinition);

  const dispatch = useDispatch();
  const next = useSelector((state: RootState) => state.form.nextEntries);

  const orderedFormDefinitions = (state: RootState) => {
    const entries = Object.entries(state?.form?.definitions);
    return entries.reduce((tempObj, [formDefinitionId, formDefinitionData]) => {
      tempObj[formDefinitionId] = formDefinitionData;
      return tempObj;
    }, {});
  };

  const formDefinitions = useSelector(orderedFormDefinitions);

  const [openAddFormDefinition, setOpenAddFormDefinition] = useState(false);
  const [showEmptyBanner, setShowEmptyBanner] = useState(false);

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const selectConfigurationHost = (state: RootState) => {
    return (state?.directory?.directory?.filter(
      (y) => y.service === CONFIGURATION_SERVICE && y.namespace?.toLowerCase() === 'platform' && y.urn.endsWith('v2')
    )[0] ?? []) as Service;
  };
  const resourceConfiguration = useSelector(selectConfigurationHost);
  const BASE_FORM_CONFIG_URN = `${resourceConfiguration.urn}:/configuration/form-service`;
  const selectedTag = useSelector((state: RootState) => state.form.selectedTag as Tag | null);

  const tags = useSelector((state: RootState) => state.form.tags || []);
  const tagsLoading = useSelector((state: RootState) => state.form.tagsLoading);

  const filteredFormDefinitions = useSelector((state: RootState) => state.form.tagResources || {});

  useEffect(() => {
    if (!tagsLoading && tags.length === 0) {
      dispatch(fetchAllTags());
    }
  }, [dispatch, tagsLoading, tags.length]);

  useEffect(() => {
    if (selectedTag) {
      dispatch(fetchResourcesByTag(selectedTag.value));
    }
  }, [dispatch, selectedTag]);

  useEffect(() => {
    if (selectedTag && Object.keys(filteredFormDefinitions).length === 0) {
      setShowEmptyBanner(true);
    } else {
      setShowEmptyBanner(false);
    }
  }, [filteredFormDefinitions, selectedTag]);

  useEffect(() => {
    if (openAddDefinition) {
      setOpenAddFormDefinition(true);
    }
    return () => {
      setOpenAddFormDefinition(false);
    };
  }, [openAddDefinition]);

  useEffect(() => {
    document.body.style.overflow = 'unset';
    dispatch(getConfigurationDefinitions());
    const hasFormDefinitions = Object.keys(formDefinitions).length > 0;

    if (!showDefsFromState && !hasFormDefinitions) {
      dispatch(getFormDefinitions());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onNext = () => {
    dispatch(getFormDefinitions(next));
  };

  useEffect(() => {
    document.body.style.overflow = 'unset';
  }, [formDefinitions]);

  useEffect(() => {
    document.body.style.overflow = 'unset';
  }, []);

  useEffect(() => {
    if (!indicator.show) {
      setShowDeleteConfirmation(false);
    }
  }, [indicator.show]);

  return (
    <section>
      <GoACircularProgress variant="fullscreen" size="small" message="Loading message..."></GoACircularProgress>

      <GoAFormItem label="Filter by Tag">
        <GoADropdown
          name="TagFilter"
          value={selectedTag?.value || ''}
          disabled={!tags.length}
          onChange={(name, value) => {
            const selectedTagObj = tags.find((tag) => tag?.value === value);
            if (selectedTagObj) {
              dispatch(setSelectedTag(selectedTagObj));
              dispatch(fetchResourcesByTag(selectedTagObj.value));
            } else {
              dispatch(setSelectedTag(null));
            }
          }}
          width="54ch"
        >
          <GoADropdownItem value="" label="<No tag filter>" />
          {tags
            .sort((a, b) => a.label.localeCompare(b.label))
            .map((tag) => (
              <GoADropdownItem key={tag.urn} value={tag.value} label={tag.label} />
            ))}
        </GoADropdown>
      </GoAFormItem>

      <br />

      {showFormDefinitions && (
        <GoAButton
          testId="add-definition"
          onClick={() => {
            setOpenAddFormDefinition(true);
          }}
          mb={'l'}
        >
          Add definition
        </GoAButton>
      )}

      <AddEditFormDefinition
        open={openAddFormDefinition}
        isEdit={false}
        onClose={() => {
          setOpenAddFormDefinition(false);
          setOpenAddDefinition(false);
        }}
        initialValue={defaultFormDefinition}
        onSave={(definition) => {
          setOpenAddFormDefinition(false);
          navigate({
            pathname: `edit/${definition.id}`,
            search: '?headless=true',
          });
          dispatch(updateFormDefinition(definition));
          dispatch(openEditorForDefinition(definition.id, definition));
        }}
      />

      {indicator.show && Object.keys(formDefinitions).length === 0 && <PageIndicator />}
      {!indicator.show && !formDefinitions && renderNoItem('form templates')}
      {showEmptyBanner && (
        <p>
          <strong>There are no form definitions available for the selected tag</strong>
        </p>
      )}
      {formDefinitions && Object.keys(formDefinitions).length > 0 && showFormDefinitions && (
        <>
          <FormDefinitionsTable
            definitions={
              selectedTag && Object.keys(filteredFormDefinitions).length > 0 ? filteredFormDefinitions : formDefinitions
            }
            baseResourceFormUrn={BASE_FORM_CONFIG_URN}
            onDelete={(formDefinition) => {
              setShowDeleteConfirmation(true);
              setCurrentDefinition(formDefinition);
            }}
            onAddResourceTag={(formDefinition) => {
              setShowAddRemoveResourceTagModal(true);
              setCurrentDefinition(formDefinition);
            }}
          />
          {next && (
            <LoadMoreWrapper>
              <GoAButton
                testId="form-event-load-more-btn"
                key="form-event-load-more-btn"
                type="tertiary"
                onClick={onNext}
              >
                Load more
              </GoAButton>
            </LoadMoreWrapper>
          )}
        </>
      )}
      {showAddRemoveResourceTagModal && (
        <AddRemoveResourceTagModal
          baseResourceFormUrn={BASE_FORM_CONFIG_URN}
          initialFormDefinition={currentDefinition}
          open={showAddRemoveResourceTagModal}
          onClose={() => {
            setShowAddRemoveResourceTagModal(false);
          }}
          onDelete={(tag: ResourceTagResult) => {
            tag.urn = `${BASE_FORM_CONFIG_URN}/${currentDefinition.id}`;
            dispatch(unTagFormResource(tag));
            setTimeout(() => {
              dispatch(fetchFormResourceTags(`${BASE_FORM_CONFIG_URN}/${currentDefinition.id}`));
            }, 300);
          }}
          onSave={(tag: ResourceTag) => {
            dispatch(tagFormResource({ urn: tag.urn, label: tag.label }));
            setTimeout(() => {
              dispatch(fetchFormResourceTags(`${BASE_FORM_CONFIG_URN}/${currentDefinition.id}`));
            }, 300);
          }}
        ></AddRemoveResourceTagModal>
      )}

      {showDeleteConfirmation && (
        <DeleteModal
          isOpen={showDeleteConfirmation}
          title="Delete form definition"
          content={
            <div>
              Are you sure you wish to delete <b>{currentDefinition?.name}</b>?
            </div>
          }
          onCancel={() => setShowDeleteConfirmation(false)}
          onDelete={() => {
            dispatch(deleteFormDefinition(currentDefinition));
          }}
        />
      )}
    </section>
  );
};
