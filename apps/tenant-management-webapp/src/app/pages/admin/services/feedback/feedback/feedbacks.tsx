import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { RootState } from '@store/index';
import { getFeedbackSites } from '@store/feedback/actions';
import { FeedbackSearchCriteria, getDefaultSearchCriteria } from '@store/feedback/models';
import {
  GoADropdown,
  GoADropdownItem,
  GoAFormItem,
  GoAInputDate,
  GoABadge,
  GoAButton,
  GoASkeleton,
} from '@abgov/react-components';
import { ExportDates, FeedbackFilterError } from '../styled-components';
import { useNavigate } from 'react-router-dom';
import { renderNoItem } from '@components/NoItem';

interface VisibleProps {
  visible: boolean;
}

const Visible = styled.div<VisibleProps>`
  visibility: ${(props) => `${props.visible ? 'visible' : 'hidden'}`};
`;

export const FeedbacksList = (): JSX.Element => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const sites = useSelector((state: RootState) => state.feedback.sites);
  const tenantName = useSelector((state: RootState) => state?.tenant?.name);
  const indicator = useSelector((state: RootState) => state?.session?.indicator);

  const [selectedSite, setSelectedSite] = useState('');
  const [searchCriteria, setSearchCriteria] = useState(getDefaultSearchCriteria());
  const [showDateError, setShowDateError] = useState(false);

  useEffect(() => {
    dispatch(getFeedbackSites());
  }, [dispatch]);

  const isSearchCriteriaValid = (criteria: FeedbackSearchCriteria) => {
    return new Date(criteria.startDate) <= new Date(criteria.endDate);
  };

  const handleStartDateChange = (name, value) => {
    const startDate = new Date(value).toISOString();
    const updatedCriteria = { ...searchCriteria, startDate };
    setSearchCriteria(updatedCriteria);
    setShowDateError(!isSearchCriteriaValid(updatedCriteria));
  };

  const handleEndDateChange = (name, value) => {
    const endDate = new Date(value).toISOString();
    const updatedCriteria = { ...searchCriteria, endDate };
    setSearchCriteria(updatedCriteria);
    setShowDateError(!isSearchCriteriaValid(updatedCriteria));
  };

  const handleGetFeedback = () => {
    navigate(
      `/admin/services/feedback/results?site=${selectedSite}&start=${searchCriteria.startDate}&end=${searchCriteria.endDate}`
    );
  };

  return (
    <section>
      {!sites && renderNoItem('feedback')}
      {!indicator.show && sites && Object.keys(sites).length === 0 && renderNoItem('feedback')}

      {sites && Object.keys(sites).length > 0 && (
        <div>
          <GoAFormItem label="Registered sites">
            {indicator.show && Object.keys(sites).length === 0 && <GoASkeleton type="text" />}
            {Object.keys(sites).length > 0 && (
              <GoADropdown
                name="Sites"
                value={selectedSite}
                onChange={(name, site: string) => setSelectedSite(site)}
                width="100%"
                testId="sites-dropdown"
                relative={true}
              >
                {sites.map((item) => (
                  <GoADropdownItem key={item.url} label={item.url} value={item.url} />
                ))}
              </GoADropdown>
            )}
          </GoAFormItem>

          <ExportDates>
            <GoAFormItem label="Start date">
              <GoAInputDate
                width="30ch"
                name="feedback-filter-start-date"
                value={selectedSite && searchCriteria.startDate}
                disabled={!selectedSite}
                onChange={handleStartDateChange}
                testId="startDate"
              />
            </GoAFormItem>

            <GoAFormItem label="End date">
              <GoAInputDate
                width="30ch"
                name="feedback-filter-end-date"
                value={selectedSite && searchCriteria.endDate}
                disabled={!selectedSite}
                onChange={handleEndDateChange}
                testId="endDate"
              />
            </GoAFormItem>
          </ExportDates>

          {showDateError && (
            <div>
              <GoABadge type="emergency" icon />
              <FeedbackFilterError>Start date must be before End date.</FeedbackFilterError>
            </div>
          )}

          <GoAButton type="primary" onClick={handleGetFeedback} disabled={!selectedSite || showDateError}>
            Get Feedback
          </GoAButton>
        </div>
      )}
    </section>
  );
};
