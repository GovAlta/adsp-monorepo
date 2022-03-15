import { GoAButton } from '@abgov/react-components';
import React, { FunctionComponent } from 'react';
import type { SubscriptionSearchCriteria } from '@store/subscription/models';
import { RootState } from '@store/index';
import { useSelector } from 'react-redux';

interface SubscriptionSearchNextProps {
  onSearch?: (searchInfo: SearchInfo) => void;
  searchCriteria: SubscriptionSearchCriteria;
  type: string;
}

interface SearchInfo {
  type?: string | null;
  searchCriteria: SubscriptionSearchCriteria;
}

export const SubscriptionNextLoader: FunctionComponent<SubscriptionSearchNextProps> = ({ onSearch, searchCriteria, type }) => {
  const next = useSelector((state: RootState) => state.subscription.typeSubscriptionSearch[type]?.next);

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
