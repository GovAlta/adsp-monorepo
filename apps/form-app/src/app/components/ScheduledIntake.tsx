import { GoACallout } from '@abgov/react-components';
import { FunctionComponent, ReactNode, useEffect } from 'react';
import { FormDefinition } from '../state';
import { FormNotAvailable } from './FormNoAvailable';
import { useSelector, useDispatch } from 'react-redux';
import { userSelector } from '../state';
import { defaultUserFormSelector, findUserForms, AppDispatch } from '../state';

interface ScheduledIntakeProps {
  definition: FormDefinition;
  children: ReactNode;
}

export const ScheduledIntake: FunctionComponent<ScheduledIntakeProps> = ({ definition, children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector(userSelector);
  useEffect(() => {
    if (definition && user) {
      dispatch(findUserForms({ definitionId: definition.id }));
    }
  }, [dispatch, definition, user]);

  const { form } = useSelector(defaultUserFormSelector);
  // Allow through to the form if the form definition doesn't use scheduled intakes, or if there is an active intake.

  const isTester = user?.roles?.includes('urn:ads:platform:form-service:form-tester');
  const hasNoSchedule = !definition.scheduledIntakes;
  const intakeIsOpen = definition.intake && !definition.intake.isUpcoming;
  const formIsLoading = !form?.status;
  const formIsSubmitted = form?.status?.toUpperCase() === 'SUBMITTED';

  const allowForm = hasNoSchedule || intakeIsOpen || isTester || formIsLoading || formIsSubmitted;

  if (allowForm) {
    return children;
  }

  if (definition.intake?.isUpcoming) {
    return (
      <GoACallout mt="2xl" ml="2xl" mr="2xl" mb="2xl" type="information" heading="Upcoming intake">
        This form will be available for applications on {definition.intake.start.toFormat('LLLL d, yyyy')}.
      </GoACallout>
    );
  }

  return <FormNotAvailable />;
};
