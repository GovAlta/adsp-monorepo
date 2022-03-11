import { GoAButton } from '@abgov/react-components';
import React, { FunctionComponent } from 'react';
import type { SubscriberSearchCriteria } from '@store/subscription/models';
import { RootState } from '@store/index';
import { useSelector } from 'react-redux';

interface EventSearchNextProps {
  onSearch?: (searchInfo: SearchInfo) => void;
  searchCriteria: SubscriberSearchCriteria;
  type?: string;
}

interface SearchInfo {
  type?: string | null;
  searchCriteria: SubscriberSearchCriteria;
}

export const NextLoader: FunctionComponent<EventSearchNextProps> = ({ onSearch, searchCriteria, type }) => {
  const next = useSelector((state: RootState) => state.subscription.subscriberSearch.next);

  if (next) {
    return (
      <GoAButton
        onClick={() => {
          searchCriteria.next = next;
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
