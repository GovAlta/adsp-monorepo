import { GoabFormItem, GoabInput } from '@abgov/react-components';
import { FunctionComponent } from 'react';
import { GoabInputOnChangeDetail } from '@abgov/ui-components-common';

interface DataValueCriteriaItemProps {
  name: string;
  path: string;
  type: string | string[];
  value: string;
  disabled?: boolean;
  onChange: (value: unknown) => void;
}

const SupportedTypes = ['string', 'number', 'integer'];

export const DataValueCriteriaItem: FunctionComponent<DataValueCriteriaItemProps> = ({
  name,
  path,
  type,
  value,
  disabled,
  onChange,
}) => {
  return (
    SupportedTypes.includes(type as string) && (
      <GoabFormItem label={name} key={path} mr="m">
        {type === 'number' || type === 'integer' ? (
          <GoabInput
            type="number"
            onChange={(detail: GoabInputOnChangeDetail) =>
              onChange(
                detail.value ? (type === 'integer' ? parseInt(detail.value) : parseFloat(detail.value)) : undefined
              )
            }
            value={value}
            name={name}
            disabled={disabled}
          />
        ) : (
          <GoabInput
            type="text"
            onChange={(detail: GoabInputOnChangeDetail) => onChange(detail.value)}
            value={value}
            name={name}
            disabled={disabled}
          />
        )}
      </GoabFormItem>
    )
  );
};
