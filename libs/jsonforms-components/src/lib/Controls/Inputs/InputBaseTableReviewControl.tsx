import React, { useContext } from 'react';
import { ControlProps } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAButton } from '@abgov/react-components';
import { PageReviewActionCol, PageReviewNameCol, PageReviewValueCol } from './style-component';
import { convertToSentenceCase, getLastSegmentFromPointer } from '../../util';
import { getLabelText } from '../../util/stringUtils';
import { JsonFormsStepperContext } from '../FormStepper/context';
import { GoATable } from '@abgov/react-components';

export const GoAInputBaseTableReview = (props: ControlProps): JSX.Element => {
  const { data, uischema, label, schema } = props;
  const labelToUpdate: string = convertToSentenceCase(getLabelText(uischema.scope, label || ''));
  const categoryIndex = uischema.options?.categoryIndex;
  const formStepperCtx = useContext(JsonFormsStepperContext);
  let reviewText = data;
  const isBoolean = typeof data === 'boolean';
  if (isBoolean) {
    const checkboxLabel =
      uischema.options?.text?.trim() || convertToSentenceCase(getLastSegmentFromPointer(uischema.scope));

    if (uischema.options?.radio === true) {
      reviewText = data ? `Yes` : `No`;
    } else {
      if (label !== '' || typeof label === 'boolean') {
        reviewText = data ? `Yes` : `No`;
      } else {
        reviewText = data ? `Yes (${checkboxLabel.trim()})` : `No (${checkboxLabel.trim()})`;
      }
    }
  }

  const elements = (uischema as any)?.elements
    ?.map((element: any) => {
      console.log(JSON.stringify(element) + '<element');
      const result = element?.scope.split('/').filter((part, index, arr) => part !== 'properties' && index !== 0);
      return result;
    })
    .flat();

  const properties = schema.properties || {};

  return (
    <tr data-testid={`input-base-table-${label}-row`}>
      {labelToUpdate && (
        <PageReviewNameCol>
          <strong>{labelToUpdate}</strong>
        </PageReviewNameCol>
      )}
      <PageReviewValueCol>
        {typeof reviewText === 'string' ? (
          <div>a{reviewText}a</div>
        ) : (
          <div>
            {Object.keys(reviewText)
              ?.filter((k) => elements?.includes(k))
              .map((key) => {
                const itemsSchema = properties[key]?.items as { properties: any };

                return Array.isArray(reviewText[key]) ? (
                  <GoATable width="100%">
                    <thead>
                      <tr>
                        {properties[key] &&
                          Object.keys(itemsSchema?.properties).map((headNames, ix) => {
                            return <th key={ix}>{headNames}</th>;
                          })}
                      </tr>
                    </thead>
                    <tbody>
                      {reviewText[key]?.map((obj: any, index: string) => (
                        <tr key={index}>
                          {properties[key] &&
                            Object.keys(itemsSchema?.properties).map((headNames, ix) => {
                              return <td key={ix}>{obj[headNames]}</td>;
                            })}
                        </tr>
                      ))}
                    </tbody>
                  </GoATable>
                ) : (
                  <div key={key}>
                    <div>a{JSON.stringify(uischema)}uischema</div>
                    <div>a{JSON.stringify(key)}key</div>
                    -----------
                    <div>a{JSON.stringify(reviewText)}reviewText</div>
                    --------
                    <div>a{JSON.stringify(reviewText[key])}reviewText[key]</div>
                  </div>
                );
              })}
          </div>
        )}
        {/* <pre>{JSON.stringify(elements, null, 2)}</pre> */}
      </PageReviewValueCol>
      <PageReviewActionCol>
        <GoAButton
          type="tertiary"
          testId={`page-review-change-${label}-btn`}
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
  );
};

export const GoAInputBaseTableReviewControl = withJsonFormsControlProps(GoAInputBaseTableReview);
