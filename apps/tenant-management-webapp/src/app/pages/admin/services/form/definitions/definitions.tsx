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
import { ResourceTagFilterCriteria, ResourceTagResult, Service, Tag } from '@store/directory/models';
import { renderNoItem } from '@components/NoItem';
import { FormDefinitionsTable } from './definitionsList';
import { Center, IndicatorWithDelay, PageIndicator } from '@components/Indicator';
import { defaultFormDefinition } from '@store/form/model';
import { DeleteModal } from '@components/DeleteModal';
import { AddEditFormDefinition } from './addEditFormDefinition';
import { LoadMoreWrapper } from './style-components';
import { getConfigurationDefinitions } from '@store/configuration/action';
import { useLocation, useNavigate } from 'react-router-dom';
import { AddRemoveResourceTagModal } from './addRemoveResourceTagModal';
import { ResourceTag } from '@store/directory/models';

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
  const NO_TAG_FILTER = {
    label: '<No tag filter>',
    value: '',
  };

  const resourceTagCriteria: ResourceTagFilterCriteria = {
    typeEquals: 'configuration',
    top: 50,
  };

  const navigate = useNavigate();
  const location = useLocation();
  const isNavigatedFromEdit = location.state?.isNavigatedFromEdit;

  const [showDefsFromState, setShowDefsFromState] = useState(isNavigatedFromEdit);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showAddRemoveResourceTagModal, setShowAddRemoveResourceTagModal] = useState(false);

  const [currentDefinition, setCurrentDefinition] = useState(defaultFormDefinition);
  const next = useSelector((state: RootState) => state.form.nextEntries);
  const tagNext = useSelector((state: RootState) => state.form.formResourceTag.nextEntries) || null;
  const formResourceTag = useSelector((state: RootState) => state.form.formResourceTag);
  const selectedTag = useSelector((state: RootState) => state.form?.formResourceTag?.selectedTag as Tag | null);

  const tagResources = formResourceTag.tagResources;

  const orderedFormDefinitions = (state: RootState) => {
    const entries = Object.entries(state?.form?.definitions);

    return entries.reduce((tempObj, [formDefinitionId, formDefinitionData]) => {
      tempObj[formDefinitionId] = formDefinitionData;
      return tempObj;
    }, {});
  };

  const formDefinitions = useSelector(orderedFormDefinitions);

  const [openAddFormDefinition, setOpenAddFormDefinition] = useState(false);

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const tags = useSelector((state: RootState) => state.form.formResourceTag.tags || []);
  const tagsLoading = useSelector((state: RootState) => state.form.formResourceTag.tagsLoading);

  const selectConfigurationHost = (state: RootState) => {
    return (state?.directory?.directory?.filter(
      (y) => y.service === CONFIGURATION_SERVICE && y.namespace?.toLowerCase() === 'platform' && y.urn.endsWith('v2')
    )[0] ?? []) as Service;
  };
  const resourceConfiguration = useSelector(selectConfigurationHost);
  const BASE_FORM_CONFIG_URN = `${resourceConfiguration.urn}:/configuration/form-service`;
  const dispatch = useDispatch();

  // eslint-disable-next-line
  useEffect(() => {}, [indicator]);

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
    if (!tags || tags?.length === 0) {
      dispatch(fetchAllTags());
    }

    if (!formDefinitions || Object.keys(formDefinitions).length === 0) {
      dispatch(getFormDefinitions());
    }

    if (selectedTag && Object.keys(tagResources).length === 0) {
      dispatch(fetchResourcesByTag(selectedTag?.value, resourceTagCriteria));
    }

    return () => {
      const currentHref = location.pathname;
      const redirectHref = window.location.href;
      if (currentHref !== redirectHref && !redirectHref.includes('?headless')) {
        dispatch(setSelectedTag(null));
      }
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if ((!tagsLoading && indicator.show && tags === undefined) || tags === null) {
      dispatch(fetchAllTags());
    }
  }, [dispatch, tagsLoading, indicator, tags]);

  const onNext = () => {
    if (!selectedTag) {
      dispatch(getFormDefinitions(next));
    } else {
      dispatch(fetchResourcesByTag(selectedTag.value, resourceTagCriteria, tagNext));
    }
  };

  useEffect(() => {
    document.body.style.overflow = 'unset';
  }, [formDefinitions]);

  useEffect(() => {
    if (!indicator.show) {
      setShowDeleteConfirmation(false);
    }
  }, [indicator.show]);

  const getNextEntries = () => {
    if (selectedTag) return tagNext;
    return next;
  };

  const renderNoItems = () => {
    if (indicator.show && !selectedTag && Object.keys(formDefinitions).length === 0) {
      return <PageIndicator />;
    }

    if (selectedTag && tagResources && !tagNext && Object.keys(tagResources)?.length >= 0 && tagsLoading) {
      return (
        <Center>
          <IndicatorWithDelay message={`Fetching form definitions for tag: ${selectedTag.label}...`} pageLock={false} />
        </Center>
      );
    }

    if (tagResources === null && !indicator.show && selectedTag && selectedTag.label !== '') {
      return renderNoItem('form definitions');
    }

    if (!indicator.show && Object.keys(formDefinitions).length > 0 && selectedTag && selectedTag.label === '') {
      return renderNoItem('form definitions');
    }
    return null;
  };

  return (
    <section>
      <GoACircularProgress variant="fullscreen" size="small" message="Loading message..."></GoACircularProgress>

      <GoAFormItem label="Filter by tag">
        <GoADropdown
          name="TagFilter"
          value={selectedTag?.value || ''}
          disabled={false}
          onChange={(_, value) => {
            const selectedTagObj = tags.find((tag) => tag?.value === value);
            if (selectedTagObj) {
              dispatch(setSelectedTag(selectedTagObj));
              setTimeout(() => {
                dispatch(fetchResourcesByTag(selectedTagObj.value, resourceTagCriteria));
              }, 300);
            } else {
              dispatch(setSelectedTag(null));
            }
          }}
          width="60ch"
        >
          <GoADropdownItem value={NO_TAG_FILTER.value} label={NO_TAG_FILTER.label} />
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

      {renderNoItems()}

      {formDefinitions &&
        showFormDefinitions &&
        ((!selectedTag && Object.keys(formDefinitions).length > 0) ||
          (selectedTag && Object.keys(tagResources ?? {}).length > 0)) && (
          <>
            <FormDefinitionsTable
              definitions={selectedTag ? tagResources : formDefinitions}
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
            {getNextEntries() && (
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
