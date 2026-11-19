import React from 'react';
import { GoabButton, GoabDropdown, GoabDropdownItem, GoabIconButton, GoabInput } from '@abgov/react-components';
import { GoabDropdownOnChangeDetail, GoabInputOnChangeDetail } from '@abgov/ui-components-common';
import { SharepointColumnType, SharepointFieldMapping } from '@store/sharePoint/actions';
import { MappingGrid, MappingHeading } from '../styled-components';

export const COLUMN_TYPES: { value: SharepointColumnType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'multilineText', label: 'Multiple lines of text' },
  { value: 'number', label: 'Number' },
  { value: 'dateTime', label: 'Date and time' },
  { value: 'boolean', label: 'Yes/No' },
  { value: 'multiChoice', label: 'Choice (multiple)' },
  { value: 'hyperlink', label: 'Hyperlink' },
];

type MappingsUpdate = (mappings: SharepointFieldMapping[]) => SharepointFieldMapping[];

interface MappingRowsProps {
  prefix: string;
  label: string;
  mappings: SharepointFieldMapping[];
  // Takes an update function so several edits before a re-render all apply to the latest mappings.
  onChange: (update: MappingsUpdate) => void;
  sourceHeading?: string;
}

export const MappingRows = ({
  prefix,
  label,
  mappings,
  onChange,
  sourceHeading = 'Form data path',
}: MappingRowsProps): JSX.Element => {
  const update = (index: number, change: Partial<SharepointFieldMapping>) =>
    onChange((current) => current.map((mapping, i) => (i === index ? { ...mapping, ...change } : mapping)));

  return (
    <>
      <MappingGrid>
        <MappingHeading>{sourceHeading}</MappingHeading>
        <MappingHeading>SharePoint column (internal name)</MappingHeading>
        <MappingHeading>Column type</MappingHeading>
        <span />
        {mappings.map((mapping, index) => (
          <React.Fragment key={index}>
            <GoabInput
              size="compact"
              name={`${prefix}-source-${index}`}
              testId={`${prefix}-source-${index}`}
              ariaLabel={`${label} data path ${index + 1}`}
              value={mapping.source}
              width="100%"
              onChange={(detail: GoabInputOnChangeDetail) => update(index, { source: detail.value })}
            />
            <GoabInput
              size="compact"
              name={`${prefix}-target-${index}`}
              testId={`${prefix}-target-${index}`}
              ariaLabel={`${label} SharePoint column ${index + 1}`}
              value={mapping.target}
              width="100%"
              onChange={(detail: GoabInputOnChangeDetail) => update(index, { target: detail.value })}
            />
            <GoabDropdown
              size="compact"
              name={`${prefix}-type-${index}`}
              testId={`${prefix}-type-${index}`}
              ariaLabel={`${label} column type ${index + 1}`}
              value={mapping.columnType ?? 'text'}
              width="100%"
              onChange={(detail: GoabDropdownOnChangeDetail) =>
                update(index, { columnType: detail.value as SharepointColumnType })
              }
            >
              {COLUMN_TYPES.map(({ value, label: typeLabel }) => (
                <GoabDropdownItem key={value} value={value} label={typeLabel} />
              ))}
            </GoabDropdown>
            <GoabIconButton
              icon="trash"
              ariaLabel={`Remove ${label.toLowerCase()} mapping ${index + 1}`}
              testId={`${prefix}-remove-${index}`}
              disabled={mappings.length === 1}
              onClick={() => onChange((current) => current.filter((_mapping, i) => i !== index))}
            />
          </React.Fragment>
        ))}
      </MappingGrid>
      <GoabButton
        size="compact"
        type="tertiary"
        leadingIcon="add"
        testId={`${prefix}-add`}
        onClick={() => onChange((current) => [...current, { source: '', target: '' }])}
      >
        Add mapping
      </GoabButton>
    </>
  );
};
