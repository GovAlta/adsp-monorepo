import React, { useContext } from 'react';
import { ControlProps } from '@jsonforms/core';
import { AddressViews } from './AddressViews';
import { JsonFormsStepperContext } from '../FormStepper/context/StepperContext';
import { PageReviewNameCol } from '../Inputs/style-component';
import { GoabButton } from '@abgov/react-components';

type AddressViewProps = ControlProps;

export const AddressLookUpControlReview = (props: AddressViewProps): JSX.Element => {
  const { data, schema } = props;

  const isAlbertaAddress = schema?.properties?.subdivisionCode?.const === 'AB';

  return <AddressViews data={data} isAlbertaAddress={isAlbertaAddress} />;
};

export const AddressLoopUpControlTableReview = (props: AddressViewProps): JSX.Element => {
  const { data, schema, uischema } = props;

  // eslint-disable-next-line
  const stepId = uischema.options?.stepId;
  const formStepperCtx = useContext(JsonFormsStepperContext);
  const isAlbertaAddress = schema?.properties?.subdivisionCode?.const === 'AB';

  const provinces = [
    { value: 'AB', label: 'Alberta' },
    { value: 'BC', label: 'British Columbia' },
    { value: 'MB', label: 'Manitoba' },
    { value: 'NB', label: 'New Brunswick' },
    { value: 'NL', label: 'Newfoundland and Labrador' },
    { value: 'NS', label: 'Nova Scotia' },
    { value: 'NT', label: 'Northwest Territories' },
    { value: 'NU', label: 'Nunavut' },
    { value: 'ON', label: 'Ontario' },
    { value: 'PE', label: 'Prince Edward Island' },
    { value: 'QC', label: 'Quebec' },
    { value: 'SK', label: 'Saskatchewan' },
    { value: 'YT', label: 'Yukon' },
  ];

  const provinceLabel = isAlbertaAddress
    ? 'Alberta'
    : provinces.find((p) => p.value === data?.subdivisionCode)?.label || data?.subdivisionCode;

  const renderRow = (label: string, value: string | undefined) => (
    <tr>
      <PageReviewNameCol>{label}</PageReviewNameCol>
      <PageReviewNameCol>{value}</PageReviewNameCol>
      <td className="goa-table-width-limit">
        <GoabButton type="tertiary" size="compact" onClick={() => formStepperCtx?.goToPage(stepId)}>
          Change
        </GoabButton>
      </td>
    </tr>
  );

  return (
    <>
      <tr data-testid="address-lookup-table-review">
        <PageReviewNameCol>
          <strong>{`${isAlbertaAddress ? 'Alberta' : 'Canada'} postal address`}</strong>
        </PageReviewNameCol>
        <td style={{ verticalAlign: 'top' }}></td>
        <td className="goa-table-width-limit"></td>
      </tr>
      {renderRow('Address line 1', data?.addressLine1)}
      {data?.addressLine2 && renderRow('Address line 2', data.addressLine2)}
      {renderRow('City', data?.municipality)}
      {renderRow('Postal Code', data?.postalCode)}
      {renderRow('Province', provinceLabel)}
      {renderRow('Country', 'Canada')}
    </>
  );
};
