import styled from 'styled-components';

// Subscriptions.tsx
export const Label = styled.label`
  font-weight: bold;
  padding-bottom: 0.5rem;
`;
export const NoSubscriberCallout = styled.div`
  width: 55%;
`;

export const GapVS = styled.div`
  line-height: 1.75rem;
`;

export const ContactInformationWrapper = styled.div`
  padding-bottom: 3.5rem;
`;
export const CalloutWrapper = styled.div`
  padding-top: 2rem;
`;
export const DescriptionWrapper = styled.div`
  padding-bottom: 2.5rem;
`;
export const ContactInformationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  padding-top: 1.5rem;
`;
export const SubscriptionListContainer = styled.div`
  padding-top: 0rem;
`;

export const TableHeaders = styled.thead`
  #action {
    text-align: right;
  }

  #available-channels {
    text-align: center;
  }
`;
