import { GoAButton } from '@abgov/react-components';
import React, { FunctionComponent } from 'react';
import type { SubscriberSearchCriteria } from '@store/subscription/models';
import { RootState } from '@store/index';
import { useSelector } from 'react-redux';

interface EventSearchNextProps {
  onSearch?: (searchInfo: SearchInfo) => void;
  searchCriteria: SubscriberSearchCriteria;
  type?: string;
  length: number;
}

interface SearchInfo {
  type?: string | null;
  searchCriteria: SubscriberSearchCriteria;
}

export const SubscriptionNextLoader: FunctionComponent<EventSearchNextProps> = ({
  onSearch,
  searchCriteria,
  type,
  length,
}) => {
  const hasNext = useSelector((state: RootState) =>
    state.subscription.subscriptionsHasNext.find((sub) => sub.id === type)
  );

  if (hasNext?.hasNext || length === 10) {
    return (
      <GoAButton
        onClick={() => {
          searchCriteria.next = true;
          const searchInfo: SearchInfo = {
            searchCriteria,
          };
          if (type) {
            searchInfo.type = type;
          }

          onSearch(searchInfo);
        }}
      >
        Load more...
      </GoAButton>
    );
  } else {
    return <></>;
  }
};
