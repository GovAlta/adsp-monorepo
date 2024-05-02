import { ControlElement } from '@jsonforms/core';
import { ListWithDetail, ListWithDetailHeading } from '../styled-components';
import { Grid } from '../../../common/Grid';
import React from 'react';
import { RenderFormReviewFields } from './RenderFormReviewFields';

export const renderReviewListWithDetail = (
  element: ControlElement,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
  field: string,
  index: number,
  requiredFields: string[]
): JSX.Element => {
  const listData = data[field];
  return (
    <ListWithDetail key={`${index}-${field}`}>
      <ListWithDetailHeading>
        {field}
        {listData.length > 1 && 's'}
      </ListWithDetailHeading>
      <Grid>
        {listData.map((childData: unknown, childIndex: number) => (
          <React.Fragment key={`${index}-${childIndex}`}>
            <RenderFormReviewFields
              elements={element?.options?.detail?.elements || []}
              data={childData}
              requiredFields={requiredFields}
            />
          </React.Fragment>
        ))}
      </Grid>
    </ListWithDetail>
  );
};
