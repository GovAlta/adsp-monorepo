import React, { useEffect } from 'react';
import { OverviewLayout } from '@components/Overview';
import { GoAButton } from '@abgov/react-components-new';
import { fetchFormMetrics } from '@store/form/action';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FormMetrics } from './metrics';

interface FormOverviewProps {
  setOpenAddDefinition: (val: boolean) => void;
}

const FormOverview = ({ setOpenAddDefinition }: FormOverviewProps): JSX.Element => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

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
        <GoAButton
          testId="add-definition"
          onClick={() => {
            setOpenAddDefinition(true);
            navigate('/admin/services/form?definitions=true');
          }}
        >
          Add definition
        </GoAButton>
      }
      extra={<FormMetrics />}
    />
  );
};
export default FormOverview;
