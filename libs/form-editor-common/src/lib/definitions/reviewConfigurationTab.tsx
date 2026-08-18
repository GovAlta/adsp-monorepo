import React, { FunctionComponent, useMemo, useState } from 'react';
import {
  GoabAccordion,
  GoabButton,
  GoabCallout,
  GoabDropdown,
  GoabDropdownItem,
  GoabFormItem,
} from '@abgov/react-components';
import { GoabDropdownOnChangeDetail } from '@abgov/ui-components-common';
import DataTable from '@components/DataTable';
import type { ReviewConfiguration } from '@store/form/model';
import { ReviewColumnItems } from './reviewColumnItems';
import { flattenReviewFields, reviewFieldLabel } from './reviewFields';
import { H3, ReviewAddFieldRow, ReviewDescription, ReviewEmptyState, ReviewFieldDropdown, ReviewTabBody } from './style-components';

const LARGE_COLUMN_COUNT = 6;

interface ReviewConfigurationTabProps {
  schema: unknown;
  reviewConfiguration?: ReviewConfiguration;
  onChange: (reviewConfiguration: ReviewConfiguration) => void;
}

export const ReviewConfigurationTab: FunctionComponent<ReviewConfigurationTabProps> = ({
  schema,
  reviewConfiguration,
  onChange,
}) => {
  const [selectedPath, setSelectedPath] = useState('');
  const columns = reviewConfiguration?.columns || [];
  const fields = useMemo(() => flattenReviewFields(schema), [schema]);
  const fieldsByPath = useMemo(() => Object.fromEntries(fields.map((field) => [field.path, field])), [fields]);
  const availableFields = fields.filter((field) => !columns.some((column) => column.path === field.path));

  const addSelectedField = () => {
    if (!selectedPath || columns.some((column) => column.path === selectedPath)) {
      return;
    }

    onChange({ columns: [...columns, { path: selectedPath }] });
    setSelectedPath('');
  };

  const dropdownKey = availableFields.map((field) => field.path).join('|');

  return (
    <ReviewTabBody data-testid="form-editor-review-tab-body">
      <GoabAccordion heading="About this configuration" headingSize="small" open mt="m" mb="l" testId="review-config-description">
        <ReviewDescription>
          <p>This configuration is used by the Form Admin app only.</p>
          <p>
            Choose which submitted fields appear as columns in the Form Admin list of submissions and forms, and in what
            order.
          </p>
          <p>
            Pick values that help reviewers identify a submission quickly, for example first and last name. Keep the list
            small so the table stays manageable.
          </p>
        </ReviewDescription>
      </GoabAccordion>

      <GoabFormItem label="Add field">
        <ReviewAddFieldRow>
          <ReviewFieldDropdown>
            <GoabDropdown
              key={dropdownKey}
              name="review-field"
              testId="review-field-dropdown"
              size="compact"
              width="100%"
              filterable
              placeholder="Select a field"
              disabled={availableFields.length === 0}
              value={selectedPath}
              onChange={(detail: GoabDropdownOnChangeDetail) => setSelectedPath(detail.value || '')}
            >
              {availableFields.map((field) => (
                <GoabDropdownItem key={field.path} value={field.path} label={reviewFieldLabel(field)} />
              ))}
            </GoabDropdown>
          </ReviewFieldDropdown>
          <GoabButton
            type="secondary"
            size="compact"
            testId="add-review-field"
            disabled={!selectedPath}
            onClick={addSelectedField}
          >
            Add field
          </GoabButton>
        </ReviewAddFieldRow>
      </GoabFormItem>

      {columns.length > LARGE_COLUMN_COUNT && (
        <GoabCallout type="important" size="medium" mt="m" testId="review-config-large-list">
          Keep the list of columns small so the Form Admin submission table stays easy to scan.
        </GoabCallout>
      )}

      <H3>Selected columns</H3>
      {columns.length === 0 ? (
        <ReviewEmptyState data-testid="review-config-empty">
          No fields selected. Form Admin will show only system columns (submitted date, disposition, tags).
        </ReviewEmptyState>
      ) : (
        <DataTable data-testid="review-columns-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Path</th>
              <th>Order</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <ReviewColumnItems
              columns={columns}
              fieldsByPath={fieldsByPath}
              onChange={(nextColumns) => onChange({ columns: nextColumns })}
            />
          </tbody>
        </DataTable>
      )}
    </ReviewTabBody>
  );
};
