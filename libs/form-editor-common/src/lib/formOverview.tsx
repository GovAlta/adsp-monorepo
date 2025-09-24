import React, { useEffect } from 'react';
import { OverviewLayout } from './components/OverviewLayout';
import { GoAButton } from '@abgov/react-components';
import { fetchFormMetrics } from './store/form/action';
import { useDispatch, useSelector } from 'react-redux';
import { FormMetrics } from './metrics';
import { RootState } from './store';

interface FormOverviewProps {
  setOpenAddDefinition: (val: boolean) => void;
  setActiveIndex: (index: number) => void;
  activateEdit: boolean;
  openAddDefinition: boolean;
}

const FormOverview = ({ setOpenAddDefinition, setActiveIndex }: FormOverviewProps): JSX.Element => {
  const dispatch = useDispatch();

    const config = useSelector((state: RootState) => state.config);

 
  useEffect(() => {
    setActiveIndex(0);
    //  eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
    if (Object.keys(config).length > 0) {
      dispatch(fetchFormMetrics());
    } 
 
  }, [dispatch, config]);



  return (
    <div>
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
          <GoAButton
            testId="add-definition"
            onClick={() => {
              setActiveIndex(1);
              setOpenAddDefinition(true);
            }}
          >
            Add definition
          </GoAButton>
        }
        extra={<FormMetrics />}
      />
    </div>
  );
};
export default FormOverview;
