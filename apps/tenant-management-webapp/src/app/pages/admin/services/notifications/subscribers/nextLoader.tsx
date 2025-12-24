import { GoabButton } from '@abgov/react-components';
import React, { FunctionComponent } from 'react';
import type { SubscriberSearchCriteria } from '@store/subscription/models';
import { RootState } from '@store/index';
import { useSelector } from 'react-redux';
import { LoadMoreWrapper } from '@components/styled-components';

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
      <LoadMoreWrapper>
        <GoabButton
          testId="next-loader"
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
