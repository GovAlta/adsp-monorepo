import React, { useEffect, useState } from 'react';

import { GoAButton, GoACircularProgress } from '@abgov/react-components-new';

import { useDispatch, useSelector } from 'react-redux';
import {
  getFormDefinitions,
  updateFormDefinition,
  deleteFormDefinition,
  openEditorForDefinition,
  fetchFormResourceTags,
  unTagFormResource,
  tagFormResource,
} from '@store/form/action';
import { RootState } from '@store/index';
import { ResourceTagResult, Service } from '@store/directory/models';
import { renderNoItem } from '@components/NoItem';
import { FormDefinitionsTable } from './definitionsList';
import { PageIndicator } from '@components/Indicator';
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

  const navigate = useNavigate();
  const location = useLocation();
  const isNavigatedFromEdit = location.state?.isNavigatedFromEdit;

  const [showDefsFromState, setShowDefsFromState] = useState(isNavigatedFromEdit);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showAddRemoveResourceTagModal, setShowAddRemoveResourceTagModal] = useState(false);

  const [currentDefinition, setCurrentDefinition] = useState(defaultFormDefinition);
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

  // eslint-disable-next-line
  useEffect(() => {}, [indicator]);

  const dispatch = useDispatch();

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
      {formDefinitions && Object.keys(formDefinitions).length > 0 && showFormDefinitions && (
        <>
          <FormDefinitionsTable
            definitions={formDefinitions}
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
            }, 500);
          }}
          onSave={(tag: ResourceTag) => {
            dispatch(tagFormResource({ urn: tag.urn, label: tag.label }));
            setTimeout(() => {
              dispatch(fetchFormResourceTags(`${BASE_FORM_CONFIG_URN}/${currentDefinition.id}`));
            }, 500);
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
