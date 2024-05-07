import React from 'react';
import { Grid, GridItem } from '../../../lib/common/Grid';
import { ListWithDetail, ListWithDetailHeading } from './styled-components';
import { getFormFieldValue, resolveLabelFromScope } from './GenerateFormFields';
import { Categorization, Category, UISchemaElement } from '@jsonforms/core';
import { downloadFile, fileDataUrlSelector, fileMetadataSelector, AppDispatch, AppState } from '../../state';
import { useDispatch, useSelector } from 'react-redux';

import { isAdspId } from '../../../lib/adspId';

interface RenderFormReviewFieldsProps {
  elements: UISchemaElement[] | (Category | Categorization)[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  requiredFields: string[];
}

export const Element = ({ element, index, data, requiredFields }) => {
  const dispatch = useDispatch<AppDispatch>();

  const clonedElement = JSON.parse(JSON.stringify(element));
  const lastSegment: string = clonedElement.scope?.split('/').pop();
  const value =
    clonedElement.type === 'Control' &&
    (getFormFieldValue(clonedElement?.scope, data ? data : {}).toString() as string);

  const fileDataUrl = useSelector((state: AppState) => fileDataUrlSelector(state, value));
  const metadata = useSelector((state: AppState) => fileMetadataSelector(state, value));

  if (clonedElement.type === 'Control' && clonedElement.scope) {
    const label = clonedElement.label ? clonedElement.label : resolveLabelFromScope(clonedElement.scope);
    if (!label) return null;

    const isRequired = requiredFields.includes(lastSegment);
    const asterisk = isRequired ? ' *' : '';

    const download = () => {
      if (fileDataUrl) {
        const link = document.createElement('a');
        link.href = fileDataUrl;
        link.download = metadata.filename;
        link.click();
      }
    };

    if (isAdspId(value) && !fileDataUrl) {
      dispatch(downloadFile(value));
    }

    return (
      <GridItem key={index} md={6} vSpacing={1} hSpacing={0.5}>
        <strong>
          {label} {asterisk + ': '}
        </strong>
        {isAdspId(value) ? <a onClick={() => download()}>{metadata?.filename}</a> : value}
      </GridItem>
    );
  } else if (clonedElement.type !== 'ListWithDetail' && clonedElement?.elements) {
    return (
      <React.Fragment key={index}>
        <RenderFormReviewFields elements={clonedElement.elements} data={data} requiredFields={requiredFields} />
      </React.Fragment>
    );
  } else if (clonedElement.type === 'ListWithDetail' && data && data[lastSegment] && data[lastSegment].length > 0) {
    const listData = data[lastSegment];
    return (
      <ListWithDetail key={`${index}-${lastSegment}`}>
        <ListWithDetailHeading>
          {lastSegment}
          {listData.length > 1 && 's'}
        </ListWithDetailHeading>
        <Grid>
          {listData.map((childData: unknown, childIndex: number) => (
            <React.Fragment key={`${index}-${childIndex}`}>
              <RenderFormReviewFields
                elements={clonedElement?.options?.detail?.elements || []}
                data={childData}
                requiredFields={requiredFields}
              />
            </React.Fragment>
          ))}
        </Grid>
      </ListWithDetail>
    );
  }
  return null;
};

export const RenderFormReviewFields: React.FC<RenderFormReviewFieldsProps> = ({ elements, data, requiredFields }) => {
  return elements?.map((element, index) => {
    return <Element element={element} index={index} data={data} requiredFields={requiredFields} />;
  });
};
