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
interface FormDefinitionsProps {
  openAddDefinition: boolean;
}
export const FormDefinitions = ({ openAddDefinition }: FormDefinitionsProps) => {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [currentDefinition, setCurrentDefinition] = useState(defaultFormDefinition);

  const formDefinitions = useSelector((state: RootState) => {
    return Object.entries(state?.form?.definitions)
      .sort((template1, template2) => {
        return template1[1].name.localeCompare(template2[1].name);
      })
      .reduce((tempObj, [formDefinitionId, formDefinitionData]) => {
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
    if (Object.keys(formDefinitions).length === 0) {
      dispatch(getFormDefinitions());
      dispatch(fetchDirectory());
    }
  }, [dispatch]);

  const reset = () => {
    setOpenAddFormDefinition(false);
  };

  useEffect(() => {
    document.body.style.overflow = 'unset';
  }, []);

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
          dispatch(updateFormDefinition(definition));
        }}
      />

      {!indicator.show && !formDefinitions && renderNoItem('form templates')}
      {indicator.show && <PageIndicator />}
      {!indicator.show && Object.keys(formDefinitions).length > 0 && (
        <FormDefinitionsTable
          definitions={formDefinitions}
          onDelete={(currentTemplate) => {
            setShowDeleteConfirmation(true);
            setCurrentDefinition(currentTemplate);
          }}
        />
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
