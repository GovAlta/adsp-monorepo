import { GoabCallout } from '@abgov/react-components';

export const FormDoesNotExist = () => {
  return (
    <GoabCallout mt="2xl" ml="2xl" mr="2xl" mb="2xl" type="information" heading="Form not found">
      There is not a form associated with this link. Please check the URL and try again, or contact your administrator
      for assistance.
    </GoabCallout>
  );
};
