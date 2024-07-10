import React, { useEffect, useState } from 'react';

import { GoAButton } from '@abgov/react-components-new';

import { useDispatch, useSelector } from 'react-redux';
import { getFormDefinitions, updateRefDefinition, deleteFormDefinition, getRefDefinitions } from '@store/form/action';
import { RootState } from '@store/index';
import { renderNoItem } from '@components/NoItem';
import { RefsTable } from './refsList';
import { PageIndicator } from '@components/Indicator';
import { defaultRefDefinition } from '@store/form/model';
import { DeleteModal } from '@components/DeleteModal';
import { AddEditRefs } from './addEditRef';
import { fetchDirectory } from '@store/directory/actions';
interface FormDefinitionsProps {
  openAddDefinition: boolean;
}
export const FormRefs = () => {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [currentDefinition, setCurrentDefinition] = useState(defaultRefDefinition);

  const formDefinitions = useSelector((state: RootState) => {
    return state?.form?.refs;
  });

  const [openAddFormDefinition, setOpenAddFormDefinition] = useState(false);

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const dispatch = useDispatch();

  useEffect(() => {
    if (Object.keys(formDefinitions).length === 0) {
      dispatch(getRefDefinitions());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        Add refs
      </GoAButton>

      <AddEditRefs
        open={openAddFormDefinition}
        isEdit={false}
        onClose={reset}
        initialValue={defaultRefDefinition}
        onSave={(definition) => {
          dispatch(updateRefDefinition(definition));
        }}
      />

      {!indicator.show && !formDefinitions && renderNoItem('form templates')}
      {indicator.show && <PageIndicator />}
      {!indicator.show && Object.keys(formDefinitions).length > 0 && (
        <RefsTable
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
        }}
      />
    </div>
  );
};
