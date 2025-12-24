import React, { FunctionComponent, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GoabButton } from '@abgov/react-components';
import { SitesList } from './sitesList';
import { SiteAddEditForm } from './edit';
import { deleteFeedbackSite, getFeedbackSites, updateFeedbackSite } from '@store/feedback/actions';
import { FeedbackSite, defaultFeedbackSite } from '@store/feedback/models';
import { RootState } from '@store/index';
import { PageIndicator } from '@components/Indicator';
import { DeleteConfirmationsView } from './deleteConfirmationsView';

interface ParentCompProps {
  activeEdit?: boolean;
}

export const FeedbackSites: FunctionComponent<ParentCompProps> = ({ activeEdit }) => {
  const [toggleActiveEdit, setActiveEdit] = useState(activeEdit);
  const [editSite, setEditSite] = useState(toggleActiveEdit);
  const [deleteSiteConfirmation, setDeleteSiteConfirmation] = useState(false);
  const [selectedSite, setSelectedSite] = useState<FeedbackSite>(defaultFeedbackSite);

  const sites = useSelector((state: RootState) => {
    return (
      state.feedback.sites?.sort((a, b) =>
        a.url.replace(/^https?:\/\//, '').localeCompare(b.url.replace(/^https?:\/\//, ''))
      ) || []
    );
  });
  const [isEdit, setIsEdit] = useState(false);
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const handleEdit = (site: FeedbackSite) => {
    dispatch(updateFeedbackSite(site));
    setEditSite(false);
  };
  const handleDelete = () => {
    dispatch(deleteFeedbackSite(selectedSite));
    setEditSite(false);
    setDeleteSiteConfirmation(false);
  };
  // eslint-disable-next-line
  useEffect(() => {}, [indicator]);

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(getFeedbackSites());
  }, [dispatch]);

  const createSite = (site) => {
    dispatch(updateFeedbackSite(site));
    setEditSite(false);
  };
  useEffect(() => {
    document.body.style.overflow = 'unset';
  }, [editSite]);

  return (
    <section>
      <GoabButton
        testId="add-site"
        onClick={() => {
          setSelectedSite(defaultFeedbackSite);
          setIsEdit(false);
          setEditSite(true);
        }}
      >
        Register site
      </GoabButton>

      <PageIndicator />
      {!indicator.show && sites && (
        <div>
          <SitesList
            onEdit={(site: FeedbackSite) => {
              setSelectedSite(site);
              setIsEdit(true);
              setEditSite(true);
            }}
            onDelete={(site) => {
              setSelectedSite(site);
              setDeleteSiteConfirmation(true);
            }}
          />
        </div>
      )}
      {editSite && (
        <SiteAddEditForm
          open={editSite}
          initialValue={selectedSite}
          isEdit={isEdit}
          sites={sites}
          onClose={() => {
            setEditSite(false);
            setActiveEdit(false);
          }}
          onSave={createSite}
          onEdit={handleEdit}
        />
      )}
      {deleteSiteConfirmation && (
        <DeleteConfirmationsView
          site={selectedSite}
          onCancel={() => setDeleteSiteConfirmation(false)}
          deleteSite={handleDelete}
        />
      )}
    </section>
  );
};

export default FeedbackSites;
