import React, { useEffect, useState } from 'react';
import { OverviewLayout } from '@components/Overview';
import { GoAButton } from '@abgov/react-components-new';
import { fetchFormMetrics, openEditorForDefinition, updateFormDefinition } from '@store/form/action';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { FormMetrics } from './metrics';
import { AddEditFormDefinition } from './definitions/addEditFormDefinition';
import { defaultFormDefinition } from '@store/form/model';
import { FormDefinitions } from './definitions/definitions';

interface FormOverviewProps {
  setOpenAddDefinition: (val: boolean) => void;
  setActiveEdit: (boolean) => void;
  setActiveIndex: (index: number) => void;
  activateEdit: boolean;
  openAddDefinition: boolean;
}

const FormOverview = ({
  setOpenAddDefinition,
  activateEdit,
  setActiveEdit,
  setActiveIndex,
  openAddDefinition,
}: FormOverviewProps): JSX.Element => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const addOpenFormEditor = location.state?.addOpenFormEditor;
  const [addNewFormDefinition, setAddNewFormDefinition] = useState(addOpenFormEditor);

  useEffect(() => {
    setActiveIndex(0);
  }, []);
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
              setActiveEdit(true);
              setActiveIndex(1);
              setOpenAddDefinition(true);
            }}
          >
            Add definition
          </GoAButton>
          <FormDefinitions
            setOpenAddDefinition={setOpenAddDefinition}
            showFormDefinitions={false}
            openAddDefinition={openAddDefinition}
            setActiveEdit={setActiveEdit}
            setActiveIndex={setActiveIndex}
          />
        </>
      }
      extra={<FormMetrics />}
    />
  );
};
export default FormOverview;
