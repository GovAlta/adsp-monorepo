import { GoabButton, GoabButtonGroup, GoabFormItem, GoabInput, GoabModal } from '@abgov/react-components';
import { FunctionComponent, useEffect, useState } from 'react';
import { Resource } from '../state';
import { GoabInputOnChangeDetail } from '@abgov/ui-components-common';

interface AddTagModal {
  open: boolean;
  resource: Pick<Resource, 'name' | 'urn'>;
  tagging: boolean;
  onClose: () => void;
  onTag: (urn: string, label: string) => void;
}

export const AddTagModal: FunctionComponent<AddTagModal> = ({ open, resource, tagging, onClose, onTag }) => {
  const [tagLabel, setTagLabel] = useState('');
  const [tagLabelError, setTagLabelError] = useState('');

  useEffect(() => {
    setTagLabel('');
  }, [setTagLabel, resource]);

  useEffect(() => {
    const valid = /^[a-zA-Z0-9 ]{0,50}$/.test(tagLabel.trim());
    setTagLabelError(valid ? '' : 'Value must be 50 characters or less with no special characters.');
  }, [tagLabel]);

  return (
    <GoabModal heading="Add tag" open={open}>
      <form>
        <div>
          Add a tag{resource?.name && ` to "${resource?.name}"`}. Enter the tag label that you want to use. A new tag
          will be created if necessary.
        </div>
        <GoabFormItem label="Tag" mt="l" error={tagLabelError}>
          <GoabInput
            type="text"
            onChange={(detail: GoabInputOnChangeDetail) => setTagLabel(detail.value)}
            value={tagLabel}
            name="tagLabel"
            error={!!tagLabelError}
          />
        </GoabFormItem>
        <GoabButtonGroup alignment="end" mt="xl">
          <GoabButton type="secondary" onClick={onClose}>
            Close
          </GoabButton>
          <GoabButton
            disabled={!tagLabel?.trim() || !!tagLabelError || tagging}
            type="primary"
            onClick={() => onTag(resource?.urn, tagLabel.trim())}
          >
            Add tag
          </GoabButton>
        </GoabButtonGroup>
      </form>
    </GoabModal>
  );
};
