import React, { FunctionComponent, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GoAButton } from '@abgov/react-components-new';
import { SitesList } from './sitesList';
import { SiteAddEditForm } from './edit';
import { getFeedbackSites, updateFeedbackSite } from '@store/feedback/actions';
import { FeedbackSite, defaultFeedbackSite } from '@store/feedback/models';
import { RootState } from '@store/index';
import styled from 'styled-components';
import { PageIndicator } from '@components/Indicator';
import { DeleteModal } from '@components/DeleteModal';
import { update } from 'lodash';

interface ParentCompProps {
  activeEdit?: boolean;
}

export const FeedbackSites: FunctionComponent<ParentCompProps> = ({ activeEdit }) => {
  const [editSite, setEditSite] = useState(activeEdit);
  const [selectedSite, setSelectedSite] = useState<FeedbackSite>(defaultFeedbackSite);

  const sites = useSelector((state: RootState) => state.feedback.sites);
  const [isEdit, setIsEdit] = useState(false);
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

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

  return (
    <>
      <PageIndicator />
      {!indicator.show && sites && (
        <div>
          <Buttons>
            <GoAButton
              testId="add-site"
              onClick={() => {
                setSelectedSite(defaultFeedbackSite);
                setIsEdit(false);
                setEditSite(true);
              }}
            >
              Add site
            </GoAButton>
          </Buttons>

          <SitesList
            onEdit={(def: FeedbackSite) => {
              setSelectedSite(def);
              setIsEdit(true);
              setEditSite(true);
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
          onClose={() => setEditSite(false)}
          onSave={createSite}
        />
      )}
    </>
  );
};

export default FeedbackSites;

const Buttons = styled.div`
  margin-bottom: 1rem;
  text-align: left;
`;
