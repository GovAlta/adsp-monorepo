import { FeedbackSite } from '@store/feedback/models';
import { TableDiv } from './styled-components';
import { DeleteModal } from '@components/DeleteModal';

interface siteDeleteProps {
  site: FeedbackSite;
  onCancel?: () => void;
  deleteSite?: () => void;
}

export const DeleteConfirmationsView = ({ site, onCancel, deleteSite }: siteDeleteProps): JSX.Element => {
  return (
    <TableDiv key="site">
      <DeleteModal
        title="Delete Site"
        isOpen={true}
        content={<div>Are you sure you wish to delete {`${site.url}?`}</div>}
        onCancel={() => {
          onCancel();
        }}
        onDelete={() => {
          deleteSite();
        }}
      />
    </TableDiv>
  );
};
