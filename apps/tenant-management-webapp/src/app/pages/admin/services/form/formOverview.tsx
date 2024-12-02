import React, { useEffect, useState } from 'react';
import { OverviewLayout } from '@components/Overview';
import { GoAButton } from '@abgov/react-components-new';
import { fetchFormMetrics, openEditorForDefinition, updateFormDefinition } from '@store/form/action';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FormMetrics } from './metrics';
import { AddEditFormDefinition } from './definitions/addEditFormDefinition';
import { defaultFormDefinition } from '@store/form/model';

interface FormOverviewProps {
  setOpenAddDefinition: (val: boolean) => void;
}

const FormOverview = ({ setOpenAddDefinition }: FormOverviewProps): JSX.Element => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [openModal, setOpenModal] = useState<boolean>(false);

  useEffect(() => {
    dispatch(fetchFormMetrics());
  }, [dispatch]);

  return (
    <OverviewLayout
      description={
        <section>
          <p>
            The form service provides capabilities to support user form submission. Form definitions are used to
            describe types of form with roles for applicants, clerks who assist them, and assessors who process the
            submissions.
          </p>
          <p>
            Information is stored in a form model so that applicants can save and resume a draft, and then submit when
            ready.
          </p>
        </section>
      }
      addButton={
        <>
          <GoAButton
            testId="add-definition"
            onClick={() => {
              setOpenModal(true);
            }}
          >
            Add definition
          </GoAButton>
          <AddEditFormDefinition
            open={openModal}
            isEdit={false}
            initialValue={defaultFormDefinition}
            onClose={() => {
              setOpenModal(false);
            }}
            onSave={(definition) => {
              setOpenAddDefinition(false);
              navigate({
                pathname: `edit/${definition.id}`,
                search: '?headless=true',
              });
              dispatch(updateFormDefinition(definition));
              dispatch(openEditorForDefinition(definition.id, definition));
            }}
          />
        </>
      }
      extra={<FormMetrics />}
    />
  );
};
export default FormOverview;
