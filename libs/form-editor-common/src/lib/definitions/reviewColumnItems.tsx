import React, { FunctionComponent } from 'react';
import { GoabBadge, GoabInput } from '@abgov/react-components';
import { GoabInputOnChangeDetail } from '@abgov/ui-components-common';
import { GoAContextMenuIcon } from '@components/ContextMenu';
import type { ReviewColumn } from '@store/form/model';
import { ReviewField, setItemOrder } from './reviewFields';
import { ReviewOrderField } from './style-components';

interface ReviewColumnItemsProps {
  columns: ReviewColumn[];
  fieldsByPath: Record<string, ReviewField>;
  onChange: (columns: ReviewColumn[]) => void;
}

const applyOrder = (columns: ReviewColumn[], from: number, value: string): ReviewColumn[] => {
  const nextOrder = Number(value);
  return Number.isFinite(nextOrder) && nextOrder > 0 ? setItemOrder(columns, from, nextOrder) : columns;
};

export const ReviewColumnItems: FunctionComponent<ReviewColumnItemsProps> = ({ columns, fieldsByPath, onChange }) => {
  return (
    <>
      {columns.map((column, index) => {
        const field = fieldsByPath[column.path];
        return (
          <tr key={column.path}>
            <td data-testid={`review-column-name-${column.path}`}>
              {field?.name || column.path}
              {!field && (
                <GoabBadge type="important" content="Not in current schema" mb="none" ml="s" testId="stale-path-badge" />
              )}
            </td>
            <td data-testid={`review-column-path-${column.path}`}>{column.path}</td>
            <td data-testid={`review-column-order-${column.path}`}>
              <ReviewOrderField>
                <GoabInput
                  type="number"
                  name={`review-column-order-${column.path}`}
                  testId={`review-column-order-input-${column.path}`}
                  size="compact"
                  width="100%"
                  min={1}
                  max={columns.length}
                  value={`${index + 1}`}
                  aria-label={`Order for ${field?.name || column.path}`}
                  onChange={(detail: GoabInputOnChangeDetail) => {
                    const next = applyOrder(columns, index, detail.value);
                    if (next !== columns) {
                      onChange(next);
                    }
                  }}
                />
              </ReviewOrderField>
            </td>
            <td data-testid={`review-column-actions-${column.path}`}>
              <GoAContextMenuIcon
                type="trash"
                title="Delete"
                testId={`review-column-delete-${column.path}`}
                onClick={() => onChange(columns.filter((item) => item.path !== column.path))}
              />
            </td>
          </tr>
        );
      })}
    </>
  );
};
