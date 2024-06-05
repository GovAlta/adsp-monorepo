import { ControlElement, JsonSchema } from '@jsonforms/core';
import { ListWithDetail, ListWithDetailHeading } from '../styled-components';
import { NestedStringArray, resolveLabelFromScope } from './GenerateFormFields';
import { renderList } from './renderReviewControl';

export const renderReviewListWithDetail = (
  schema: JsonSchema,
  elements: ControlElement[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
  field: string,
  index: number,
  requiredFields: string[]
): JSX.Element => {
  const listData = data[field];
  const detailData: NestedStringArray = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listData.forEach((elementData: any, i: number) => {
    const itemData: NestedStringArray = [];
    elements.forEach((element, j) => {
      const fieldName = element.scope.split('/').pop() || '';
      const label = resolveLabelFromScope(element.scope);
      const value = elementData[fieldName] ?? '';

      console.log('ListWithDetailValue', value);
      itemData.push([label, value]);
    });
    detailData.push([`${i}`, itemData]);
  });

  return (
    <ListWithDetail key={`${index}-${field}`}>
      <ListWithDetailHeading>
        {field}
        {listData.length > 1 && 's'}
      </ListWithDetailHeading>
      {renderList(detailData)}
    </ListWithDetail>
  );
};
