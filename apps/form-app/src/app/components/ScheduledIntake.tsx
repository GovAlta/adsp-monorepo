import { GoACallout } from '@abgov/react-components-new';
import { DateTime } from 'luxon';
import { FunctionComponent, ReactNode } from 'react';
import { FormDefinition } from '../state';

interface ScheduledIntakeProps {
  definition: FormDefinition;
  children: ReactNode;
}

export const ScheduledIntake: FunctionComponent<ScheduledIntakeProps> = ({ definition, children }) => {
  // Allow through to the form if the form definition doesn't use scheduled intakes, or if there is an active intake.
  return !definition.scheduledIntakes || (definition.intake && !definition.intake.isUpcoming) ? (
    children
  ) : definition.intake?.isUpcoming ? (
    <GoACallout mt="2xl" ml="2xl" mr="2xl" mb="2xl" type="information" heading="Upcoming intake">
      This form will be available for applications on{' '}
      {DateTime.fromISO(definition.intake.start).toFormat('LLLL dd, yyyy')}.
    </GoACallout>
  ) : (
    <GoACallout mt="2xl" ml="2xl" mr="2xl" mb="2xl" type="information" heading="Not accepting applications">
      This form is not available for applications at this time.
    </GoACallout>
  );
};
