import React from 'react';
import { GoABadge } from '@abgov/react-components';
import { CompletionStatus, BadgeWrapper, CompletionTextHeader, Bar, BarTop } from './styled-components';

export const ApplicationStatus = ({
  completedGroups,
  totalGroups,
}: {
  completedGroups: number;
  totalGroups: number;
}): JSX.Element => {
  const completed = completedGroups;
  const badge =
    totalGroups === completed ? (
      <GoABadge type="success" content="Complete"></GoABadge>
    ) : (
      <GoABadge type="information" content="Incomplete"></GoABadge>
    );
  const mainHeading = 'Application Progress';
  const progressPercentageAccurate = (100 * completed) / totalGroups;

  return (
    <CompletionStatus>
      <CompletionTextHeader>
        {mainHeading}
        <BadgeWrapper>{badge}</BadgeWrapper>
      </CompletionTextHeader>
      <BarTop>
        <div>
          {completed} out of {totalGroups} items completed
        </div>
        <div className="progress-text">{Math.round(progressPercentageAccurate)}%</div>
      </BarTop>
      <Bar>
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progressPercentageAccurate}%` }}></div>
        </div>
      </Bar>
    </CompletionStatus>
  );
};
