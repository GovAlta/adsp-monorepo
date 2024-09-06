import React, { useEffect, useState } from 'react';

import { GoAButton, GoACircularProgress } from '@abgov/react-components-new';

import { useDispatch, useSelector } from 'react-redux';
import {
  getFormDefinitions,
  updateFormDefinition,
  deleteFormDefinition,
  openEditorForDefinition,
} from '@store/form/action';
import { RootState } from '@store/index';
import { renderNoItem } from '@components/NoItem';
import { FormDefinitionsTable } from './definitionsList';
import { PageIndicator } from '@components/Indicator';
import { defaultFormDefinition } from '@store/form/model';
import { DeleteModal } from '@components/DeleteModal';
import { AddEditFormDefinition } from './addEditFormDefinition';
import { fetchDirectory } from '@store/directory/actions';
import { LoadMoreWrapper } from './style-components';
import { getConfigurationDefinitions } from '@store/configuration/action';
import { useLocation, useNavigate } from 'react-router-dom';

interface FormDefinitionsProps {
  openAddDefinition: boolean;
  isNavigatedFromEdit?: boolean;
}

export const FormDefinitions = ({ openAddDefinition }: FormDefinitionsProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isNavigatedFromEdit = location.state?.isNavigatedFromEdit;

  const [showDefsFromState, setShowDefsFromState] = useState(isNavigatedFromEdit);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
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

  // eslint-disable-next-line
  useEffect(() => {}, [indicator]);

  const dispatch = useDispatch();

  useEffect(() => {
    if (openAddDefinition) {
      setOpenAddFormDefinition(true);
    }
  }, [openAddDefinition]);

  useEffect(() => {
    document.body.style.overflow = 'unset';
    dispatch(getConfigurationDefinitions());
    const hasFormDefinitions = Object.keys(formDefinitions).length > 0;

    if (!showDefsFromState && !hasFormDefinitions) {
      dispatch(getFormDefinitions());
    }

    dispatch(fetchDirectory());
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

  const deleteAction = () => {
    dispatch(deleteFormDefinition(currentDefinition));
  };
  useEffect(() => {
    if (!indicator.show) {
      setShowDeleteConfirmation(false);
    }
  }, [indicator.show]);

  return (
    <section>
      <GoACircularProgress variant="fullscreen" size="small" message="Loading message..."></GoACircularProgress>
      <GoAButton
        testId="add-definition"
        onClick={() => {
          setOpenAddFormDefinition(true);
        }}
        mb={'l'}
      >
        Add definition
      </GoAButton>
      <AddEditFormDefinition
        open={openAddFormDefinition}
        isEdit={false}
        onClose={() => {
          setOpenAddFormDefinition(false);
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

      {!indicator.show && !formDefinitions && renderNoItem('form templates')}
      {/* {indicator.show && <PageIndicator />} */}
      {formDefinitions && Object.keys(formDefinitions).length > 0 && (
        <>
          <FormDefinitionsTable
            definitions={formDefinitions}
            onDelete={(currentTemplate) => {
              setShowDeleteConfirmation(true);
              setCurrentDefinition(currentTemplate);
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

      <DeleteModal
        isOpen={showDeleteConfirmation}
        title="Delete form definition"
        content={
          <div>
            Are you sure you wish to delete <b>{`${currentDefinition?.name}?`}</b>
          </div>
        }
        onCancel={() => setShowDeleteConfirmation(false)}
        onDelete={() => {
          dispatch(deleteFormDefinition(currentDefinition));
        }}
      />
    </section>
  );
};
