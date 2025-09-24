import { GoAButton, GoAButtonGroup, GoAModal } from '@abgov/react-components';
import { FunctionComponent } from 'react';
import { Form } from '../state';

interface DeleteFormModalProps {
  form: Form;
  open: boolean;
  deleting: boolean;
  onClose: () => void;
  onDelete: (form: Form) => void;
}

export const DeleteFormModal: FunctionComponent<DeleteFormModalProps> = ({
  form,
  open,
  deleting,
  onDelete,
  onClose,
}) => {
  return (
    <GoAModal heading="Delete draft" open={open} onClose={onClose}>
      <form>
        <p>Are you sure you want to abandon this draft of {form?.definition?.name}?</p>{' '}
        <p>It will be permanently deleted and you won't be able to continue from the current version.</p>
        <GoAButtonGroup alignment="end" mt="4xl">
          <GoAButton type="secondary" onClick={onClose}>
            Cancel
          </GoAButton>
          <GoAButton type="primary" disabled={deleting} onClick={() => onDelete(form)}>
            Delete
          </GoAButton>
        </GoAButtonGroup>
      </form>
    </GoAModal>
  );
};
