import React, { useEffect, useState } from 'react';
import { AddEditFormDefinition } from './addEditFormDefinition';
import { GoAButton } from '@abgov/react-components';
import { useDispatch, useSelector } from 'react-redux';
import { getFormDefinitions, updateFormDefinition } from '@store/form/action';
import { RootState } from '@store/index';
import { renderNoItem } from '@components/NoItem';
import { FormDefinitionsTable } from './definitionsList';
import { PageIndicator } from '@components/Indicator';
import { defaultFormDefinition } from '@store/form/model';

interface FormDefinitionsProps {
  openAddDefinition: boolean;
}
export const FormDefinitions = ({ openAddDefinition }: FormDefinitionsProps) => {
  const [openAddFormDefinition, setOpenAddFormDefinition] = useState(false);

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

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const dispatch = useDispatch();

  const reset = () => {
    setOpenAddFormDefinition(false);
  };

  useEffect(() => {
    if (openAddDefinition) {
      setOpenAddFormDefinition(true);
    }
  }, [openAddDefinition]);
  useEffect(() => {
    dispatch(getFormDefinitions());
  }, []);

  // eslint-disable-next-line
  useEffect(() => {}, [formDefinitions]);

  return (
    <>
      <div>
        <br />
        <GoAButton
          data-testid="add-definition"
          onClick={() => {
            setOpenAddFormDefinition(true);
          }}
        >
          Add definition
        </GoAButton>
        <br />
        <br />
        <PageIndicator />
        {openAddFormDefinition && (
          <AddEditFormDefinition
            open={openAddFormDefinition}
            isEdit={false}
            onClose={reset}
            initialValue={defaultFormDefinition}
            onSave={(definition) => {
              dispatch(updateFormDefinition(definition));
            }}
          />
        )}
        {!indicator.show && !formDefinitions && renderNoItem('form templates')}
        {!indicator.show && formDefinitions && <FormDefinitionsTable definitions={formDefinitions} />}
      </div>
    </>
  );
};
