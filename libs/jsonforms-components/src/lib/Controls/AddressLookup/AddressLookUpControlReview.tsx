import React, { useContext } from 'react';
import { ControlProps } from '@jsonforms/core';
import { AddressViews } from './AddressViews';
import { JsonFormsStepperContext } from '../FormStepper/context';
import { PageReviewActionCol, PageReviewNameCol, PageReviewValueCol } from '../Inputs/style-component';
import { GoAButton } from '@abgov/react-components';
import { JsonFormsStepperContextProvider } from '../FormStepper/context';

type AddressViewProps = ControlProps;

export const AddressLookUpControlReview = (props: AddressViewProps): JSX.Element => {
  const { data, schema } = props;

  const isAlbertaAddress = schema?.properties?.subdivisionCode?.const === 'AB';

  return <AddressViews data={data} isAlbertaAddress={isAlbertaAddress} />;
};

export const AddressLoopUpControlTableReview = (props: AddressViewProps): JSX.Element => {
  const { data, schema, uischema } = props;

  const categoryIndex = uischema.options?.categoryIndex;
  const formStepperCtx = useContext(JsonFormsStepperContext);
  const isAlbertaAddress = schema?.properties?.subdivisionCode?.const === 'AB';

  return (
    <>
      <tr data-testid="address-lookup-table-review">
        <PageReviewNameCol>
          <strong>{`${isAlbertaAddress ? 'Alberta' : 'Canada'} postal address`}</strong>
        </PageReviewNameCol>
        <PageReviewValueCol></PageReviewValueCol>
        <PageReviewActionCol>
          <GoAButton
            type="tertiary"
            testId={`page-review-change-address-btn`}
            onClick={() => {
              if (formStepperCtx) {
                formStepperCtx.toggleShowReviewLink(categoryIndex);
                formStepperCtx.goToPage(categoryIndex);
              }
            }}
          >
            Change
          </GoAButton>
        </PageReviewActionCol>
      </tr>
      <tr>
        <td colSpan={3}>
          <AddressViews data={data} isAlbertaAddress={isAlbertaAddress} withoutHeader={true} />
        </td>
      </tr>
    </>
  );
};
