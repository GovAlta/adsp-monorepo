import React from 'react';
import { GoabButton, GoabFormItem, GoabIconButton, GoabInput } from '@abgov/react-components';
import { GoabInputOnChangeDetail } from '@abgov/ui-components-common';
import { SharepointDetailList } from '@store/sharePoint/actions';
import { FieldLabel } from '../fieldLabel';
import { DetailListBox, DetailListHeader, FieldPair } from '../styled-components';
import { PARENT_REF_COLUMN } from './generateMappings';
import { MappingRows } from './mappingRows';

type DetailListsUpdate = (detailLists: SharepointDetailList[]) => SharepointDetailList[];

interface DetailListsEditorProps {
  detailLists: SharepointDetailList[];
  error?: string;
  onChange: (update: DetailListsUpdate) => void;
}

export const newDetailList = (): SharepointDetailList => ({
  listName: '',
  dataPath: '',
  parentRefField: PARENT_REF_COLUMN,
  fieldMappings: [{ source: '', target: '' }],
});

export const DetailListsEditor = ({ detailLists, error, onChange }: DetailListsEditorProps): JSX.Element => {
  const update = (index: number, change: (list: SharepointDetailList) => Partial<SharepointDetailList>) =>
    onChange((current) => current.map((list, i) => (i === index ? { ...list, ...change(list) } : list)));

  const textField = (index: number, field: 'listName' | 'listId' | 'dataPath' | 'parentRefField', name: string) => (
    <GoabInput
      size="compact"
      name={`detail-${index}-${name}`}
      testId={`detail-${index}-${name}`}
      value={detailLists[index][field] ?? ''}
      width="100%"
      onChange={(detail: GoabInputOnChangeDetail) => update(index, () => ({ [field]: detail.value }))}
    />
  );

  return (
    <GoabFormItem label="" error={error}>
      {detailLists.map((list, index) => (
        <DetailListBox key={index} data-testid={`detail-list-${index}`}>
          <DetailListHeader>
            <span>{list.listName || list.dataPath || `Detail list ${index + 1}`}</span>
            <GoabIconButton
              icon="trash"
              ariaLabel={`Remove detail list ${index + 1}`}
              testId={`detail-${index}-remove`}
              onClick={() => onChange((current) => current.filter((_list, i) => i !== index))}
            />
          </DetailListHeader>
          <FieldPair>
            <div>
              <FieldLabel
                label="List name"
                hint="Verify setup creates a list with this name when there is no list ID."
              />
              {textField(index, 'listName', 'name')}
            </div>
            <div>
              <FieldLabel label="SharePoint list ID" hint="Leave empty to have verify setup create the list." />
              {textField(index, 'listId', 'list-id')}
            </div>
            <div>
              <FieldLabel
                label="Array path in the data"
                hint="The path to the repeating section in the data. Each item becomes one row."
              />
              {textField(index, 'dataPath', 'data-path')}
            </div>
            <div>
              <FieldLabel
                label="Parent reference column"
                hint="ADSP writes the main row's item ID here so the rows can be joined. Verify setup creates it, indexed."
              />
              {textField(index, 'parentRefField', 'parent')}
            </div>
          </FieldPair>
          <MappingRows
            prefix={`detail-${index}-mapping`}
            label={`Detail list ${index + 1}`}
            sourceHeading="Path within each item"
            mappings={list.fieldMappings}
            onChange={(mappingsUpdate) =>
              update(index, (current) => ({ fieldMappings: mappingsUpdate(current.fieldMappings) }))
            }
          />
        </DetailListBox>
      ))}
      <GoabButton
        size="compact"
        type="tertiary"
        leadingIcon="add"
        testId="detail-list-add"
        onClick={() => onChange((current) => [...current, newDetailList()])}
      >
        Add detail list
      </GoabButton>
    </GoabFormItem>
  );
};
