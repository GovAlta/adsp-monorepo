import React, { useContext } from 'react';
import { ControlProps } from '@jsonforms/core';
import { AddressViews } from './AddressViews';
import { JsonFormsStepperContext } from '../FormStepper/context';
import { PageReviewNameCol, PageReviewValueCol } from '../Inputs/style-component';
import { GoabButton } from '@abgov/react-components';
import { JsonFormsStepperContextProvider } from '../FormStepper/context';
import { ReviewContext } from '../../Context/ReviewContext';

type AddressViewProps = ControlProps;

export const AddressLookUpControlReview = (props: AddressViewProps): JSX.Element => {
  const { data, schema } = props;

  const isAlbertaAddress = schema?.properties?.subdivisionCode?.const === 'AB';

  return <AddressViews data={data} isAlbertaAddress={isAlbertaAddress} />;
};

export const AddressLoopUpControlTableReview = (props: AddressViewProps): JSX.Element => {
  const { data, schema } = props;
  const context = useContext(ReviewContext);
  const isAlbertaAddress = schema?.properties?.subdivisionCode?.const === 'AB';

  const renderRow = (label: string, value: string) => (
    <tr>
      <PageReviewNameCol>
        <strong>{label}</strong>
      </PageReviewNameCol>
      <PageReviewValueCol>
        <div>{value}</div>
      </PageReviewValueCol>
      <td className="goa-table-width-limit">
        <GoabButton type="tertiary" size="compact" onClick={() => context.onEdit()}>
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
      </tr>
      {renderRow('Address line 1', data?.addressLine1)}
      {data?.addressLine2 && renderRow('Address line 2', data?.addressLine2)}
      {renderRow('City', data?.municipality)}
      {renderRow('Postal Code', data?.postalCode)}
      {renderRow('Province', data?.subdivisionCode)}
      {renderRow('Country', data?.country)}
    </>
  );
};
