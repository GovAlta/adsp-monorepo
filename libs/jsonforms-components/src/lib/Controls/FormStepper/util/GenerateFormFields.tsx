import { UISchemaElement, Category, Categorization, isVisible } from '@jsonforms/core';
import React from 'react';
import { Grid, GridItem } from '../../../common/Grid';
import { ListWithDetail, ListWithDetailHeading } from '../styled-components';

export const resolveLabelFromScope = (scope: string) => {
  // eslint-disable-next-line no-useless-escape
  const validPatternRegex = /^#(\/properties\/[^\/]+)+$/;
  const isValid = validPatternRegex.test(scope);
  if (!isValid) return null;

  const lastSegment = scope.split('/').pop();

  if (lastSegment) {
    const lowercased = lastSegment.replace(/([A-Z])/g, ' $1').toLowerCase();
    return lowercased.charAt(0).toUpperCase() + lowercased.slice(1);
  }
  return '';
};

export const getFormFieldValue = (scope: string, data: object) => {
  if (data !== undefined) {
    const pathArray = scope.replace('#/properties/', '').replace('properties/', '').split('/');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let currentValue: any = data;
    for (const key of pathArray) {
      if (currentValue[key] === undefined) {
        return '';
      }
      currentValue = currentValue[key];
    }
    return Array.isArray(currentValue)
      ? currentValue[currentValue.length - 1]
      : typeof currentValue === 'object'
      ? ''
      : currentValue;
  } else {
    return '';
  }
};

export const renderFormFields = (
  elements: UISchemaElement[] | (Category | Categorization)[],
  data: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  requiredFields: string[]
) =>
  elements.map((element, index) => {
    const clonedElement = JSON.parse(JSON.stringify(element));
    const lastSegment: string = clonedElement.scope?.split('/').pop();
    if (clonedElement.type === 'Control' && clonedElement.scope) {
      const label = clonedElement.label ? clonedElement.label : resolveLabelFromScope(clonedElement.scope);
      if (!label) return null;
      const value = getFormFieldValue(clonedElement.scope, data ? data : {}).toString();
      const asterisk = requiredFields.indexOf(lastSegment) !== -1 ? ' *' : '';
      return (
        <GridItem key={index} md={6} vSpacing={1} hSpacing={0.5}>
          <strong>
            {label} {asterisk + ':'}
          </strong>{' '}
          {value}
        </GridItem>
      );
    } else if (clonedElement.type !== 'ListWithDetail' && clonedElement?.elements) {
      return (
        <React.Fragment key={index}>{renderFormFields(clonedElement.elements, data, requiredFields)}</React.Fragment>
      );
    } else if (clonedElement.type === 'ListWithDetail' && data && data[lastSegment] && data[lastSegment].length > 0) {
      const listData = data[lastSegment];
      return (
        <ListWithDetail>
          <ListWithDetailHeading>
            {lastSegment}
            {listData.length > 1 && 's'}
          </ListWithDetailHeading>
          <Grid>
            {listData.map(
              (
                childData: any, // eslint-disable-line @typescript-eslint/no-explicit-any
                childIndex: any // eslint-disable-line @typescript-eslint/no-explicit-any
              ) => (
                <React.Fragment key={`${index}-${childIndex}`}>
                  {renderFormFields(clonedElement.elements, childData, requiredFields)}
                </React.Fragment>
              )
            )}
          </Grid>
        </ListWithDetail>
      );
    }
    return null;
  });
