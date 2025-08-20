/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import {
  GoAButton,
  GoACircularProgress,
  GoADropdown,
  GoADropdownItem,
  GoAFormItem,
  GoAInput,
  GoAButtonGroup,
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
  resetRegisteredId,
  getFormDefinitionsRegisterId,
} from '@store/form/action';
import { RootState } from '@store/index';
import { ResourceTagFilterCriteria, ResourceTagResult, Service, Tag, ResourceTag } from '@store/directory/models';
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

interface FormDefinitionsProps {
  openAddDefinition: boolean;
  isNavigatedFromEdit?: boolean;
  showFormDefinitions: boolean;
  setOpenAddDefinition: (val: boolean) => void;
}

const titleCase = (s: string) =>
  (s || '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

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

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showAddRemoveResourceTagModal, setShowAddRemoveResourceTagModal] = useState(false);
  const [registerIdSearch, setRegisterIdSearch] = useState('');
  const [openAddFormDefinition, setOpenAddFormDefinition] = useState(false);

  const [ministryFilter, setMinistryFilter] = useState<string>('');

  const [currentDefinition, setCurrentDefinition] = useState(defaultFormDefinition);
  const next = useSelector((state: RootState) => state.form.nextEntries);
  const tagNext = useSelector((state: RootState) => state.form.formResourceTag.nextEntries) || null;
  const formResourceTag = useSelector((state: RootState) => state.form.formResourceTag);
  const selectedTag = useSelector((state: RootState) => state.form?.formResourceTag?.selectedTag as Tag | null);
  const registerIdDefinition = useSelector((state: RootState) => state.form?.registerIdDefinition);

  const tagResources = formResourceTag.tagResources;

  const orderedFormDefinitions = (state: RootState) => {
    const entries = Object.entries(state?.form?.definitions);

    return entries.reduce((tempObj, [formDefinitionId, formDefinitionData]) => {
      tempObj[formDefinitionId] = formDefinitionData;
      return tempObj;
    }, {});
  };

  const formDefinitions = useSelector(orderedFormDefinitions);

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

  const searchRegisterId = () => {
    dispatch(getFormDefinitionsRegisterId(registerIdSearch));
  };

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
    if (registerIdDefinition) return false;
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

  const displayDefinitions = registerIdDefinition ? registerIdDefinition : selectedTag ? tagResources : formDefinitions;

  const ministryOptions = useMemo(() => {
    const set = new Set<string>();
    Object.values(displayDefinitions || {}).forEach((d: any) => {
      if (d?.ministry) set.add(d.ministry);
    });
    return Array.from(set).sort((a, b) => titleCase(a).localeCompare(titleCase(b)));
  }, [displayDefinitions]);

  const filteredDefinitions = useMemo(() => {
    if (!ministryFilter) return displayDefinitions;
    const entries = Object.entries(displayDefinitions || {});
    return entries.reduce((obj, [id, def]: [string, any]) => {
      if (def?.ministry === ministryFilter) obj[id] = def;
      return obj;
    }, {} as Record<string, any>);
  }, [displayDefinitions, ministryFilter]);

  return (
    <section>
      <GoACircularProgress variant="fullscreen" size="small" message="Loading message..."></GoACircularProgress>

      <GoAFormItem label="Filter by tag">
        <GoADropdown
          name="TagFilter"
          value={selectedTag?.value || ''}
          disabled={false}
          onChange={(_, value) => {
            dispatch(resetRegisteredId());
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

      <GoAFormItem label="Filter by ministry">
        <GoADropdown
          name="MinistryFilter"
          width="60ch"
          value={ministryFilter}
          onChange={(_, v) => {
            const value = Array.isArray(v) ? v[0] ?? '' : v;
            setMinistryFilter(value);
          }}
        >
          <GoADropdownItem value="" label="<No Ministry Filter>" />
          {ministryOptions.map((m) => (
            <GoADropdownItem key={m} value={m} label={titleCase(m)} />
          ))}
        </GoADropdown>
      </GoAFormItem>

      <GoAFormItem label="Registered ID" mt="l">
        <GoAButtonGroup alignment="start">
          <GoAInput
            type="text"
            onChange={(_: string, value: string) => setRegisterIdSearch(value)}
            value={registerIdSearch}
            name="register Id Search"
          />

          <GoAButton type="primary" onClick={() => searchRegisterId()} disabled={registerIdSearch.length === 0}>
            Search
          </GoAButton>

          <GoAButton type="secondary" onClick={() => dispatch(resetRegisteredId())} disabled={!registerIdDefinition}>
            Reset
          </GoAButton>
        </GoAButtonGroup>
      </GoAFormItem>

      <br />
      {showFormDefinitions && (
        <GoAButton
          testId="add-definition"
          onClick={() => {
            dispatch(resetRegisteredId());
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
                {getNextEntries() && !ministryFilter && (
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
