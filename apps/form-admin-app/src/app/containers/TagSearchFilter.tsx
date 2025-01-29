import { GoAFormItem, GoADropdown, GoADropdownItem } from '@abgov/react-components-new';
import { FunctionComponent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, getTags, tagsSelector } from '../state';

interface TagSearchFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export const TagSearchFilter: FunctionComponent<TagSearchFilterProps> = ({ value, onChange }) => {
  const dispatch = useDispatch<AppDispatch>();

  const tags = useSelector(tagsSelector);

  useEffect(() => {
    dispatch(getTags({}));
  }, [dispatch]);

  return (
    <GoAFormItem label="Tag" mr="m">
      <GoADropdown name="tag" relative={true} value={value} onChange={(_: string, value: string) => onChange(value)}>
        <GoADropdownItem value="" label="<No tag filter>" />
        {tags.map(({ value, label }) => (
          <GoADropdownItem key={value} value={value} label={label} />
        ))}
      </GoADropdown>
    </GoAFormItem>
  );
};
