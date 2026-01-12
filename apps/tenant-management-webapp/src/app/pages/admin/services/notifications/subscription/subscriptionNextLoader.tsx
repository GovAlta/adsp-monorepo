import { GoabButton } from '@abgov/react-components';
import React, { FunctionComponent } from 'react';
import type { SubscriptionSearchCriteria } from '@store/subscription/models';
import { RootState } from '@store/index';
import { useSelector } from 'react-redux';
import { LoadMoreWrapper } from '@components/styled-components';

interface SubscriptionSearchNextProps {
  onSearch?: (searchInfo: SearchInfo) => void;
  searchCriteria: SubscriptionSearchCriteria;
  type: string;
}

interface SearchInfo {
  type?: string | null;
  searchCriteria: SubscriptionSearchCriteria;
}

export const SubscriptionNextLoader: FunctionComponent<SubscriptionSearchNextProps> = ({
  onSearch,
  searchCriteria,
  type,
}) => {
  const next = useSelector((state: RootState) => state.subscription.typeSubscriptionSearch[type]?.next);

  if (next) {
    return (
      <LoadMoreWrapper>
        <GoabButton
          testId="subscription-next-loader"
          type="tertiary"
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
          Load more
        </GoabButton>
      </LoadMoreWrapper>
    );
  } else {
    return null;
  }
};
