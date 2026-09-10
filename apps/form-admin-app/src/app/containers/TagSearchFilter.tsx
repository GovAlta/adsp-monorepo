import { GoabFormItem, GoabDropdown, GoabDropdownItem } from '@abgov/react-components';
import { FunctionComponent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, getTags, tagsSelector } from '../state';
import { GoabDropdownOnChangeDetail } from '@abgov/ui-components-common';

interface TagSearchFilterProps {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

export const TagSearchFilter: FunctionComponent<TagSearchFilterProps> = ({ value, disabled, onChange }) => {
  const dispatch = useDispatch<AppDispatch>();

  const tags = useSelector(tagsSelector);

  useEffect(() => {
    if (tags.length < 1) {
      dispatch(getTags({}));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  return (
    <GoabFormItem label="Tag" mr="m">
      <GoabDropdown
        size="compact"
        name="tag"
        value={value || ''}
        disabled={disabled}
        onChange={(detail: GoabDropdownOnChangeDetail) => onChange(detail.value)}
      >
        <GoabDropdownItem value="" label="<No tag filter>" />
        {tags.map(({ value, label }) => (
          <GoabDropdownItem key={value} value={value} label={label} />
        ))}
      </GoabDropdown>
    </GoabFormItem>
  );
};
