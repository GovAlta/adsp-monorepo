import { GoabCallout } from '@abgov/react-components-ds1';

export const UserNotAuthorized = () => {
  return (
    <GoabCallout mt="2xl" ml="2xl" mr="2xl" mb="2xl" type="information" heading="Access restricted">
      You don't have permission to view this form. Please contact your administrator for access.
    </GoabCallout>
  );
};
