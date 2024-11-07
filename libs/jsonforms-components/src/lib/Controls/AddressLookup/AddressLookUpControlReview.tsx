import React from 'react';
import { ControlProps } from '@jsonforms/core';

import { AddressViews } from './AddressViews';

type AddressViewProps = ControlProps;

export const AddressLookUpControlReview = (props: AddressViewProps): JSX.Element => {
  const { data, schema } = props;

  const isAlbertaAddress = schema?.properties?.subdivisionCode?.const === 'AB';

  return (
    <div>
      <AddressViews data={data} isAlbertaAddress={isAlbertaAddress} />
    </div>
  );
};
