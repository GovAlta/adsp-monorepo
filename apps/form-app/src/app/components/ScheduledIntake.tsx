import { GoACallout } from '@abgov/react-components';
import { FunctionComponent, ReactNode } from 'react';
import { FormDefinition } from '../state';
import { FormNotAvailable } from './FormNoAvailable';
import { useSelector } from 'react-redux';
import { userSelector } from '../state';

interface ScheduledIntakeProps {
  definition: FormDefinition;
  children: ReactNode;
}

export const ScheduledIntake: FunctionComponent<ScheduledIntakeProps> = ({ definition, children }) => {
  const { user } = useSelector(userSelector);
  // Allow through to the form if the form definition doesn't use scheduled intakes, or if there is an active intake.
  return !definition.scheduledIntakes ||
    (definition.intake && !definition.intake.isUpcoming) ||
    user?.roles?.includes('urn:ads:platform:form-service:form-tester') ? (
    children
  ) : definition.intake?.isUpcoming ? (
    <GoACallout mt="2xl" ml="2xl" mr="2xl" mb="2xl" type="information" heading="Upcoming intake">
      This form will be available for applications on {definition.intake.start.toFormat('LLLL d, yyyy')}.
    </GoACallout>
  ) : (
    <FormNotAvailable />
  );
};
