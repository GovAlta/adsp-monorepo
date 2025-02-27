import React, { ReactNode, useContext } from 'react';
import { ControlProps } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAButton } from '@abgov/react-components';
import { PageReviewActionCol, PageReviewNameCol, PageReviewValueCol } from './style-component';
import { convertToSentenceCase, getLastSegmentFromPointer } from '../../util';
import { getLabelText } from '../../util/stringUtils';
import { JsonFormsStepperContext } from '../FormStepper/context';
import { GoATable } from '@abgov/react-components';
import { GoAGrid } from '@abgov/react-components';
import { ControlElement } from '@jsonforms/core';
import { JsonSchema4, JsonSchema7 } from '@jsonforms/core';

export interface ExtendedControlElement extends ControlElement {
  elements?: ControlElement[];
}

export interface TableProps {
  properties:
    | {
        [property: string]: JsonSchema4;
      }
    | {
        [property: string]: JsonSchema7;
      };
  itemsSchema: {
    properties: Record<string, unknown>;
  };
  reviewText: any;
  newKey: string;
}

export interface TablePropsIsArray extends TableProps {
  currentElements: string[];
}

//eslint-disable-next-line
const XDataTable = ({ properties, itemsSchema, reviewText, newKey }: TableProps): JSX.Element => {
  return (
    <GoATable width="100%">
      <thead>
        <tr>
          {properties[newKey] &&
            Object.keys(itemsSchema?.properties)?.map((headNames, ix) => {
              return <th key={ix}>{JSON.stringify(headNames)}</th>;
            })}
        </tr>
      </thead>
      <tbody>
        {(reviewText[newKey] as Record<string, unknown>[]).map((obj, index) => (
          <tr key={index}>
            {properties[newKey] &&
              Object.keys(itemsSchema?.properties).map((headNames, ix) => {
                return <td key={ix}>{JSON.stringify(obj[headNames as keyof typeof obj] as ReactNode)}</td>;
              })}
          </tr>
        ))}
      </tbody>
    </GoATable>
  );
};

const IsArray = ({ properties, itemsSchema, reviewText, newKey, currentElements }: TablePropsIsArray): JSX.Element => {
  return Array.isArray(reviewText[newKey]) ? (
    <XDataTable properties={properties} itemsSchema={itemsSchema} reviewText={reviewText} newKey={newKey} />
  ) : (
    <div key={newKey}>
      <GoAGrid minChildWidth="26ch" gap="m">
        {Object.keys(reviewText[newKey])
          .filter((k) => currentElements.includes(k))
          .map((element) => {
            return (
              <div>
                <b>{JSON.stringify(convertToSentenceCase(element))}</b>: {JSON.stringify(reviewText[newKey][element])}
              </div>
            );
          })}
      </GoAGrid>
    </div>
  );
};

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

  const elements = (uischema as ExtendedControlElement)?.elements
    ?.map((element) => {
      console.log(JSON.stringify(element) + '<element');
      const result = element?.scope?.split('/').filter((part, index, arr) => part !== 'properties' && index !== 0);
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
          <div>{reviewText}</div>
        ) : (
          <div>
            {Object.keys(reviewText)
              ?.filter((k) => elements?.includes(k))
              .map((key) => {
                const itemsSchema = properties[key]?.items as { properties: Record<string, unknown> };
                const currentElements = (uischema as unknown as { elements: { scope: string }[] }).elements.map((e) => {
                  return e.scope?.substring(e.scope?.lastIndexOf('/') + 1);
                });

                return (
                  <IsArray
                    properties={properties}
                    itemsSchema={itemsSchema}
                    reviewText={reviewText}
                    newKey={key}
                    currentElements={currentElements}
                  />
                );
              })}
          </div>
        )}
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
