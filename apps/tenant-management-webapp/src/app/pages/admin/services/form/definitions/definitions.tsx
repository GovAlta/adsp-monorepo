import React, { useEffect, useState } from 'react';

import { GoAButton } from '@abgov/react-components-new';

import { useDispatch, useSelector } from 'react-redux';
import { getFormDefinitions, updateFormDefinition, deleteFormDefinition } from '@store/form/action';
import { RootState } from '@store/index';
import { renderNoItem } from '@components/NoItem';
import { FormDefinitionsTable } from './definitionsList';
import { PageIndicator } from '@components/Indicator';
import { defaultFormDefinition } from '@store/form/model';
import { DeleteModal } from '@components/DeleteModal';
import { AddEditFormDefinition } from './addEditFormDefinition';
import { fetchDirectory } from '@store/directory/actions';
import { LoadMoreWrapper } from './style-components';
interface FormDefinitionsProps {
  openAddDefinition: boolean;
}
const FORM_APPLICANT_SERVICE_ID = `urn:ads:platform:form-service:form-applicant`;

export const FormDefinitions = ({ openAddDefinition }: FormDefinitionsProps) => {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [currentDefinition, setCurrentDefinition] = useState(defaultFormDefinition);
  const next = useSelector((state: RootState) => state.form.nextEntries);

  const formDefinitions = useSelector((state: RootState) => {
    return Object.entries(state?.form?.definitions).reduce((tempObj, [formDefinitionId, formDefinitionData]) => {
      tempObj[formDefinitionId] = formDefinitionData;
      return tempObj;
    }, {});
  });

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
    dispatch(getFormDefinitions());
    dispatch(fetchDirectory());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const onNext = () => {
    dispatch(getFormDefinitions(next));
  };

  const reset = () => {
    setOpenAddFormDefinition(false);
  };

  useEffect(() => {
    document.body.style.overflow = 'unset';
  }, []);

  const doesNotContainFormRolesToAdd = (role: string, applicantFormRoles: string[]) => {
    if (applicantFormRoles.length === 0) return false;
    return applicantFormRoles.filter((roleToCheck) => roleToCheck === role).length === 0;
  };

  return (
    <div>
      <GoAButton
        testId="add-definition"
        onClick={() => {
          setOpenAddFormDefinition(true);
        }}
        mt={'xl'}
        mb={'xl'}
      >
        Add definition
      </GoAButton>

      <AddEditFormDefinition
        open={openAddFormDefinition}
        isEdit={false}
        onClose={reset}
        initialValue={defaultFormDefinition}
        onSave={(definition) => {
          if (!doesNotContainFormRolesToAdd(FORM_APPLICANT_SERVICE_ID, definition.applicantRoles)) {
            definition.applicantRoles.push(FORM_APPLICANT_SERVICE_ID);
          }

          dispatch(updateFormDefinition(definition));
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
          setShowDeleteConfirmation(false);
          dispatch(deleteFormDefinition(currentDefinition));
        }}
      />
    </div>
  );
};
