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
} from '../store/form/action';
import { RootState } from '../store';
import { ResourceTagFilterCriteria, ResourceTagResult, Service, Tag, ResourceTag } from '../store/directory/models';
import { renderNoItem } from '../components/NoItem';
import { FormDefinitionsTable } from './definitionsList';
import { Center, IndicatorWithDelay, PageIndicator } from '../components/Indicator';
import { defaultFormDefinition } from '../store/form/model';
import { DeleteModal } from '../components/DeleteModal';
import { AddEditFormDefinition } from './addEditFormDefinition';
import { LoadMoreWrapper } from './style-components';
import { getConfigurationDefinitions } from '../store/configuration/action';
import { useLocation, useNavigate } from 'react-router-dom';
import { AddRemoveResourceTagModal } from './addRemoveResourceTagModal';

interface FormDefinitionsProps {
  openAddDefinition: boolean;
  showFormDefinitions: boolean;
  setOpenAddDefinition: (val: boolean) => void;
  features: Features,
}

interface Features {
  filterByTag: boolean;
  filterByProgram: boolean;
  filterByMinistry: boolean;
  registeredID: boolean;
  searchActsOfLegislation: boolean;
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
  features,
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
  const [programFilter, setProgramFilter] = useState<string>('');
  const [filteredVisibleCount, setFilteredVisibleCount] = useState<number>(10);
  const [actSearch, setActSearch] = useState<string>('');

  const [currentDefinition, setCurrentDefinition] = useState(defaultFormDefinition);
  const next = useSelector((state: RootState) => state.form.nextEntries);
  const tagNext = useSelector((state: RootState) => state.form.formResourceTag.nextEntries) || null;
  const formResourceTag = useSelector((state: RootState) => state.form.formResourceTag);
  const selectedTag = useSelector((state: RootState) => state.form?.formResourceTag?.selectedTag as Tag | null);
  const registerIdDefinition = useSelector((state: RootState) => state.form?.registerIdDefinition);
  const config = useSelector((state: RootState) => state.config);

  const tagResources = formResourceTag.tagResources;

  const orderedFormDefinitions = (state: RootState) => {
    const entries = Object.entries(state?.form?.definitions);

    return entries.reduce((tempObj, [formDefinitionId, formDefinitionData]) => {
      tempObj[formDefinitionId] = formDefinitionData;
      return tempObj;
    }, {} as Record<string, any>);
  };

  const formDefinitions = useSelector(orderedFormDefinitions);

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const tags = useSelector((state: RootState) => state.form.formResourceTag.tags || []);
  const tagsLoading = useSelector((state: RootState) => state.form.formResourceTag.tagsLoading);
  const directory = useSelector((state: RootState) => state.directory);

  const selectConfigurationHost = (state: RootState) => {
    return (state?.directory?.directory?.filter(
      (y) => y.service === CONFIGURATION_SERVICE && y.namespace?.toLowerCase() === 'platform' && y.urn.endsWith('v2')
    )[0] ?? []) as Service;
  };
  const resourceConfiguration = useSelector(selectConfigurationHost);
  const BASE_FORM_CONFIG_URN = `${resourceConfiguration.urn}:/configuration/form-service`;
  const dispatch = useDispatch();

  const normalize = (s: string) =>
    (s ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  const defHasActMatch = (def: any, q: string) => {
    if (!q) return true;
    const acts: string[] = Array.isArray(def?.actsOfLegislation) ? def.actsOfLegislation : [];
    const n = normalize(q);
    return acts.some((a) => normalize(a).includes(n));
  };

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
    if (Object.keys(config).length > 0) {
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
    }
    // eslint-disable-next-line
  }, [config]);

  useEffect(() => {
    if (Object.keys(config).length > 0) {
      if ((!tagsLoading && indicator.show && tags === undefined) || tags === null) {
        dispatch(fetchAllTags());
      }
    }
  }, [dispatch, tagsLoading, indicator, tags, config]);

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

  const getProgramFromDef = (def: any): { id: string; label: string } => {
    const id = def?.programId ?? def?.program?.id ?? def?.program ?? def?.programName ?? '';
    const label =
      def?.programName ??
      def?.program?.name ??
      (typeof def?.program === 'string' ? def.program : '') ??
      (typeof id === 'string' ? id : '');
    return { id: String(id ?? '').trim(), label: String(label ?? '').trim() };
  };

  const programOptions = useMemo(() => {
    const seen = new Map<string, string>();
    Object.values(displayDefinitions || {}).forEach((d: any) => {
      const { id, label } = getProgramFromDef(d);
      if (id) {
        if (!seen.has(id) || (seen.get(id) || '').toLowerCase() === id.toLowerCase()) {
          seen.set(id, label || id);
        }
      }
    });
    return Array.from(seen.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [displayDefinitions]);

  const ministryOptions = useMemo(() => {
    const set = new Set<string>();
    Object.values(displayDefinitions || {}).forEach((d: any) => {
      if (d?.ministry) set.add(d.ministry);
    });
    return Array.from(set).sort((a, b) => titleCase(a).localeCompare(titleCase(b)));
  }, [displayDefinitions]);

  const filteredDefinitions = useMemo(() => {
    const entries = Object.entries(displayDefinitions || {});
    const hasProgram = !!programFilter;
    const hasMinistry = !!ministryFilter;
    const hasActs = !!actSearch.trim();

    if (!hasProgram && !hasMinistry && !hasActs) return displayDefinitions;

    const q = actSearch.trim();

    return entries.reduce((obj, [id, def]: [string, any]) => {
      if (hasMinistry && def?.ministry !== ministryFilter) return obj;

      if (hasProgram) {
        const { id: progId } = getProgramFromDef(def);
        if (!progId || progId !== programFilter) return obj;
      }

      if (hasActs && !defHasActMatch(def, q)) return obj;

      obj[id] = def;
      return obj;
    }, {} as Record<string, any>);
  }, [displayDefinitions, ministryFilter, programFilter, actSearch]);

  useEffect(() => {
    setFilteredVisibleCount(10);
  }, [programFilter, ministryFilter, actSearch]);

  const filteredEntriesAll = useMemo(() => Object.entries(filteredDefinitions || {}), [filteredDefinitions]);

  const limitedFilteredDefinitions = useMemo(() => {
    const entries = filteredEntriesAll;
    const anyFilter = !!programFilter || !!ministryFilter || !!actSearch.trim();

    if (!anyFilter) return filteredDefinitions;
    if (entries.length <= filteredVisibleCount) return filteredDefinitions;

    const sliced = entries.slice(0, filteredVisibleCount);
    return sliced.reduce((obj, [id, def]) => {
      obj[id] = def;
      return obj;
    }, {} as Record<string, any>);
  }, [filteredDefinitions, filteredEntriesAll, programFilter, ministryFilter, actSearch, filteredVisibleCount]);

  const hasMoreFiltered = useMemo(() => {
    const anyFilter = !!programFilter || !!ministryFilter || !!actSearch.trim();
    if (!anyFilter) return false;
    return filteredEntriesAll.length > filteredVisibleCount;
  }, [filteredEntriesAll, programFilter, ministryFilter, actSearch, filteredVisibleCount]);

  return (
    <section>
      <GoACircularProgress variant="fullscreen" size="small" message="Loading message..."></GoACircularProgress>

       {features.filterByTag &&<GoAFormItem label="Filter by tag" mb={'s'}>
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
      </GoAFormItem>}

        {features.filterByProgram && 
        (<GoAFormItem label="Filter by program" mb={'s'}>
        <GoADropdown
          name="ProgramFilter"
          width="60ch"
          value={programFilter}
          onChange={(_, v) => {
            const value = Array.isArray(v) ? v[0] ?? '' : v;
            dispatch(resetRegisteredId());
            setProgramFilter(value);
          }}
        >
          <GoADropdownItem value="" label="<No Program Filter>" />
          {programOptions.map((p) => (
            <GoADropdownItem key={p.id} value={p.id} label={p.label || p.id} />
          ))}
        </GoADropdown>
      </GoAFormItem>)}

       {features.filterByMinistry && <GoAFormItem label="Filter by ministry" mb={'s'}>
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
      </GoAFormItem>}

      {features.registeredID && <GoAFormItem label="Registered ID" mb="s">
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
      </GoAFormItem>}
      {features.searchActsOfLegislation && <GoAFormItem label="Search Acts of Legislation" mb={'l'}>
        {/* please make sure the last filter or search should be l margin bottom */}
        <GoAInput
          type="search"
          name="ActsSearch"
          width="60ch"
          value={actSearch}
          testId="acts-search"
          aria-label="Search Acts of Legislation"
          onChange={(_, v) => setActSearch(v)}
        />
      </GoAFormItem>}

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
                  definitions={limitedFilteredDefinitions}
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
                {getNextEntries() && !ministryFilter && !programFilter && !actSearch.trim() && (
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
                {(programFilter || ministryFilter || actSearch.trim()) && hasMoreFiltered && (
                  <LoadMoreWrapper>
                    <GoAButton
                      testId="form-filtered-load-more-btn"
                      key="form-filtered-load-more-btn"
                      type="tertiary"
                      onClick={() => setFilteredVisibleCount((c) => c + 10)}
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
