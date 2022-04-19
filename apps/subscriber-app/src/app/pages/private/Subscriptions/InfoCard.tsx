import React, { FC } from 'react';
import styled from 'styled-components';

interface InfoCardProps {
  title: string;
}

export const InfoCard: FC<InfoCardProps> = ({ title, children }) => {
  return (
    <div>
      <InfoCardTitle>{title}</InfoCardTitle>
      <InfoCardContent>{children}</InfoCardContent>
    </div>
  );
};

const InfoCardTitle = styled.div`
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  line-height: 3rem;
  background-color: #0081a2;
  color: white;
  font-weight: 700;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
`;

const InfoCardContent = styled.div`
  padding-top: 1.5rem;
  padding-bottom: 1.5rem;
  padding-left: 1.75rem;
  padding-right: 1.75rem;
  border: 1px solid #dcdcdc;
  background: #ffffff;
`;
