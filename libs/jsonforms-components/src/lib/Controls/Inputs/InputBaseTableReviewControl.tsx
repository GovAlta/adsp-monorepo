import React, { ReactNode, useContext } from 'react';
import { ControlProps } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { PageReviewNameCol, PageReviewValueCol } from './style-component';
import { convertToSentenceCase, getLastSegmentFromPointer } from '../../util';
import { getLabelText } from '../../util/stringUtils';
import { JsonFormsStepperContext } from '../FormStepper/context';
import { GoATable } from '@abgov/react-components';
import { GoAGrid } from '@abgov/react-components';
import { ControlElement } from '@jsonforms/core';
import { JsonSchema4, JsonSchema7 } from '@jsonforms/core';
import { H4Large } from './style-component';

export interface ExtendedControlElement extends ControlElement {
  elements?: ControlElement[];
}

export interface TableProps {
  properties?:
    | {
        [property: string]: JsonSchema4;
      }
    | {
        [property: string]: JsonSchema7;
      };
  //eslint-disable-next-line
  itemsSchema: any;
  //eslint-disable-next-line
  localData: any;
  newKey?: string;
}

export interface TablePropsIsArray extends TableProps {
  currentElements: string[];
}
//                   names in array, local data, newkey
const DataTable = ({ itemsSchema, localData }: TableProps): JSX.Element => {
  //LOCALDATA should be array at this point

  return (
    <GoATable width="100%">
      <thead>
        <tr>
          {/* itemschema = type/value/url */}
          {itemsSchema &&
            Object.keys(itemsSchema)?.map((headNames, ix) => {
              return <th key={ix}>{headNames}</th>;
            })}
        </tr>
      </thead>
      <tbody>
        {(localData as Record<string, unknown>[]).map((obj, index) => (
          <tr key={index}>
            {itemsSchema &&
              Object.keys(itemsSchema).map((headNames, ix) => {
                return <td key={ix}>{obj[headNames as keyof typeof obj] as ReactNode}</td>;
              })}
          </tr>
        ))}
      </tbody>
    </GoATable>
  );
};

const IsArray = ({ itemsSchema, localData, newKey = '', currentElements }: TablePropsIsArray): JSX.Element => {
  // 1) localdata[newkey] = {
  //   details: 'asdfasdf',
  //   methods: [
  //     {
  //       type: 'GitHub',
  //       value: 'asdf',
  //     },
  //     {
  //       type: 'Slack',
  //       value: 'sadfdsaf',
  //     },
  //   ],
  // };

  // 2) localdata[newkey] =
  //   [
  //     {
  //       type: 'GitHub',
  //       value: 'asdf',
  //     },
  //     {
  //       type: 'Slack',
  //       value: 'sadfdsaf',
  //     },
  //   ];

  return Array.isArray(localData[newKey]) ? (
    <div>
      <H4Large>{convertToSentenceCase(newKey)}</H4Large>
      <DataTable itemsSchema={itemsSchema?.items?.properties} localData={localData[newKey]} />
      {/* properties={newReviewText} */}
    </div>
  ) : (
    <div key={newKey} style={{ marginBottom: '1rem' }}>
      <GoAGrid minChildWidth="26ch" gap="m">
        {JSON.stringify(localData) + '><reviewTextxxxxxxxxxxxxxx'}
        {JSON.stringify(localData[newKey]) + '><reviewText[newKey]'}
        {JSON.stringify(newKey) + '><newKey'}
        {typeof localData[newKey] === 'object' && localData[newKey] !== null ? (
          Object.keys(localData[newKey])
            .filter((k) => currentElements.includes(k))
            .map((element) => {
              //method
              if (Array.isArray(localData[newKey][element])) {
                // localData[newKey][element] =
                //     {
                //       type: 'GitHub',
                //       value: 'asdf',
                //     },
                //     {
                //       type: 'Slack',
                //       value: 'sadfdsaf',
                //     },
                //   ]

                // newkey == contact ?

                //{"type":"object","properties":{"details":{"type":"string","description":"Special reqirements when contacting"},"methods":{"type":"array","items":{"type":"object","properties":{"type":{"type":"string","enum":["BERNIE","GitHub","Slack","Web","Phone","Email"]},"value":{"type":"string","description":"Display name"},"url":{"type":"string","pattern":"^(https?://)?(www.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\\.[a-zA-Z0-9()]{2,6}([-a-zA-Z0-9()@:%_+.~#?&/=]*)$|^\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}$","errorMessage":{"pattern":"Invalid entry"}}}},"required":["type","url"]}}}

                return (
                  <div>
                    {/* {JSON.stringify(element) + '<elements - METHOD'}
                    {JSON.stringify(localData[newKey]) + '<reviewText[newKey]'} */}
                    <IsArray
                      // properties={localData[newKey]}
                      itemsSchema={itemsSchema?.properties[element]}
                      localData={localData[newKey]}
                      newKey={element}
                      currentElements={currentElements}
                    />
                  </div>
                );
              } else {
                return (
                  <div className="b">
                    <b>{convertToSentenceCase(element)}</b>: {localData[newKey][element]}
                  </div>
                );
              }
            })
        ) : (
          <div className="c">
            <b>{convertToSentenceCase(newKey)}</b>: {localData[newKey]}
          </div>
        )}
      </GoAGrid>
    </div>
  );
};

export const GoAInputBaseTableReview = (props: ControlProps): JSX.Element => {
  const { data, uischema, label, schema } = props;
  const labelToUpdate: string = convertToSentenceCase(getLabelText(uischema.scope, label || ''));
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
          <GoAGrid minChildWidth="26ch" gap="xs">
            {Object.keys(reviewText)
              ?.filter((k) => elements?.includes(k))
              .map((key) => {
                const itemsSchema = properties[key]; //?.items as { properties: Record<string, unknown> };
                const currentElements = (uischema as unknown as { elements: { scope: string }[] }).elements.map((e) => {
                  return e.scope?.substring(e.scope?.lastIndexOf('/') + 1);
                });

                // return (
                //   <div>
                //     ITEMSCHEMA: {JSON.stringify(properties[key])}
                //     currentElements: {JSON.stringify(currentElements)}
                //     key: {JSON.stringify(key)}
                //   </div>
                // );

                return (
                  <IsArray
                    // properties={properties}
                    itemsSchema={itemsSchema}
                    localData={reviewText}
                    newKey={key}
                    currentElements={currentElements}
                  />
                );
              })}
          </GoAGrid>
        )}
      </PageReviewValueCol>
    </tr>
  );
};

export const GoAInputBaseTableReviewControl = withJsonFormsControlProps(GoAInputBaseTableReview);
