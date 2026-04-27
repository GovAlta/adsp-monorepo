/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import {
  GoabButton,
  GoabCircularProgress,
  GoabDropdown,
  GoabDropdownItem,
  GoabFormItem,
  GoabInput,
} from '@abgov/react-components';

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
  deleteResourceTags,
} from '@store/form/action';
import { RootState } from '@store/index';
import { ResourceTagFilterCriteria, ResourceTagResult, Service, Tag, ResourceTag } from '@store/directory/models';
import { renderNoItem } from '@components/NoItem';
import { FormDefinitionsTable } from './definitionsList';
import { Center, IndicatorWithDelay, PageIndicator } from '@components/Indicator';
import { defaultFormDefinition } from '@store/form/model';
import { DeleteModal } from '@components/DeleteModal';
import { AddEditFormDefinition } from './addEditFormDefinition';
import { LoadMoreWrapper, SearchRow, SearchInputWrapper } from './style-components';
import { getConfigurationDefinitions } from '@store/configuration/action';
import { useLocation, useNavigate } from 'react-router-dom';
import { AddRemoveResourceTagModal } from './addRemoveResourceTagModal';
import { GoabDropdownOnChangeDetail } from '@abgov/ui-components-common';

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

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showAddRemoveResourceTagModal, setShowAddRemoveResourceTagModal] = useState(false);
  const [openAddFormDefinition, setOpenAddFormDefinition] = useState(false);
  const [currentDefinition, setCurrentDefinition] = useState(defaultFormDefinition);
  const [searchInput, setSearchInput] = useState('');
  const next = useSelector((state: RootState) => state.form.nextEntries);
  const tagNext = useSelector((state: RootState) => state.form.formResourceTag.nextEntries) || null;
  const formResourceTag = useSelector((state: RootState) => state.form.formResourceTag);
  const selectedTag = useSelector((state: RootState) => state.form?.formResourceTag?.selectedTag as Tag | null);
  const tagResources = formResourceTag.tagResources;

  const orderedFormDefinitions = (state: RootState) => {
    const entries = Object.entries(state?.form?.definitions);

    return entries.reduce(
      (tempObj, [formDefinitionId, formDefinitionData]) => {
        tempObj[formDefinitionId] = formDefinitionData;
        return tempObj;
      },
      {} as Record<string, any>,
    );
  };

  const formDefinitions = useSelector(orderedFormDefinitions);

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const tags = useSelector((state: RootState) => state.form.formResourceTag.tags || []);
  const tagsLoading = useSelector((state: RootState) => state.form.formResourceTag.tagsLoading);

  const selectConfigurationHost = (state: RootState) => {
    return (state?.directory?.directory?.filter(
      (y) => y.service === CONFIGURATION_SERVICE && y.namespace?.toLowerCase() === 'platform' && y.urn.endsWith('v2'),
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

  const displayDefinitions = selectedTag ? tagResources : formDefinitions;

  const filteredDefinitions = useMemo(() => {
    return displayDefinitions || {};
  }, [displayDefinitions]);

  return (
    <section>
      <GoabCircularProgress variant="fullscreen" size="small" message="Loading message..."></GoabCircularProgress>

      <SearchRow>
        <SearchInputWrapper>
          <GoabFormItem label="Search by name" mb={'m'}>
            <GoabInput
              name="form-definition-search"
              value={searchInput}
              placeholder="Search form definitions..."
              width="100%"
              trailingIcon={searchInput ? 'close-circle' : undefined}
              onTrailingIconClick={() => {
                setSearchInput('');
                dispatch(getFormDefinitions());
              }}
              onChange={(detail) => setSearchInput(detail.value)}
              onKeyPress={(detail) => {
                if (detail.key === 'Enter') {
                  dispatch(getFormDefinitions(undefined, searchInput || undefined));
                }
              }}
              testId="form-definition-search-input"
            />
          </GoabFormItem>
        </SearchInputWrapper>
        <GoabButton
          type="primary"
          mb={'m'}
          testId="form-definition-search-btn"
          onClick={() => dispatch(getFormDefinitions(undefined, searchInput || undefined))}
        >
          Search
        </GoabButton>
      </SearchRow>

      <GoabFormItem label="Filter by tag" mb={'l'}>
        <GoabDropdown
          name="TagFilter"
          value={selectedTag?.value || ''}
          disabled={false}
          onChange={(detail: GoabDropdownOnChangeDetail) => {
            const selectedTagObj = tags.find((tag) => tag?.value === detail.value);
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
          <GoabDropdownItem value={NO_TAG_FILTER.value} label={NO_TAG_FILTER.label} />
          {tags
            .sort((a, b) => a.label.localeCompare(b.label))
            .map((tag) => (
              <GoabDropdownItem key={tag.urn} value={tag.value} label={tag.label} />
            ))}
        </GoabDropdown>
      </GoabFormItem>

      {showFormDefinitions && (
        <GoabButton
          testId="add-definition"
          onClick={() => {
            setOpenAddFormDefinition(true);
          }}
          mb={'l'}
        >
          Add definition
        </GoabButton>
      )}

      <AddEditFormDefinition
        open={openAddFormDefinition}
        isEdit={false}
        onClose={() => {
          setOpenAddFormDefinition(false);
          setOpenAddDefinition(false);
        }}
        initialValue={defaultFormDefinition}
        onSave={(definition, tags) => {
          setOpenAddFormDefinition(false);
          navigate({
            pathname: `edit/${definition.id}`,
            search: '?headless=true',
          });
          dispatch(updateFormDefinition(definition));
          dispatch(openEditorForDefinition(definition.id, definition));

          if (tags && tags.length > 0) {
            const urn = `${BASE_FORM_CONFIG_URN}/${definition.id}`;
            tags.forEach((tagLabel) => {
              dispatch(tagFormResource({ urn, label: tagLabel }, false));
            });
          }
        }}
      />

      {renderNoItems()}

      {formDefinitions &&
        showFormDefinitions &&
        ((!selectedTag && Object.keys(formDefinitions).length > 0) ||
          (selectedTag && Object.keys(tagResources ?? {}).length > 0)) && (
          <>
            {Object.keys(filteredDefinitions || {}).length > 0 ? (
              <>
                <FormDefinitionsTable
                  definitions={filteredDefinitions}
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
                    <GoabButton
                      testId="form-event-load-more-btn"
                      key="form-event-load-more-btn"
                      type="tertiary"
                      onClick={onNext}
                    >
                      Load more
                    </GoabButton>
                  </LoadMoreWrapper>
                )}
              </>
            ) : (
              renderNoItem('form definition')
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
          onSave={(tag: ResourceTag, isTagAdded: boolean) => {
            dispatch(tagFormResource({ urn: tag.urn, label: tag.label }, isTagAdded));
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
            const urn = `${BASE_FORM_CONFIG_URN}/${currentDefinition.id}`;
            dispatch(deleteResourceTags(urn, currentDefinition.id));
            dispatch(deleteFormDefinition(currentDefinition));
          }}
        />
      )}
    </section>
  );
};
