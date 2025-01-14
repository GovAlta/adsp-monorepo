import { GoAButton, GoAButtonGroup, GoAFormItem, GoAInput, GoAModal } from '@abgov/react-components-new';
import { FunctionComponent, useEffect, useState } from 'react';
import { Resource } from '../state';

interface AddTagModal {
  open: boolean;
  resource: Pick<Resource, 'name' | 'urn'>;
  tagging: boolean;
  onClose: () => void;
  onTag: (urn: string, label: string) => void;
}

export const AddTagModal: FunctionComponent<AddTagModal> = ({ open, resource, tagging, onClose, onTag }) => {
  const [tagLabel, setTagLabel] = useState('');

  useEffect(() => {
    setTagLabel('');
  }, [setTagLabel, resource]);

  return (
    <GoAModal heading="Add tag" open={open}>
      <form>
        <div>
          Add a tag to "{resource?.name}". Enter the tag label that you want to use. A new tag will be created if
          necessary.
        </div>
        <GoAFormItem label="Tag" mt="l">
          <GoAInput
            type="text"
            onChange={(_: string, value: string) => setTagLabel(value)}
            value={tagLabel}
            name="tagLabel"
          />
        </GoAFormItem>
        <GoAButtonGroup alignment="end" mt="xl">
          <GoAButton type="secondary" onClick={onClose}>
            Close
          </GoAButton>
          <GoAButton disabled={!tagLabel || tagging} type="primary" onClick={() => onTag(resource?.urn, tagLabel)}>
            Add tag
          </GoAButton>
        </GoAButtonGroup>
      </form>
    </GoAModal>
  );
};
