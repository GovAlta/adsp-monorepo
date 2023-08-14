import React, { useEffect } from 'react';
import { OverviewLayout } from '@components/Overview';
import { GoAButton } from '@abgov/react-components';
import { useRouteMatch } from 'react-router';
import { useHistory } from 'react-router-dom';

interface FormOverviewProps {
  setActiveIndex: (index: number) => void;
  setOpenAddDefinition: (val: boolean) => void;
}

const FormOverview = ({ setActiveIndex, setOpenAddDefinition }: FormOverviewProps): JSX.Element => {
  useEffect(() => {
    setActiveIndex(0);
  }, []);
  const { url } = useRouteMatch();

  useEffect(() => {
    setOpenAddDefinition(false);

    history.push({
      pathname: '/admin/services/form',
    });
  }, []);

  const history = useHistory();

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
            data-testid="add-definition"
            onClick={() => {
              history.push(`${url}/new?definitions=true`);
            }}
          >
            Add definition
          </GoAButton>
        </>
      }
    />
  );
};
export default FormOverview;
