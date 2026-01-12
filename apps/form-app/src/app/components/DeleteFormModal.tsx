import { GoabButton, GoabButtonGroup, GoabModal } from '@abgov/react-components';
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
    <GoabModal heading="Delete draft" open={open} onClose={onClose}>
      <form>
        <p>Are you sure you want to abandon this draft of {form?.definition?.name}?</p>{' '}
        <p>It will be permanently deleted and you won't be able to continue from the current version.</p>
        <GoabButtonGroup alignment="end" mt="4xl">
          <GoabButton type="secondary" onClick={onClose}>
            Cancel
          </GoabButton>
          <GoabButton type="primary" disabled={deleting} onClick={() => onDelete(form)}>
            Delete
          </GoabButton>
        </GoabButtonGroup>
      </form>
    </GoabModal>
  );
};
