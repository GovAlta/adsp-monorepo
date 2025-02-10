import { GoAFormItem, GoAInput } from '@abgov/react-components-new';
import { FunctionComponent } from 'react';

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
      <GoAFormItem label={name} key={path} mr="m">
        {type === 'number' || type === 'integer' ? (
          <GoAInput
            type="number"
            onChange={(_, value: string) =>
              onChange(value ? (type === 'integer' ? parseInt(value) : parseFloat(value)) : undefined)
            }
            value={value}
            name={name}
            disabled={disabled}
          />
        ) : (
          <GoAInput
            type="text"
            onChange={(_, value: string) => onChange(value)}
            value={value}
            name={name}
            disabled={disabled}
          />
        )}
      </GoAFormItem>
    )
  );
};
