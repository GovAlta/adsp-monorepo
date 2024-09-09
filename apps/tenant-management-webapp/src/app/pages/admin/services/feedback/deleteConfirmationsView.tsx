import { FeedbackSite } from '@store/feedback/models';
import { DeleteGap, TableDiv } from './styled-components';
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
        title="Delete registered site"
        isOpen={true}
        content={
          <div>
            <DeleteGap>
              <div data-testid="deleteMsg">
                Are you sure you wish to delete <b>{site.url}</b> ?
              </div>
            </DeleteGap>
            <small>* Please note that deleting this site will prevent receiving future feedback</small>
          </div>
        }
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
